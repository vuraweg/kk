import { 
  LoginCredentials, 
  SignupCredentials, 
  ResetPasswordCredentials,
  AuthResponse,
  User,
  AuthError 
} from '../types/auth';
import { TokenManager } from '../utils/tokenManager';

// CSRF token management
let csrfToken: string | null = null;

const getCSRFToken = async (): Promise<string> => {
  if (csrfToken) return csrfToken;
  
  try {
    const response = await fetch('/api/csrf-token', {
      method: 'GET',
      credentials: 'include',
    });
    const data = await response.json();
    csrfToken = data.token;
    return csrfToken;
  } catch (error) {
    throw new Error('Failed to get CSRF token');
  }
};

const apiRequest = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<any> => {
  const token = TokenManager.getAccessToken();
  const csrf = await getCSRFToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrf,
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new AuthError(
      errorData.code || 'UNKNOWN_ERROR',
      errorData.message || 'An unexpected error occurred'
    );
  }

  return response.json();
};

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      TokenManager.setTokens(response.tokens, credentials.rememberMe);
      return response;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('LOGIN_FAILED', 'Login failed. Please try again.');
    }
  }

  static async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    try {
      const response = await apiRequest('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      TokenManager.setTokens(response.tokens, false);
      return response;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('SIGNUP_FAILED', 'Signup failed. Please try again.');
    }
  }

  static async forgotPassword(credentials: ResetPasswordCredentials): Promise<void> {
    try {
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('RESET_FAILED', 'Password reset failed. Please try again.');
    }
  }

  static async refreshToken(): Promise<AuthResponse> {
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new AuthError('NO_REFRESH_TOKEN', 'No refresh token available');
    }

    try {
      const response = await apiRequest('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });

      TokenManager.setTokens(response.tokens, true);
      return response;
    } catch (error) {
      TokenManager.clearTokens();
      throw new AuthError('REFRESH_FAILED', 'Session expired. Please login again.');
    }
  }

  static async getCurrentUser(): Promise<User> {
    try {
      return await apiRequest('/auth/me');
    } catch (error) {
      throw new AuthError('USER_FETCH_FAILED', 'Failed to get user information');
    }
  }

  static async logout(): Promise<void> {
    try {
      await apiRequest('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      TokenManager.clearTokens();
      csrfToken = null;
    }
  }

  static async loginWithGoogle(): Promise<AuthResponse> {
    return new Promise((resolve, reject) => {
      const popup = window.open(
        '/api/auth/google',
        'google-login',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          reject(new AuthError('POPUP_CLOSED', 'Login was cancelled'));
        }
      }, 1000);

      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          popup?.close();
          
          TokenManager.setTokens(event.data.tokens, false);
          resolve(event.data);
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          popup?.close();
          
          reject(new AuthError(
            event.data.code || 'GOOGLE_AUTH_FAILED',
            event.data.message || 'Google authentication failed'
          ));
        }
      };

      window.addEventListener('message', messageHandler);
    });
  }

  static async loginWithGitHub(): Promise<AuthResponse> {
    return new Promise((resolve, reject) => {
      const popup = window.open(
        '/api/auth/github',
        'github-login',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          reject(new AuthError('POPUP_CLOSED', 'Login was cancelled'));
        }
      }, 1000);

      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'GITHUB_AUTH_SUCCESS') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          popup?.close();
          
          TokenManager.setTokens(event.data.tokens, false);
          resolve(event.data);
        } else if (event.data.type === 'GITHUB_AUTH_ERROR') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          popup?.close();
          
          reject(new AuthError(
            event.data.code || 'GITHUB_AUTH_FAILED',
            event.data.message || 'GitHub authentication failed'
          ));
        }
      };

      window.addEventListener('message', messageHandler);
    });
  }
}

// Custom AuthError class
export class AuthError extends Error {
  constructor(public code: string, message: string, public field?: string) {
    super(message);
    this.name = 'AuthError';
  }
}