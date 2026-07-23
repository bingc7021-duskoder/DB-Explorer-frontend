import axios from 'axios';
import { ChatMessage, AiQueryResponse, ChatSession } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const FASTAPI_ENDPOINT =
  import.meta.env.VITE_FASTAPI_URL || 'https://querydata-fastapi-114564247435.us-central1.run.app/ask';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to detect Query Execution Error indicators
function isQueryExecutionError(raw: any): boolean {
  if (!raw) return false;
  if (raw.isExecutionError === true || raw.queryExecutionError || raw.executionError) return true;

  const candidateStrings = [
    typeof raw === 'string' ? raw : '',
    typeof raw.error === 'string' ? raw.error : '',
    typeof raw.message === 'string' ? raw.message : '',
    typeof raw.detail === 'string' ? raw.detail : '',
    typeof raw.status === 'string' ? raw.status : '',
  ];

  const errorRegex = /query[\s_-]*execution[\s_-]*error/i;
  return candidateStrings.some((str) => errorRegex.test(str));
}

// Helper function to parse FastAPI response payload into standardized AiQueryResponse
function parseFastApiResponse(raw: any, question: string): AiQueryResponse {
  // PRIORITY CHECK 1: Disambiguation Question Detection
  if (raw && typeof raw === 'object' && raw.disambiguationQuestion) {
    return {
      type: 'disambiguation',
      requiresDatabase: false,
      confidence: 1.0,
      question,
      title: 'Business Analysis Assistant',
      summary: 'Please rephrase your query with a business or analytics focus.',
      answer: String(raw.disambiguationQuestion),
      disambiguationQuestion: String(raw.disambiguationQuestion),
    };
  }

  if (typeof raw === 'string' && raw.includes('disambiguationQuestion')) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.disambiguationQuestion) {
        return {
          type: 'disambiguation',
          requiresDatabase: false,
          confidence: 1.0,
          question,
          title: 'Business Analysis Assistant',
          summary: 'Please rephrase your query with a business or analytics focus.',
          answer: String(parsed.disambiguationQuestion),
          disambiguationQuestion: String(parsed.disambiguationQuestion),
        };
      }
    } catch (e) {}
  }

  // PRIORITY CHECK 2: Query Execution Error / Unsupported Operation Detection
  if (isQueryExecutionError(raw)) {
    return {
      type: 'unsupported',
      requiresDatabase: false,
      confidence: 1.0,
      question,
      title: 'Operation Not Available',
      summary: 'This operation is currently not supported. Please try a different request or ask a business analysis-related question.',
      answer: 'This operation is currently not supported. Please try a different request or ask a business analysis-related question.',
      isExecutionError: true,
      error: 'Query Execution Error',
    };
  }

  // Normal Response Data Extraction
  let dataRows: Record<string, any>[] | undefined = undefined;
  let rowCount = 0;

  if (raw.queryResult) {
    if (Array.isArray(raw.queryResult.columns) && Array.isArray(raw.queryResult.rows)) {
      const colNames = raw.queryResult.columns.map((c: any) =>
        typeof c === 'object' && c !== null ? c.name : String(c)
      );
      dataRows = raw.queryResult.rows.map((r: any) => {
        const rowObj: Record<string, any> = {};
        const vals = Array.isArray(r.values)
          ? r.values.map((v: any) => (v && typeof v === 'object' && 'value' in v ? v.value : v))
          : [];
        colNames.forEach((col: string, idx: number) => {
          rowObj[col] = vals[idx] !== undefined ? vals[idx] : null;
        });
        return rowObj;
      });
      rowCount = parseInt(raw.queryResult.totalRowCount, 10) || (dataRows ? dataRows.length : 0);
    } else if (Array.isArray(raw.queryResult)) {
      const queryResultArr: Record<string, any>[] = raw.queryResult;
      dataRows = queryResultArr;
      rowCount = queryResultArr.length;
    }
  } else if (Array.isArray(raw.data)) {
    const dataArr: Record<string, any>[] = raw.data;
    dataRows = dataArr;
    rowCount = dataArr.length;
  } else if (Array.isArray(raw)) {
    const rawArr: Record<string, any>[] = raw;
    dataRows = rawArr;
    rowCount = rawArr.length;
  }

  return {
    type: 'query',
    requiresDatabase: true,
    confidence: 1.0,
    question,
    title: 'Database Query Result',
    summary: raw.naturalLanguageAnswer || raw.intentExplanation || 'Query executed successfully.',
    answer: raw.naturalLanguageAnswer || raw.intentExplanation,
    sql: raw.generatedQuery || raw.sql,
    data: dataRows,
    rowCount: rowCount || (dataRows ? dataRows.length : 0),
  };
}

