import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthContextType, LoginCredentials, RegisterData, User, UserRole } from '../types/auth';
import { authService } from '../services/authService';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_TOKEN_PREFIX = 'demo_token_';

const DEMO_USERS: Record<UserRole, User> = {
  admin: {
    id: 1,
    name: 'Marc Ekwalla (Admin)',
    email: 'admin@modoo.cm',
    role: 'admin',
    created_at: '2026-01-15T08:00:00Z',
  },
  hr_manager: {
    id: 2,
    name: 'Therese Nguemo (HR)',
    email: 'hr@modoo.cm',
    role: 'hr_manager',
    created_at: '2026-03-01T08:00:00Z',
  },
  project_manager: {
    id: 3,
    name: 'Alexandre Kamdem (PM)',
    email: 'pm@modoo.cm',
    role: 'project_manager',
    created_at: '2026-02-15T08:00:00Z',
  },
  accountant: {
    id: 5,
    name: 'Carine Eyenga (Accountant)',
    email: 'accountant@modoo.cm',
    role: 'accountant',
    created_at: '2026-04-10T08:00:00Z',
  },
  employee: {
    id: 4,
    name: 'David Mballa (Employee)',
    email: 'david@modoo.cm',
    role: 'employee',
    created_at: '2026-06-01T08:00:00Z',
  },
  customer: {
    id: 10,
    name: 'PixelForge Studio (Customer)',
    email: 'projects@pixelforge.cm',
    role: 'customer',
    created_at: '2026-01-20T09:00:00Z',
  },
  intern: {
    id: 11,
    name: 'Junior Fomba (Intern)',
    email: 'intern@modoo.cm',
    role: 'intern',
    created_at: '2026-08-01T08:00:00Z',
  },
};

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
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);

      if (storedToken) {
        // If demo session, restore demo profile without calling backend
        if (storedToken.startsWith(DEMO_TOKEN_PREFIX)) {
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
              setToken(storedToken);
            } catch {
              setUser(null);
              setToken(null);
            }
          }
          setIsLoading(false);
          return;
        }

        try {
          const freshUser = await authService.getProfile();
          setUser(freshUser);
          setToken(storedToken);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(freshUser));
        } catch {
          // Token expired or invalid on backend
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
   * Login handler - connects to backend API
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
   * Registration handler - connects to backend API
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
   * Quick Demo Mode Login
   */
  const loginAsDemo = useCallback((role: UserRole) => {
    const demoUser = DEMO_USERS[role] || DEMO_USERS.admin;
    const demoToken = `${DEMO_TOKEN_PREFIX}${role}`;
    setToken(demoToken);
    setUser(demoUser);
    localStorage.setItem(TOKEN_STORAGE_KEY, demoToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(demoUser));
  }, []);

  /**
   * Logout handler
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (storedToken && !storedToken.startsWith(DEMO_TOKEN_PREFIX)) {
        await authService.logout();
      }
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
        loginAsDemo,
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
