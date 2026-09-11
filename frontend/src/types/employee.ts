import { User } from './auth';

export type EmploymentStatus = 'active' | 'probation' | 'terminated' | 'on_leave';

export interface Department {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Employee {
  id: number;
  user_id: number;
  department_id: number;
  job_title: string;
  salary: number | string;
  hire_date: string;
  status: EmploymentStatus;
  phone?: string;
  address?: string;
  emergency_contact?: string;
  user?: User;
  department?: Department;
  created_at?: string;
  updated_at?: string;
}

export interface CreateEmployeeData {
  name: string;
  email: string;
  password?: string;
  password_confirmation?: string;
  department_id: number;
  job_title: string;
  salary: number;
  hire_date: string;
  status?: EmploymentStatus;
  phone?: string;
  address?: string;
  role?: string;
}

export interface UpdateEmployeeData {
  name?: string;
  email?: string;
  department_id?: number;
  job_title?: string;
  salary?: number;
  hire_date?: string;
  status?: EmploymentStatus;
  phone?: string;
  address?: string;
}
