import axios from 'axios';
import { ChatMessage, AiQueryResponse, ChatSession } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const chatService = {
  /**
   * Send natural language question to backend AI processing pipeline.
   */
  async sendQuery(question: string, userId: string): Promise<AiQueryResponse> {
    const response = await api.post('/api/ai/query', {
      question,
      userId,
    });
    return response.data;
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
   * Returns saved response containing updated session title (if AI title was generated).
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
