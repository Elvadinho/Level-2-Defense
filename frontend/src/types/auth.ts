/**
 * Authentication and User Types for Modoo
 */

// Available user roles in the system matching backend Enum
export type UserRole =
  | 'admin'
  | 'hr_manager'
  | 'project_manager'
  | 'employee'
  | 'accountant'
  | 'customer'
  | 'intern';

// User model structure returned from backend
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  email_verified_at?: string | null;
  remote_checkin_authorized?: boolean;
  created_at?: string;
  updated_at?: string;
  employee?: {
    id: number;
    department_id: number;
    job_title: string;
    hire_date: string;
  } | null;
}

// Credentials required for user login
export interface LoginCredentials {
  email: string;
  password: string;
}

// Data required for user registration
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role?: UserRole;
  department_id?: number;
  job_title?: string;
  hire_date?: string;
}

// Authentication response structure from API endpoints
export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

// Profile response structure
export interface ProfileResponse {
  user: User;
}

// Authentication context state
export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  loginAsDemo: (role: UserRole) => void;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}
