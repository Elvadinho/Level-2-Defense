import api from './api';
import { Task, CreateTaskData, TaskComment } from '../types/project';

export const taskService = {
  async getTasksByProject(projectId: number): Promise<Task[]> {
    const response = await api.get<Task[]>(`/projects/${projectId}/tasks`);
    return response.data;
  },

  async createTask(projectId: number, data: CreateTaskData): Promise<Task> {
    const response = await api.post<Task>(`/projects/${projectId}/tasks`, data);
    return response.data;
  },

  async getTask(id: number): Promise<Task> {
    const response = await api.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  async updateTask(id: number, data: Partial<CreateTaskData>): Promise<Task> {
    const response = await api.put<Task>(`/tasks/${id}`, data);
    return response.data;
  },

  async deleteTask(id: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/tasks/${id}`);
    return response.data;
  },

  async getComments(taskId: number): Promise<TaskComment[]> {
    const response = await api.get<TaskComment[]>(`/tasks/${taskId}/comments`);
    return response.data;
  },

  async addComment(taskId: number, body: string): Promise<TaskComment> {
    const response = await api.post<TaskComment>(`/tasks/${taskId}/comments`, { body });
    return response.data;
  },
};
