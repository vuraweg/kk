import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/SecureAuthContext';
import { Eye, EyeOff, Loader2, UserPlus, Check, X, AlertCircle } from 'lucide-react';
import { validateUsername, validateEmail, validatePassword } from '../utils/validation';
import logoImage from '../assets/wihout-gb-logo.png';

const SecureSignupPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [fieldValidation, setFieldValidation] = useState<Record<string, boolean>>({});
  const [checkingAvailability, setCheckingAvailability] = useState<Record<string, boolean>>({});
  
  const { register, isAuthenticated, checkUsernameExists, checkEmailExists } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Real-time validation
  useEffect(() => {
    const validateField = async (field: string, value: string) => {
      const newErrors = { ...errors };
      const newValidation = { ...fieldValidation };
      
      switch (field) {
        case 'username':
          const usernameValidation = validateUsername(value);
          newErrors.username = usernameValidation.errors;
          newValidation.username = usernameValidation.isValid;
          
          // Check availability if valid format
          if (usernameValidation.isValid && value.length >= 3) {
            setCheckingAvailability(prev => ({ ...prev, username: true }));
            try {
              const exists = await checkUsernameExists(value);
              if (exists) {
                newErrors.username = ['Username is already taken'];
                newValidation.username = false;
              }
            } catch (error) {
              console.error('Username check error:', error);
            } finally {
              setCheckingAvailability(prev => ({ ...prev, username: false }));
            }
          }
          break;
          
        case 'email':
          const emailValidation = validateEmail(value);
          newErrors.email = emailValidation.errors;
          newValidation.email = emailValidation.isValid;
          
          // Check availability if valid format
          if (emailValidation.isValid) {
            setCheckingAvailability(prev => ({ ...prev, email: true }));
            try {
              const exists = await checkEmailExists(value);
              if (exists) {
                newErrors.email = ['Email is already registered'];
                newValidation.email = false;
              }
            } catch (error) {
              console.error('Email check error:', error);
            } finally {
              setCheckingAvailability(prev => ({ ...prev, email: false }));
            }
          }
          break;
          
        case 'password':
          const passwordValidation = validatePassword(value);
          newErrors.password = passwordValidation.errors;
          newValidation.password = passwordValidation.isValid;
          
          // Re-validate confirm password if it exists
          if (formData.confirmPassword) {
            if (value !== formData.confirmPassword) {
              newErrors.confirmPassword = ['Passwords do not match'];
              newValidation.confirmPassword = false;
            } else {
              newErrors.confirmPassword = [];
              newValidation.confirmPassword = true;
            }
          }
          break;
          
        case 'confirmPassword':
          if (value !== formData.password) {
            newErrors.confirmPassword = ['Passwords do not match'];
            newValidation.confirmPassword = false;
          } else {
            newErrors.confirmPassword = [];
            newValidation.confirmPassword = true;
          }
          break;
      }
      
      setErrors(newErrors);
      setFieldValidation(newValidation);
    };

    // Debounce validation
    const timeouts: Record<string, NodeJS.Timeout> = {};
    
    Object.entries(formData).forEach(([field, value]) => {
      if (value) {
        clearTimeout(timeouts[field]);
        timeouts[field] = setTimeout(() => validateField(field, value), 500);
      }
    });

    return () => {
      Object.values(timeouts).forEach(clearTimeout);
    };
  }, [formData, checkUsernameExists, checkEmailExists]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSuccess(''); // Clear success message when user types
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation
    const hasErrors = Object.values(errors).some(fieldErrors => fieldErrors.length > 0);
    const allFieldsValid = Object.values(fieldValidation).every(valid => valid);
    const allFieldsFilled = Object.values(formData).every(value => value.trim());
    
    if (!allFieldsFilled) {
      setErrors(prev => ({
        ...prev,
        form: ['Please fill in all fields']
      }));
      return;
    }
    
    if (hasErrors || !allFieldsValid) {
      setErrors(prev => ({
        ...prev,
        form: ['Please fix the errors above before submitting']
      }));
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await register(
        formData.username,
        formData.email,
        formData.password,
        formData.confirmPassword
      );

      if (response.success) {
        setSuccess(response.message || 'Account created successfully!');
        // Redirect after a short delay
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);
      } else {
        setErrors({ form: [response.error || 'Registration failed'] });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ form: ['An unexpected error occurred. Please try again.'] });
    } finally {
      setLoading(false);
    }
  };

  const getFieldIcon = (field: string) => {
    if (checkingAvailability[field]) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    
    if (formData[field as keyof typeof formData] && fieldValidation[field] !== undefined) {
      return fieldValidation[field] ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <X className="h-4 w-4 text-red-500" />
      );
    }
    
    return null;
  };

  const isFormValid = Object.values(fieldValidation).every(valid => valid) && 
                     Object.values(formData).every(value => value.trim()) &&
                     !Object.values(checkingAvailability).some(checking => checking);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <img 
              src={logoImage} 
              alt="Primo JobsCracker Logo" 
              className="h-20 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg';
                fallback.textContent = 'PJ';
                e.currentTarget.parentNode!.appendChild(fallback);
              }}
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Create Your Account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Join Primo JobsCracker and start your interview preparation journey
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-xl border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Form-level errors */}
            {errors.form && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-red-700 text-sm">
                    {errors.form.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-3" />
                  <div className="text-green-700 text-sm font-medium">{success}</div>
                </div>
              </div>
            )}

            {/* Username field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username *
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className={`block w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.username?.length ? 'border-red-300 bg-red-50' : 
                    fieldValidation.username ? 'border-green-300 bg-green-50' : 
                    'border-gray-300'
                  }`}
                  placeholder="Choose a unique username"
                  disabled={loading}
                  autoComplete="username"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {getFieldIcon('username')}
                </div>
              </div>
              {errors.username?.length > 0 && (
                <div className="mt-1 text-sm text-red-600">
                  {errors.username.map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">
                3-20 characters, letters, numbers, and underscores only
              </p>
            </div>

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`block w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.email?.length ? 'border-red-300 bg-red-50' : 
                    fieldValidation.email ? 'border-green-300 bg-green-50' : 
                    'border-gray-300'
                  }`}
                  placeholder="Enter your email address"
                  disabled={loading}
                  autoComplete="email"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {getFieldIcon('email')}
                </div>
              </div>
              {errors.email?.length > 0 && (
                <div className="mt-1 text-sm text-red-600">
                  {errors.email.map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`block w-full px-3 py-2 pr-20 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.password?.length ? 'border-red-300 bg-red-50' : 
                    fieldValidation.password ? 'border-green-300 bg-green-50' : 
                    'border-gray-300'
                  }`}
                  placeholder="Create a strong password"
                  disabled={loading}
                  autoComplete="new-password"
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <div className="pr-2">
                    {getFieldIcon('password')}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="pr-3 flex items-center hover:text-blue-600 transition-colors"
                    disabled={loading}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              {errors.password?.length > 0 && (
                <div className="mt-1 text-sm text-red-600">
                  {errors.password.map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">
                8+ characters with uppercase, lowercase, numbers, and special characters
              </p>
            </div>

            {/* Confirm Password field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`block w-full px-3 py-2 pr-20 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.confirmPassword?.length ? 'border-red-300 bg-red-50' : 
                    fieldValidation.confirmPassword ? 'border-green-300 bg-green-50' : 
                    'border-gray-300'
                  }`}
                  placeholder="Confirm your password"
                  disabled={loading}
                  autoComplete="new-password"
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <div className="pr-2">
                    {getFieldIcon('confirmPassword')}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="pr-3 flex items-center hover:text-blue-600 transition-colors"
                    disabled={loading}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              {errors.confirmPassword?.length > 0 && (
                <div className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword.map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit button */}
            <div>
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Account
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecureSignupPage;