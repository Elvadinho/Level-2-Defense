import api from './api';
import {
  Task,
  CreateTaskData,
  TaskComment,
  Subtask,
  CreateSubtaskData,
  TaskAttachment,
  TaskTimeLog,
  CreateTimeLogData,
  TaskWatcher,
  TaskDependency,
  CreateDependencyData,
  TaskActivity,
  TaskTemplate,
  SavedFilter,
} from '../types/project';

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

  // ==================== COMMENT MANAGEMENT ====================
  
  async updateComment(commentId: number, body: string): Promise<TaskComment> {
    const response = await api.put<TaskComment>(`/comments/${commentId}`, { body });
    return response.data;
  },

  async deleteComment(commentId: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/comments/${commentId}`);
    return response.data;
  },

  async addCommentReaction(commentId: number, reactionType: 'like' | 'helpful' | 'resolved'): Promise<TaskComment> {
    const response = await api.post<TaskComment>(`/comments/${commentId}/reactions`, { reaction_type: reactionType });
    return response.data;
  },

  async removeCommentReaction(commentId: number, reactionType: 'like' | 'helpful' | 'resolved'): Promise<TaskComment> {
    const response = await api.delete<TaskComment>(`/comments/${commentId}/reactions`, {
      data: { reaction_type: reactionType },
    });
    return response.data;
  },

  // ==================== SUBTASKS ====================
  
  async getSubtasks(taskId: number): Promise<Subtask[]> {
    const response = await api.get<Subtask[]>(`/tasks/${taskId}/subtasks`);
    return response.data;
  },

  async createSubtask(taskId: number, data: CreateSubtaskData): Promise<Subtask> {
    const response = await api.post<Subtask>(`/tasks/${taskId}/subtasks`, data);
    return response.data;
  },

  async updateSubtask(subtaskId: number, data: Partial<CreateSubtaskData>): Promise<Subtask> {
    const response = await api.put<Subtask>(`/subtasks/${subtaskId}`, data);
    return response.data;
  },

  async toggleSubtaskCompletion(subtaskId: number): Promise<Subtask> {
    const response = await api.post<Subtask>(`/subtasks/${subtaskId}/toggle`);
    return response.data;
  },

  async deleteSubtask(subtaskId: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/subtasks/${subtaskId}`);
    return response.data;
  },

  // ==================== ATTACHMENTS ====================
  
  async getAttachments(taskId: number): Promise<TaskAttachment[]> {
    const response = await api.get<TaskAttachment[]>(`/tasks/${taskId}/attachments`);
    return response.data;
  },

  async uploadAttachment(taskId: number, file: File): Promise<TaskAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<TaskAttachment>(`/tasks/${taskId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteAttachment(attachmentId: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/attachments/${attachmentId}`);
    return response.data;
  },

  // ==================== TIME LOGS ====================
  
  async getTimeLogs(taskId: number): Promise<{ time_logs: TaskTimeLog[]; total_hours: number }> {
    const response = await api.get<{ time_logs: TaskTimeLog[]; total_hours: number }>(`/tasks/${taskId}/time-logs`);
    return response.data;
  },

  async logTime(taskId: number, data: CreateTimeLogData): Promise<TaskTimeLog> {
    const response = await api.post<TaskTimeLog>(`/tasks/${taskId}/time-logs`, data);
    return response.data;
  },

  async updateTimeLog(timeLogId: number, data: Partial<CreateTimeLogData>): Promise<TaskTimeLog> {
    const response = await api.put<TaskTimeLog>(`/time-logs/${timeLogId}`, data);
    return response.data;
  },

  async deleteTimeLog(timeLogId: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/time-logs/${timeLogId}`);
    return response.data;
  },

  // ==================== WATCHERS ====================
  
  async getWatchers(taskId: number): Promise<TaskWatcher[]> {
    const response = await api.get<TaskWatcher[]>(`/tasks/${taskId}/watchers`);
    return response.data;
  },

  async addWatcher(taskId: number, userId: number): Promise<TaskWatcher> {
    const response = await api.post<TaskWatcher>(`/tasks/${taskId}/watchers`, { user_id: userId });
    return response.data;
  },

  async removeWatcher(taskId: number, userId: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/tasks/${taskId}/watchers`, {
      data: { user_id: userId },
    });
    return response.data;
  },

  async toggleWatch(taskId: number): Promise<{ watching: boolean; message: string }> {
    const response = await api.post<{ watching: boolean; message: string }>(`/tasks/${taskId}/watch-toggle`);
    return response.data;
  },

  // ==================== DEPENDENCIES ====================
  
  async getDependencies(taskId: number): Promise<{ dependencies: TaskDependency[]; blocked_tasks: Task[] }> {
    const response = await api.get<{ dependencies: TaskDependency[]; blocked_tasks: Task[] }>(`/tasks/${taskId}/dependencies`);
    return response.data;
  },

  async addDependency(taskId: number, data: CreateDependencyData): Promise<TaskDependency> {
    const response = await api.post<TaskDependency>(`/tasks/${taskId}/dependencies`, data);
    return response.data;
  },

  async removeDependency(dependencyId: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/dependencies/${dependencyId}`);
    return response.data;
  },

  // ==================== ACTIVITY FEED ====================
  
  async getActivities(taskId: number): Promise<TaskActivity[]> {
    const response = await api.get<TaskActivity[]>(`/tasks/${taskId}/activities`);
    return response.data;
  },

  // ==================== TEMPLATES ====================
  
  async getTemplates(): Promise<TaskTemplate[]> {
    const response = await api.get<TaskTemplate[]>('/templates');
    return response.data;
  },

  async createTemplate(data: {
    name: string;
    description?: string;
    priority?: string;
    subtasks?: string[];
    custom_fields?: Record<string, string>;
    is_public?: boolean;
  }): Promise<TaskTemplate> {
    const response = await api.post<TaskTemplate>('/templates', data);
    return response.data;
  },

  async applyTemplate(projectId: number, templateId: number, overrides?: {
    title?: string;
    description?: string;
    assigned_to?: number;
    due_date?: string;
    status?: string;
  }): Promise<Task> {
    const response = await api.post<Task>(`/projects/${projectId}/tasks/from-template/${templateId}`, overrides);
    return response.data;
  },

  async deleteTemplate(templateId: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/templates/${templateId}`);
    return response.data;
  },

  // ==================== SAVED FILTERS ====================
  
  async getSavedFilters(): Promise<SavedFilter[]> {
    const response = await api.get<SavedFilter[]>('/saved-filters');
    return response.data;
  },

  async saveFilter(data: {
    name: string;
    filters: Record<string, any>;
    is_default?: boolean;
  }): Promise<SavedFilter> {
    const response = await api.post<SavedFilter>('/saved-filters', data);
    return response.data;
  },

  async deleteSavedFilter(filterId: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/saved-filters/${filterId}`);
    return response.data;
  },
};
