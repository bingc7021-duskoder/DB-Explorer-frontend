import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage, ChatSession } from '../types';
import { chatService } from '../services/chatService';

export const useChat = (userId: string = 'user-1') => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSessionTitle, setActiveSessionTitle] = useState<string>('New Chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sessionsLoading, setSessionsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const initialLoadedRef = useRef<boolean>(false);

  // Load message history for a single session
  const loadSessionMessages = useCallback(async (sessionId: string) => {
    try {
      const details = await chatService.getChatSessionDetails(sessionId);
      if (details && Array.isArray(details.messages)) {
        setMessages(details.messages);
        if (details.title) {
          setActiveSessionTitle(details.title);
        }
      }
    } catch (err: any) {
      console.warn('Could not load session messages:', err?.message);
    }
  }, []);

  // Fetch all chat sessions for user
  const loadSessions = useCallback(async () => {
    if (!userId) return;
    setSessionsLoading(true);
    try {
      const fetchedSessions = await chatService.getChatSessions(userId);
      setSessions(fetchedSessions);

      if (fetchedSessions.length > 0) {
        const firstSession = fetchedSessions[0];
        setActiveSessionId(firstSession.sessionId);
        setActiveSessionTitle(firstSession.title || 'New Chat');
        loadSessionMessages(firstSession.sessionId);
      } else {
        // Create initial session if user has none
        const newSession = await chatService.createChatSession(userId, 'New Chat');
        setSessions([newSession]);
        setActiveSessionId(newSession.sessionId);
        setActiveSessionTitle(newSession.title);
        setMessages([]);
      }
    } catch (err: any) {
      console.warn('Sessions load notice:', err?.message);
    } finally {
      setSessionsLoading(false);
    }
  }, [userId, loadSessionMessages]);

  useEffect(() => {
    if (!initialLoadedRef.current) {
      initialLoadedRef.current = true;
      loadSessions();
    }
  }, [loadSessions]);

  // Select a session from the sidebar
  const selectSession = (sessionId: string) => {
    if (sessionId === activeSessionId) return;
    const session = sessions.find((s) => s.sessionId === sessionId);
    if (session) {
      setActiveSessionId(sessionId);
      setActiveSessionTitle(session.title || 'New Chat');
      loadSessionMessages(sessionId);
    }
  };

  // Create a brand new session
  const createNewSession = async () => {
    try {
      const newSession = await chatService.createChatSession(userId, 'New Chat');
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.sessionId);
      setActiveSessionTitle('New Chat');
      setMessages([]);
      return newSession.sessionId;
    } catch (err: any) {
      console.error('Failed to create new session:', err);
      const fallbackId = `session-${Date.now()}`;
      setActiveSessionId(fallbackId);
      setActiveSessionTitle('New Chat');
      setMessages([]);
      return fallbackId;
    }
  };

  // Delete a session
  const deleteSession = async (sessionId: string) => {
    try {
      await chatService.deleteChatSession(sessionId);
      const remaining = sessions.filter((s) => s.sessionId !== sessionId);
      setSessions(remaining);

      if (activeSessionId === sessionId) {
        if (remaining.length > 0) {
          selectSession(remaining[0].sessionId);
        } else {
          createNewSession();
        }
      }
    } catch (err: any) {
      console.error('Failed to delete session:', err);
    }
  };

  // Send message in current active session
  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    let targetSessionId = activeSessionId;
    if (!targetSessionId) {
      targetSessionId = await createNewSession();
    }
    if (!targetSessionId) {
      targetSessionId = `session-${Date.now()}`;
      setActiveSessionId(targetSessionId);
    }

    const currentSessionId = targetSessionId;

    // 1. Instantly append User Message to UI
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sessionId: currentSessionId,
      sender: 'user',
      messageText: trimmed,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    // Asynchronously persist User message to backend DB (fire-and-forget)
    chatService.saveChatMessage(userId, currentSessionId, userMsg).then((res) => {
      if (res && res.title && res.title !== 'New Chat') {
        setActiveSessionTitle(res.title);
        setSessions((prev) =>
          prev.map((s) => (s.sessionId === currentSessionId ? { ...s, title: res.title } : s))
        );
      }
    });

    // 2. Call AI Backend API
    try {
      const response = await chatService.sendQuery(trimmed, userId);

      // 3. Instantly append Assistant Message to UI
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sessionId: currentSessionId,
        sender: 'assistant',
        type:
          response.type ||
          (response.disambiguationQuestion ? 'disambiguation' : response.sql ? 'query' : 'text'),
        messageText: response.answer || response.summary || 'Query processed.',
        title: response.title,
        summary: response.summary,
        answer: response.answer,
        disambiguationQuestion: response.disambiguationQuestion,
        highlights: response.highlights,
        sql: response.sql,
        data: response.data,
        rowCount: response.rowCount,
        executionTimeMs: response.executionTimeMs,
        suggestedFollowupQuestions: response.suggestedFollowupQuestions,
        visualizationHint: response.visualizationHint,
        error: response.error,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Asynchronously persist Assistant message to backend DB (fire-and-forget)
      chatService.saveChatMessage(userId, currentSessionId, assistantMsg).then((res) => {
        if (res && res.title && res.title !== 'New Chat') {
          setActiveSessionTitle(res.title);
          setSessions((prev) =>
            prev.map((s) => (s.sessionId === currentSessionId ? { ...s, title: res.title } : s))
          );
        }
      });
    } catch (err: any) {
      console.error('Live AI Query failed:', err);
      const errorText = err.response?.data?.error || err.message || 'Failed to process AI query.';

      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        sessionId: currentSessionId,
        sender: 'assistant',
        type: 'error',
        messageText: `API Error: ${errorText}`,
        error: errorText,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (activeSessionId) {
      deleteSession(activeSessionId);
    } else {
      setMessages([]);
    }
  };

  return {
    sessions,
    activeSessionId,
    activeSessionTitle,
    messages,
    isLoading,
    sessionsLoading,
    error,
    selectSession,
    createNewSession,
    deleteSession,
    sendMessage,
    clearChat,
    refreshSessions: loadSessions,
  };
};
