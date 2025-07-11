import { useState, useEffect, useCallback } from 'react';
import { User, AuthTokens } from '../types/auth';
import { AuthService } from '../services/authService';
import { TokenManager } from '../utils/tokenManager';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    try {
      if (!TokenManager.isAuthenticated()) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      if (TokenManager.isTokenExpired()) {
        await AuthService.refreshToken();
      }

      const currentUser = await AuthService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Auth refresh failed:', error);
      setUser(null);
      TokenManager.clearTokens();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    const response = await AuthService.login({ email, password, rememberMe });
    setUser(response.user);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const response = await AuthService.signup({ 
      name, 
      email, 
      password, 
      confirmPassword: password 
    });
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    await AuthService.logout();
    setUser(null);
  }, []);

  useEffect(() => {
    refreshAuth();

    // Set up token refresh interval
    const interval = setInterval(() => {
      if (TokenManager.isAuthenticated() && TokenManager.isTokenExpired()) {
        refreshAuth();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [refreshAuth]);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    refreshAuth,
  };
};