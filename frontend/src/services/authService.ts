import api from './api';
import { AuthResponse, LoginCredentials, ProfileResponse, RegisterData, User } from '../types/auth';

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
};
