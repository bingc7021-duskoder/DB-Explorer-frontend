import React from 'react';
import { User } from '../../types';
import { Header } from './Header';
import { ResizablePanel } from './ResizablePanel';
import { ERViewer } from '../ERDiagram/ERViewer';
import { ChatWindow } from '../Chat/ChatWindow';
import { useSchema } from '../../hooks/useSchema';
import { useChat } from '../../hooks/useChat';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const { schema, mermaidSyntax, isLoading: schemaLoading, error: schemaError, refreshSchema } = useSchema();
  const {
    sessions,
    activeSessionId,
    activeSessionTitle,
    messages,
    isLoading: chatLoading,
    selectSession,
    createNewSession,
    deleteSession,
    sendMessage,
    clearChat,
  } = useChat(String(user.id || 'user-1'));

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans relative">
      {/* Top Header Bar with Inline Top-Right Notification & Profile Transition */}
      <Header user={user} onLogout={onLogout} />

      {/* Main Workspace (ER Diagram & AI Chat Assistant) */}
      <div className="flex-1 w-full h-full overflow-hidden relative">
        <ResizablePanel
          leftComponent={
            <ERViewer
              schema={schema}
              mermaidSyntax={mermaidSyntax}
              isLoading={schemaLoading}
              error={schemaError}
              onRefreshSchema={refreshSchema}
            />
          }
          rightComponent={
            <ChatWindow
              sessions={sessions}
              activeSessionId={activeSessionId}
              activeSessionTitle={activeSessionTitle}
              messages={messages}
              isLoading={chatLoading}
              onSendMessage={sendMessage}
              onSelectSession={selectSession}
              onCreateNewSession={createNewSession}
              onDeleteSession={deleteSession}
              onClearChat={clearChat}
            />
          }
          initialLeftWidthPercent={70}
          minLeftWidthPercent={50}
          maxLeftWidthPercent={85}
        />
      </div>
    </div>
  );
};
