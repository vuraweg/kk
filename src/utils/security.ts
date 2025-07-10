import { SecurityConfig } from '../types/auth';

// Security configuration
export const SECURITY_CONFIG: SecurityConfig = {
  maxLoginAttempts: 5,
  lockoutDuration: 15, // minutes
  tokenExpiry: 24, // hours
  passwordMinLength: 8,
  requireSpecialChars: true,
  requireNumbers: true
};

// Simple hash function for passwords (in production, use bcrypt)
export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt_key_2024'); // Add salt
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Verify password against hash
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
};

// Generate JWT-like token (simplified for demo)
export const generateToken = (userId: string): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    userId,
    exp: Date.now() + (SECURITY_CONFIG.tokenExpiry * 60 * 60 * 1000),
    iat: Date.now()
  }));
  const signature = btoa(`${header}.${payload}.secret_key`);
  return `${header}.${payload}.${signature}`;
};

// Verify token
export const verifyToken = (token: string): { valid: boolean; userId?: string } => {
  try {
    const [header, payload, signature] = token.split('.');
    const decodedPayload = JSON.parse(atob(payload));
    
    // Check expiration
    if (decodedPayload.exp < Date.now()) {
      return { valid: false };
    }
    
    // Verify signature (simplified)
    const expectedSignature = btoa(`${header}.${payload}.secret_key`);
    if (signature !== expectedSignature) {
      return { valid: false };
    }
    
    return { valid: true, userId: decodedPayload.userId };
  } catch {
    return { valid: false };
  }
};

// Rate limiting for login attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: Date; lockoutUntil?: Date }>();

export const checkRateLimit = (identifier: string): { allowed: boolean; lockoutUntil?: Date } => {
  const now = new Date();
  const attempts = loginAttempts.get(identifier);
  
  if (!attempts) {
    return { allowed: true };
  }
  
  // Check if still locked out
  if (attempts.lockoutUntil && now < attempts.lockoutUntil) {
    return { allowed: false, lockoutUntil: attempts.lockoutUntil };
  }
  
  // Reset if lockout period has passed
  if (attempts.lockoutUntil && now >= attempts.lockoutUntil) {
    loginAttempts.delete(identifier);
    return { allowed: true };
  }
  
  // Check if within rate limit window (15 minutes)
  const timeDiff = now.getTime() - attempts.lastAttempt.getTime();
  if (timeDiff > 15 * 60 * 1000) { // 15 minutes
    loginAttempts.delete(identifier);
    return { allowed: true };
  }
  
  return { allowed: attempts.count < SECURITY_CONFIG.maxLoginAttempts };
};

export const recordLoginAttempt = (identifier: string, success: boolean): void => {
  const now = new Date();
  const attempts = loginAttempts.get(identifier) || { count: 0, lastAttempt: now };
  
  if (success) {
    // Clear attempts on successful login
    loginAttempts.delete(identifier);
  } else {
    attempts.count += 1;
    attempts.lastAttempt = now;
    
    // Set lockout if max attempts reached
    if (attempts.count >= SECURITY_CONFIG.maxLoginAttempts) {
      attempts.lockoutUntil = new Date(now.getTime() + SECURITY_CONFIG.lockoutDuration * 60 * 1000);
    }
    
    loginAttempts.set(identifier, attempts);
  }
};

// Generate secure session ID
export const generateSessionId = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Input sanitization
export const sanitizeForStorage = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/['"]/g, '')
    .substring(0, 1000);
};