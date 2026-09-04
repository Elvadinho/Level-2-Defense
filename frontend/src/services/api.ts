import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

/**
 * Storage keys for auth persistence
 */
export const TOKEN_STORAGE_KEY = 'modoo_auth_token';
export const USER_STORAGE_KEY = 'modoo_auth_user';

/**
 * Centralized Axios instance for Modoo API
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000,
});

/**
 * Request Interceptor: Attach bearer token to outgoing requests
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor: Handle global errors and unauthorized responses
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>) => {
    // If receiving 401 Unauthorized, clean invalid tokens
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      // Optional: emit event or let auth context state react
    }

    // Extract the most informative error message from Laravel response
    const errorData = error.response?.data;
    let message = errorData?.message || error.message || 'An unexpected error occurred';

    if (errorData?.errors) {
      const firstErrorField = Object.keys(errorData.errors)[0];
      if (firstErrorField && errorData.errors[firstErrorField]?.[0]) {
        message = errorData.errors[firstErrorField][0];
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
