import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthContextType, LoginCredentials, RegisterData, User, UserRole } from '../types/auth';
import { authService } from '../services/authService';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem(USER_STORAGE_KEY);
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * Verify session on startup and fetch fresh profile if token exists
   */
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (storedToken) {
        try {
          const freshUser = await authService.getProfile();
          setUser(freshUser);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(freshUser));
        } catch {
          // Token expired or invalid
          setUser(null);
          setToken(null);
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          localStorage.removeItem(USER_STORAGE_KEY);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Login handler
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Registration handler
   */
  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await authService.register(data);
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout handler
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      setIsLoading(false);
    }
  }, []);

  /**
   * Role validation helper
   */
  const hasRole = useCallback(
    (roles: UserRole | UserRole[]): boolean => {
      if (!user) return false;
      if (Array.isArray(roles)) {
        return roles.includes(user.role);
      }
      return user.role === roles;
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to access Auth Context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
