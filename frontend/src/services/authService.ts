import api from './api';
import { AuthResponse, LoginCredentials, ProfileResponse, RegisterData, User } from '../types/auth';
import { Department } from '../types/employee';

/**
 * Service for interacting with backend Authentication endpoints
 */
export const authService = {
  /**
   * Authenticate an existing user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  /**
   * Register a new user account
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  /**
   * Fetch currently authenticated user's profile
   */
  async getProfile(): Promise<User> {
    const response = await api.get<ProfileResponse>('/auth/profile');
    return response.data.user;
  },

  /**
   * Log out the current user session
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // Even if network or token is invalid on backend, proceed with local logout
    }
  },

  async getUsers(): Promise<User[]> {
    const response = await api.get<User[]>('/auth/users');
    return response.data;
  },

  async createUser(data: RegisterData): Promise<User> {
    const response = await api.post<User>('/auth/users', data);
    return response.data;
  },

  async updateUser(id: number, data: Partial<RegisterData>): Promise<User> {
    const response = await api.put<User>(`/auth/users/${id}`, data);
    return response.data;
  },

  async deleteUser(id: number): Promise<void> {
    await api.delete(`/auth/users/${id}`);
  },

  async getRegistrationDepartments(): Promise<Department[]> {
    const response = await api.get<Department[]>('/auth/departments');
    return response.data;
  },
};
