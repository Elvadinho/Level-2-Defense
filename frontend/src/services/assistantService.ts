import api from './api';
import { AgentRequest, AskAssistantResponse } from '../types/assistant';

export const assistantService = {
  async ask(question: string): Promise<AskAssistantResponse> {
    // The backend allows up to 120s for the LLM call to complete, so this
    // request needs a longer timeout than the global Axios default.
    const response = await api.post<AskAssistantResponse>(
      '/assistant/ask',
      { question },
      { timeout: 130000 }
    );
    return response.data;
  },

  async confirm(agentRequestId: number, approve: boolean): Promise<AskAssistantResponse> {
    const response = await api.post<AskAssistantResponse>('/assistant/confirm', {
      agent_request_id: agentRequestId,
      confirm: approve,
    });
    return response.data;
  },

  async getHistory(): Promise<AgentRequest[]> {
    const response = await api.get<AgentRequest[]>('/assistant/history');
    return response.data;
  },

  async getActions(): Promise<Record<string, unknown>> {
    const response = await api.get<Record<string, unknown>>('/assistant/actions');
    return response.data;
  },

  async getRequest(id: number): Promise<AgentRequest> {
    const response = await api.get<AgentRequest>(`/assistant/request/${id}`);
    return response.data;
  },
};
