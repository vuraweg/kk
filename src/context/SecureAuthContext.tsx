import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse } from '../types/auth';
import { authService } from '../services/authService';

interface AuthContextType {
  user: Omit<User, 'hashedPassword'> | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  register: (username: string, email: string, password: string, confirmPassword: string) => Promise<AuthResponse>;
  login: (identifier: string, password: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  checkUsernameExists: (username: string) => Promise<boolean>;
  checkEmailExists: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const TOKEN_KEY = 'primojobs_auth_token';

export const SecureAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Omit<User, 'hashedPassword'> | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from stored token
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
          const response = await authService.getUserByToken(token);
          if (response.success && response.user) {
            setUser(response.user);
          } else {
            // Invalid token, remove it
            localStorage.removeItem(TOKEN_KEY);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const register = async (username: string, email: string, password: string, confirmPassword: string): Promise<AuthResponse> => {
    setLoading(true);
    try {
      const response = await authService.register(username, email, password, confirmPassword);
      
      if (response.success && response.user && response.token) {
        setUser(response.user);
        localStorage.setItem(TOKEN_KEY, response.token);
      }
      
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during registration.'
      };
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier: string, password: string): Promise<AuthResponse> => {
    setLoading(true);
    try {
      const response = await authService.login(identifier, password);
      
      if (response.success && response.user && response.token) {
        setUser(response.user);
        localStorage.setItem(TOKEN_KEY, response.token);
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during login.'
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        await authService.logout(token);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem(TOKEN_KEY);
    }
  };

  const checkUsernameExists = async (username: string): Promise<boolean> => {
    return authService.checkUsernameExists(username);
  };

  const checkEmailExists = async (email: string): Promise<boolean> => {
    return authService.checkEmailExists(email);
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.username === 'admin' || user?.email === 'admin@primojobs.com',
    register,
    login,
    logout,
    checkUsernameExists,
    checkEmailExists
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};