export const chatService = {
  /**
   * Send natural language query to FastAPI backend endpoint with fallback handling.
   * Target Endpoint: POST https://querydata-fastapi-114564247435.us-central1.run.app/ask
   */
  async sendQuery(question: string, userId: string): Promise<AiQueryResponse> {
    try {
      const targetUrl = import.meta.env.DEV ? '/fastapi/ask' : FASTAPI_ENDPOINT;

      const response = await axios.post(
        targetUrl,
        { prompt: question },
        { headers: { 'Content-Type': 'application/json' } }
      );

      return parseFastApiResponse(response.data, question);
    } catch (fastApiErr: any) {
      console.warn(
        'FastAPI endpoint call failed (network/CORS issue). Attempting direct Cloud Run fallback...',
        fastApiErr?.message
      );

      try {
        const directResponse = await axios.post(
          FASTAPI_ENDPOINT,
          { prompt: question },
          { headers: { 'Content-Type': 'application/json' } }
        );
        return parseFastApiResponse(directResponse.data, question);
      } catch (directErr: any) {
        console.warn(
          'FastAPI direct call failed. Falling back to Spring Boot AI backend (/api/ai/query)...',
          directErr?.message
        );

        const springResponse = await api.post('/api/ai/query', {
          question,
          userId,
        });

        // Priority 1 Check: disambiguationQuestion
        if (springResponse.data && springResponse.data.disambiguationQuestion) {
          return {
            type: 'disambiguation',
            requiresDatabase: false,
            confidence: 1.0,
            question,
            title: 'Business Analysis Assistant',
            summary: 'Please rephrase your query with a business or analytics focus.',
            answer: String(springResponse.data.disambiguationQuestion),
            disambiguationQuestion: String(springResponse.data.disambiguationQuestion),
          };
        }

        // Priority 2 Check: Query Execution Error
        if (isQueryExecutionError(springResponse.data)) {
          return {
            type: 'unsupported',
            requiresDatabase: false,
            confidence: 1.0,
            question,
            title: 'Operation Not Available',
            summary: 'This operation is currently not supported. Please try a different request or ask a business analysis-related question.',
            answer: 'This operation is currently not supported. Please try a different request or ask a business analysis-related question.',
            isExecutionError: true,
            error: 'Query Execution Error',
          };
        }

        return springResponse.data;
      }
    }
  },

  /**
   * Fetch all Chat Sessions for logged-in user (ordered by updatedAt DESC).
   */
  async getChatSessions(userId: string): Promise<ChatSession[]> {
    const response = await api.get(`/api/chat/sessions`, {
      params: { userId },
    });
    return response.data;
  },

  /**
   * Fetch details and complete message history for a specific Chat Session.
   */
  async getChatSessionDetails(sessionId: string): Promise<ChatSession> {
    const response = await api.get(`/api/chat/sessions/${sessionId}`);
    return response.data;
  },

  /**
   * Create a new ChatSession for user.
   */
  async createChatSession(userId: string, title: string = 'New Chat'): Promise<ChatSession> {
    const response = await api.post('/api/chat/sessions', {
      userId,
      title,
    });
    return response.data;
  },

  /**
   * Delete a ChatSession and its messages.
   */
  async deleteChatSession(sessionId: string): Promise<void> {
    await api.delete(`/api/chat/sessions/${sessionId}`);
  },

  /**
   * Save chat message under a ChatSession to persistent backend storage.
   */
  async saveChatMessage(
    userId: string,
    sessionId: string,
    message: ChatMessage
  ): Promise<{ status: string; sessionId: string; title: string }> {
    try {
      const response = await api.post('/api/chat/message', {
        ...message,
        userId,
        sessionId,
      });
      return response.data;
    } catch (err) {
      console.warn('Could not persist message to backend:', err);
      return { status: 'ERROR', sessionId, title: 'New Chat' };
    }
  },

  /**
   * Legacy chat history fetcher.
   */
  async getChatHistory(userId: string): Promise<ChatMessage[]> {
    const response = await api.get(`/api/chat/history/${userId}`);
    return response.data;
  },
};
