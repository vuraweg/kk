export interface User {
  id: string;
  username: string;
  email: string;
  hashedPassword: string;
  createdAt: Date;
  lastLogin: Date | null;
  isActive: boolean;
  failedLoginAttempts: number;
  lastFailedLogin: Date | null;
  lockoutUntil: Date | null;
}

export interface AuthResponse {
  success: boolean;
  user?: Omit<User, 'hashedPassword'>;
  token?: string;
  message?: string;
  error?: string;
}

export interface LoginAttempt {
  identifier: string; // username or email
  timestamp: Date;
  success: boolean;
  ip?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface SecurityConfig {
  maxLoginAttempts: number;
  lockoutDuration: number; // in minutes
  tokenExpiry: number; // in hours
  passwordMinLength: number;
  requireSpecialChars: boolean;
  requireNumbers: boolean;
}