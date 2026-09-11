export interface AgentRequest {
  id: number;
  user_id: number;
  question?: string;
  query?: string;
  intent?: 'information' | 'action' | 'query' | string;
  status: 'pending' | 'pending_confirmation' | 'done' | 'completed' | 'failed' | 'cancelled' | string;
  parsed_action?: {
    name: string;
    params: Record<string, unknown>;
  } | null;
  explanation?: string;
  result?: string | null;
  error_log?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  status?: 'pending' | 'pending_confirmation' | 'done' | 'completed' | 'failed' | 'cancelled' | 'executed' | string;
  intent?: 'information' | 'action' | 'query' | string;
  action?: string;
  data?: unknown;
  agent_request_id?: number;
}

export interface AskAssistantResponse {
  agent_request_id?: number;
  status: string;
  intent?: string;
  action?: string;
  explanation?: string;
  data?: unknown;
  error?: string;
}
