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
  is_edited?: boolean;
  edited_at?: string;
  reactions?: Record<string, number>; // { like: 5, helpful: 2, resolved: 1 }
  user?: User;
  created_at?: string;
  updated_at?: string;
}

export interface Subtask {
  id: number;
  task_id: number;
  title: string;
  description?: string;
  is_completed: boolean;
  assigned_to?: number;
  assignee?: Employee;
  order: number;
  created_at?: string;
  updated_at?: string;
}

export interface TaskAttachment {
  id: number;
  task_id: number;
  uploaded_by: number;
  filename: string;
  original_filename: string;
  file_path: string;
  mime_type?: string;
  file_size?: number;
  uploader?: User;
  created_at?: string;
  updated_at?: string;
}

export interface TaskTimeLog {
  id: number;
  task_id: number;
  user_id: number;
  hours: number;
  description?: string;
  log_date: string;
  user?: User;
  created_at?: string;
  updated_at?: string;
}

export interface TaskWatcher {
  id: number;
  task_id: number;
  user_id: number;
  user?: User;
  created_at?: string;
  updated_at?: string;
}

export interface TaskDependency {
  id: number;
  task_id: number;
  depends_on_task_id: number;
  dependency_type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
  dependsOnTask?: Task;
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
  start_date?: string;
  sprint?: string;
  story_points?: number;
  is_archived?: boolean;
  assignee?: Employee;
  assigned_employee?: Employee;
  project?: Project;
  comments?: TaskComment[];
  subtasks?: Subtask[];
  attachments?: TaskAttachment[];
  timeLogs?: TaskTimeLog[];
  watchers?: TaskWatcher[];
  dependencies?: TaskDependency[];
  activities?: TaskActivity[];
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

export interface CreateSubtaskData {
  title: string;
  description?: string;
  assigned_to?: number;
  order?: number;
}

export interface CreateTimeLogData {
  hours: number;
  description?: string;
  log_date: string;
}

export interface CreateDependencyData {
  depends_on_task_id: number;
  dependency_type?: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
}

export interface TaskActivity {
  id: number;
  task_id: number;
  user_id: number;
  action: string;
  description?: string;
  changes?: Record<string, any>;
  user?: User;
  created_at?: string;
  updated_at?: string;
}

export interface TaskTemplate {
  id: number;
  created_by: number;
  name: string;
  description?: string;
  priority: TaskPriority;
  subtasks?: string[];
  custom_fields?: Record<string, string>;
  template_data?: {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    custom_fields?: Record<string, string>;
  };
  is_public: boolean;
  creator?: User;
  created_at?: string;
  updated_at?: string;
}

export interface SavedFilter {
  id: number;
  user_id: number;
  name: string;
  filters: Record<string, any>;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}
