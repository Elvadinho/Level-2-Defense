import { Employee } from './employee';
import { User } from './auth';

export type ProjectStatus = 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled' | 'active';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled' | string;
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ProjectMember {
  id: number;
  project_id: number;
  employee_id: number;
  role: string;
  employee?: Employee;
  user?: User;
}

export interface TaskComment {
  id: number;
  task_id: number;
  user_id: number;
  body: string;
  user?: User;
  created_at?: string;
  updated_at?: string;
}

export interface Task {
  id: number;
  project_id: number;
  assigned_to?: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  assignee?: Employee;
  assigned_employee?: Employee;
  project?: Project;
  comments?: TaskComment[];
  custom_fields?: Record<string, string>;
  created_at?: string;
  updated_at?: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  status: ProjectStatus;
  budget?: number | string;
  manager_id?: number;
  manager?: Employee;
  members?: ProjectMember[];
  tasks?: Task[];
  tasks_count?: number;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  status?: ProjectStatus;
  budget?: number;
  manager_id?: number;
}

export interface CreateTaskData {
  project_id?: number;
  title: string;
  description?: string;
  assigned_to?: number;
  priority?: TaskPriority;
  status?: TaskStatus;
  due_date?: string;
}
