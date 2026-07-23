export interface ColumnMetadata {
  columnName: string;
  dataType: string;
  isNullable: boolean;
  columnDefault?: string | null;
  constraintType?: string | null; // PRIMARY KEY, FOREIGN KEY, UNIQUE
  referencedTable?: string | null;
  referencedColumn?: string | null;
  maxLength?: number | null;
  numericPrecision?: number | null;
  numericScale?: number | null;
}

export interface ForeignKeyRelation {
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
}

export interface TableMetadata {
  tableName: string;
  columns: ColumnMetadata[];
  primaryKeys: string[];
  foreignKeys: ForeignKeyRelation[];
  rowCount?: number;
}

export interface SchemaMetadata {
  tables: TableMetadata[];
  rawCount?: number;
  fetchedAt?: string;
}

export interface User {
  id: number | string;
  googleId: string;
  email: string;
  name: string;
  profilePictureUrl?: string;
  role: 'ADMIN' | 'USER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  lastLoginAt?: string;
}

export interface ChatMessage {
  id: string;
  sessionId?: string;
  userId?: string;
  sender: 'user' | 'assistant';
  type?: 'text' | 'query' | 'error' | 'disambiguation';
  messageText: string;
  title?: string;
  summary?: string;
  answer?: string;
  disambiguationQuestion?: string;
  highlights?: string[];
  sql?: string;
  data?: Record<string, any>[];
  rowCount?: number;
  executionTimeMs?: number;
  suggestedFollowupQuestions?: string[];
  visualizationHint?: string;
  error?: string;
  createdAt: string;
}

export interface ChatSession {
  sessionId: string;
  userId: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
  messages?: ChatMessage[];
}

export interface AiQueryResponse {
  type: 'text' | 'query' | 'disambiguation';
  requiresDatabase: boolean;
  confidence: number;
  question: string;
  title?: string;
  summary?: string;
  answer?: string;
  disambiguationQuestion?: string;
  highlights?: string[];
  relatedObjects?: any;
  resultSummary?: any;
  suggestedFollowupQuestions?: string[];
  visualizationHint?: string;
  sql?: string;
  data?: Record<string, any>[];
  rowCount?: number;
  executionTimeMs?: number;
  error?: string;
}
