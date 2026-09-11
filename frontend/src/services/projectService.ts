import api from './api';
import { Project, CreateProjectData, ProjectMember } from '../types/project';

export const projectService = {
  async getProjects(): Promise<Project[]> {
    const response = await api.get<Project[]>('/projects');
    return response.data;
  },

  async getProject(id: number): Promise<Project> {
    const response = await api.get<Project>(`/projects/${id}`);
    return response.data;
  },

  async createProject(data: CreateProjectData): Promise<Project> {
    const response = await api.post<Project>('/projects', data);
    return response.data;
  },

  async updateProject(id: number, data: Partial<CreateProjectData>): Promise<Project> {
    const response = await api.put<Project>(`/projects/${id}`, data);
    return response.data;
  },

  async deleteProject(id: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/projects/${id}`);
    return response.data;
  },

  async getMembers(projectId: number): Promise<ProjectMember[]> {
    const response = await api.get<ProjectMember[]>(`/projects/${projectId}/members`);
    return response.data;
  },

  async addMember(
    projectId: number,
    payloadOrEmpId: number | { employee_id: number; role?: string },
    role: string = 'member'
  ): Promise<{ message: string }> {
    const payload =
      typeof payloadOrEmpId === 'object'
        ? { employee_id: payloadOrEmpId.employee_id, role: payloadOrEmpId.role || role }
        : { employee_id: payloadOrEmpId, role };
    const response = await api.post<{ message: string }>(`/projects/${projectId}/members`, payload);
    return response.data;
  },

  async removeMember(projectId: number, employeeId: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/projects/${projectId}/members/${employeeId}`);
    return response.data;
  },
};
