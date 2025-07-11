import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../../types/auth';
import { AuthService } from '../../services/authService';
import { TokenManager } from '../../utils/tokenManager';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = async () => {
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
  };

  const login = async (email: string, password: string, rememberMe = false) => {
    const response = await AuthService.login({ email, password, rememberMe });
    setUser(response.user);
  };

  const signup = async (name: string, email: string, password: string) => {
    const response = await AuthService.signup({ 
      name, 
      email, 
      password, 
      confirmPassword: password 
    });
    setUser(response.user);
  };

  const logout = async () => {
    await AuthService.logout();
    setUser(null);
  };

  useEffect(() => {
    refreshAuth();

    // Set up token refresh interval
    const interval = setInterval(() => {
      if (TokenManager.isAuthenticated() && TokenManager.isTokenExpired()) {
        refreshAuth();
      }
    }, 60000); // Check every minute

    // Set up auto-logout on token expiration
    const checkTokenExpiration = () => {
      if (user && TokenManager.isTokenExpired()) {
        logout();
      }
    };

    const tokenCheckInterval = setInterval(checkTokenExpiration, 30000); // Check every 30 seconds

    return () => {
      clearInterval(interval);
      clearInterval(tokenCheckInterval);
    };
  }, [user]);

  // Handle visibility change to refresh auth when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && TokenManager.isAuthenticated()) {
        refreshAuth();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};