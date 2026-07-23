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

// Helper function to detect queryResult.queryExecutionError indicators
function isQueryExecutionError(raw: any): boolean {
  if (!raw || typeof raw !== 'object') return false;

  // PRIORITY CHECK 2 MANDATORY PATH: queryResult.queryExecutionError
  if (
    raw.queryResult &&
    typeof raw.queryResult === 'object' &&
    raw.queryResult.queryExecutionError &&
    String(raw.queryResult.queryExecutionError).trim().length > 0
  ) {
    return true;
  }

  // Additional Execution Error checks
  if (raw.isExecutionError === true) return true;
  if (raw.queryExecutionError && String(raw.queryExecutionError).trim().length > 0) return true;

  const candidateStrings = [
    typeof raw.error === 'string' ? raw.error : '',
    typeof raw.message === 'string' ? raw.message : '',
    typeof raw.detail === 'string' ? raw.detail : '',
  ];

  const errorRegex = /query[\s_-]*execution[\s_-]*error/i;
  return candidateStrings.some((str) => errorRegex.test(str));
}

// Helper function to parse AI backend response payload into standardized AiQueryResponse
function parseApiResponse(raw: any, question: string): AiQueryResponse {
  if (!raw) {
    return {
      type: 'text',
      requiresDatabase: false,
      confidence: 0,
      question,
      title: 'Query Result',
      summary: 'No response data received from backend.',
    };
  }

  // PRIORITY CHECK 1: Disambiguation Question Detection
  if (typeof raw === 'object' && raw.disambiguationQuestion) {
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

  // PRIORITY CHECK 2: queryResult.queryExecutionError Detection
  if (isQueryExecutionError(raw)) {
    const errorMsg =
      (raw.queryResult && raw.queryResult.queryExecutionError) ||
      raw.queryExecutionError ||
      raw.error ||
      'Query Execution Error';

    return {
      type: 'unsupported',
      requiresDatabase: false,
      confidence: 1.0,
      question,
      title: 'Operation Not Supported',
      summary:
        'This operation is currently not supported. Please submit a read-only business analysis query or another supported request.',
      answer:
        'This operation is currently not supported. Please submit a read-only business analysis query or another supported request.',
      isExecutionError: true,
      queryExecutionError: String(errorMsg),
      error: String(errorMsg),
    };
  }

  // PRIORITY CHECK 3: Normal Response Data & Table Extraction
  let dataRows: Record<string, any>[] | undefined = undefined;
  let rowCount = raw.rowCount || 0;

  if (Array.isArray(raw.data)) {
    dataRows = raw.data;
    rowCount = raw.rowCount || dataRows?.length || 0;
  } else if (raw.queryResult) {
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
  } else if (Array.isArray(raw)) {
    const rawArr: Record<string, any>[] = raw;
    dataRows = rawArr;
    rowCount = rawArr.length;
  }

  return {
    type: raw.type || 'query',
    requiresDatabase: raw.requiresDatabase !== undefined ? raw.requiresDatabase : true,
    confidence: raw.confidence || 1.0,
    question,
    title: raw.title || 'Database Query Result',
    summary: raw.summary || raw.naturalLanguageAnswer || raw.intentExplanation || 'Query executed successfully.',
    answer: raw.answer || raw.naturalLanguageAnswer || raw.intentExplanation,
    highlights: raw.highlights,
    sql: raw.sql || raw.generatedQuery,
    data: dataRows,
    rowCount: rowCount || (dataRows ? dataRows.length : 0),
    executionTimeMs: raw.executionTimeMs,
    suggestedFollowupQuestions: raw.suggestedFollowupQuestions,
    visualizationHint: raw.visualizationHint,
    error: raw.error,
  };
}

export const chatService = {
  /**
   * Send natural language query to primary backend endpoint (http://localhost:8080/api/ai/query).
   */
  async sendQuery(question: string, userId: string): Promise<AiQueryResponse> {
    try {
      // Primary Backend Endpoint Call: Spring Boot /api/ai/query (http://localhost:8080)
      const response = await api.post('/api/ai/query', {
        question,
        userId,
      });

      return parseApiResponse(response.data, question);
    } catch (primaryErr: any) {
      console.warn(
        'Primary Spring Boot backend (/api/ai/query) call failed, attempting FastAPI fallback:',
        primaryErr?.message
      );

      try {
        const targetUrl = import.meta.env.DEV ? '/fastapi/ask' : FASTAPI_ENDPOINT;
        const fallbackResponse = await axios.post(
          targetUrl,
          { prompt: question },
          { headers: { 'Content-Type': 'application/json' } }
        );

        return parseApiResponse(fallbackResponse.data, question);
      } catch (fallbackErr: any) {
        console.error('All AI backend endpoints failed:', fallbackErr?.message);
        throw primaryErr;
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
