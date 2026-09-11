import api from './api';
import { AgentRequest, AskAssistantResponse } from '../types/assistant';

export const assistantService = {
  async ask(question: string): Promise<AskAssistantResponse> {
    const response = await api.post<AskAssistantResponse>('/assistant/ask', { question });
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
