import { User, AuthResponse } from '../types/auth';
import { hashPassword, verifyPassword, generateToken, checkRateLimit, recordLoginAttempt, sanitizeForStorage } from '../utils/security';
import { validateUsername, validateEmail, validatePassword, sanitizeInput } from '../utils/validation';

// In-memory storage (replace with actual database in production)
const users = new Map<string, User>();
const usersByEmail = new Map<string, string>(); // email -> userId mapping
const usersByUsername = new Map<string, string>(); // username -> userId mapping

// Initialize with admin user
const initializeAdminUser = async () => {
  const adminId = 'admin-001';
  const adminUser: User = {
    id: adminId,
    username: 'admin',
    email: 'admin@primojobs.com',
    hashedPassword: await hashPassword('Admin@123'),
    createdAt: new Date(),
    lastLogin: null,
    isActive: true,
    failedLoginAttempts: 0,
    lastFailedLogin: null,
    lockoutUntil: null
  };
  
  users.set(adminId, adminUser);
  usersByEmail.set(adminUser.email, adminId);
  usersByUsername.set(adminUser.username, adminId);
};

// Initialize admin user
initializeAdminUser();

export const authService = {
  // Register new user
  async register(username: string, email: string, password: string, confirmPassword: string): Promise<AuthResponse> {
    try {
      // Sanitize inputs
      username = sanitizeInput(username);
      email = sanitizeInput(email);
      
      // Validate inputs
      const usernameValidation = validateUsername(username);
      const emailValidation = validateEmail(email);
      const passwordValidation = validatePassword(password);
      
      const errors: string[] = [];
      if (!usernameValidation.isValid) errors.push(...usernameValidation.errors);
      if (!emailValidation.isValid) errors.push(...emailValidation.errors);
      if (!passwordValidation.isValid) errors.push(...passwordValidation.errors);
      if (password !== confirmPassword) errors.push('Passwords do not match');
      
      if (errors.length > 0) {
        return {
          success: false,
          error: errors.join('. ')
        };
      }
      
      // Check for existing username
      if (usersByUsername.has(username.toLowerCase())) {
        return {
          success: false,
          error: 'Username already exists. Please choose a different username.'
        };
      }
      
      // Check for existing email
      if (usersByEmail.has(email.toLowerCase())) {
        return {
          success: false,
          error: 'Email already registered. Please use a different email or try logging in.'
        };
      }
      
      // Create new user
      const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const hashedPassword = await hashPassword(password);
      
      const newUser: User = {
        id: userId,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        hashedPassword,
        createdAt: new Date(),
        lastLogin: null,
        isActive: true,
        failedLoginAttempts: 0,
        lastFailedLogin: null,
        lockoutUntil: null
      };
      
      // Store user
      users.set(userId, newUser);
      usersByEmail.set(email.toLowerCase(), userId);
      usersByUsername.set(username.toLowerCase(), userId);
      
      // Generate token
      const token = generateToken(userId);
      
      // Return success response (without password)
      const { hashedPassword: _, ...userWithoutPassword } = newUser;
      
      return {
        success: true,
        user: userWithoutPassword,
        token,
        message: 'Account created successfully! Welcome to Primo JobsCracker.'
      };
      
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during registration. Please try again.'
      };
    }
  },
  
  // Login user
  async login(identifier: string, password: string): Promise<AuthResponse> {
    try {
      // Sanitize input
      identifier = sanitizeInput(identifier);
      
      // Check rate limiting
      const rateLimitCheck = checkRateLimit(identifier);
      if (!rateLimitCheck.allowed) {
        const lockoutTime = rateLimitCheck.lockoutUntil;
        const timeRemaining = lockoutTime ? Math.ceil((lockoutTime.getTime() - Date.now()) / 60000) : 0;
        
        return {
          success: false,
          error: `Too many failed login attempts. Account locked for ${timeRemaining} minutes. Please try again later.`
        };
      }
      
      // Find user by email or username
      let userId: string | undefined;
      
      if (identifier.includes('@')) {
        // Login with email
        userId = usersByEmail.get(identifier.toLowerCase());
      } else {
        // Login with username
        userId = usersByUsername.get(identifier.toLowerCase());
      }
      
      if (!userId) {
        recordLoginAttempt(identifier, false);
        return {
          success: false,
          error: 'Invalid username/email or password. Please check your credentials and try again.'
        };
      }
      
      const user = users.get(userId);
      if (!user) {
        recordLoginAttempt(identifier, false);
        return {
          success: false,
          error: 'User account not found. Please contact support.'
        };
      }
      
      // Check if account is active
      if (!user.isActive) {
        recordLoginAttempt(identifier, false);
        return {
          success: false,
          error: 'Account is deactivated. Please contact support to reactivate your account.'
        };
      }
      
      // Check if user is locked out
      if (user.lockoutUntil && new Date() < user.lockoutUntil) {
        const timeRemaining = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);
        return {
          success: false,
          error: `Account temporarily locked due to multiple failed attempts. Try again in ${timeRemaining} minutes.`
        };
      }
      
      // Verify password
      const passwordValid = await verifyPassword(password, user.hashedPassword);
      
      if (!passwordValid) {
        // Update failed login attempts
        user.failedLoginAttempts += 1;
        user.lastFailedLogin = new Date();
        
        // Lock account if too many failed attempts
        if (user.failedLoginAttempts >= 5) {
          user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        }
        
        users.set(userId, user);
        recordLoginAttempt(identifier, false);
        
        const remainingAttempts = 5 - user.failedLoginAttempts;
        return {
          success: false,
          error: `Invalid password. ${remainingAttempts > 0 ? `${remainingAttempts} attempts remaining.` : 'Account locked for 15 minutes.'}`
        };
      }
      
      // Successful login - reset failed attempts and update last login
      user.failedLoginAttempts = 0;
      user.lastFailedLogin = null;
      user.lockoutUntil = null;
      user.lastLogin = new Date();
      users.set(userId, user);
      
      recordLoginAttempt(identifier, true);
      
      // Generate token
      const token = generateToken(userId);
      
      // Return success response (without password)
      const { hashedPassword: _, ...userWithoutPassword } = user;
      
      return {
        success: true,
        user: userWithoutPassword,
        token,
        message: 'Login successful! Welcome back.'
      };
      
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during login. Please try again.'
      };
    }
  },
  
  // Get user by token
  async getUserByToken(token: string): Promise<AuthResponse> {
    try {
      const { valid, userId } = require('../utils/security').verifyToken(token);
      
      if (!valid || !userId) {
        return {
          success: false,
          error: 'Invalid or expired token. Please log in again.'
        };
      }
      
      const user = users.get(userId);
      if (!user || !user.isActive) {
        return {
          success: false,
          error: 'User not found or account deactivated.'
        };
      }
      
      const { hashedPassword: _, ...userWithoutPassword } = user;
      
      return {
        success: true,
        user: userWithoutPassword,
        token
      };
      
    } catch (error) {
      console.error('Token verification error:', error);
      return {
        success: false,
        error: 'Token verification failed.'
      };
    }
  },
  
  // Logout (invalidate token - in production, maintain token blacklist)
  async logout(token: string): Promise<AuthResponse> {
    // In a real implementation, you would add the token to a blacklist
    // For now, we'll just return success
    return {
      success: true,
      message: 'Logged out successfully.'
    };
  },
  
  // Check if username exists
  async checkUsernameExists(username: string): Promise<boolean> {
    return usersByUsername.has(sanitizeInput(username).toLowerCase());
  },
  
  // Check if email exists
  async checkEmailExists(email: string): Promise<boolean> {
    return usersByEmail.has(sanitizeInput(email).toLowerCase());
  }
};