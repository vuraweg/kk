import { ValidationRules, FormErrors } from '../types/auth';

// Input sanitization
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Basic XSS prevention
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password strength validation
export const validatePasswordStrength = (password: string): string | null => {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/(?=.*[a-z])/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/(?=.*\d)/.test(password)) {
    return 'Password must contain at least one number';
  }
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    return 'Password must contain at least one special character (@$!%*?&)';
  }
  return null;
};

// Generic form validation
export const validateForm = (
  data: Record<string, string>,
  rules: ValidationRules
): FormErrors => {
  const errors: FormErrors = {};

  Object.keys(rules).forEach(field => {
    const value = data[field] || '';
    const rule = rules[field];

    // Required validation
    if (rule.required && !value.trim()) {
      errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      return;
    }

    // Skip other validations if field is empty and not required
    if (!value.trim() && !rule.required) return;

    // Length validations
    if (rule.minLength && value.length < rule.minLength) {
      errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} must be at least ${rule.minLength} characters`;
      return;
    }

    if (rule.maxLength && value.length > rule.maxLength) {
      errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} must be no more than ${rule.maxLength} characters`;
      return;
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} format is invalid`;
      return;
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) {
        errors[field] = customError;
        return;
      }
    }
  });

  return errors;
};

// Validation rules for different forms
export const loginValidationRules: ValidationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    required: true,
    minLength: 1,
  },
};

export const signupValidationRules: ValidationRules = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]+$/,
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    required: true,
    custom: validatePasswordStrength,
  },
  confirmPassword: {
    required: true,
  },
};

export const forgotPasswordValidationRules: ValidationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
};