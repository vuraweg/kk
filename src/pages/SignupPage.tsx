import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, UserPlus, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import logoImage from '../assets/wihout-gb-logo.png';
import RateLimiter from '../utils/rateLimiter';

const SignupPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(RateLimiter.getRemainingAttempts());
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Effect for success redirect countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (success && redirectCountdown > 0) {
      timer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1);
      }, 1000);
    } else if (redirectCountdown === 0 && success) {
      navigate('/login', { replace: true });
    }
    return () => clearTimeout(timer);
  }, [redirectCountdown, success, navigate]);

  // Auto-clear messages after some time
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 10000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 15000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    // Update remaining attempts display
    setRemainingAttempts(RateLimiter.getRemainingAttempts());
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('Username is required');
      return false;
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return false;
    }

    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return false;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!formData.password) {
      setError('Password is required');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error: signUpError } = await signUp(
        formData.email,
        formData.password,
        formData.username,
        formData.fullName
      );

      if (signUpError) {
        console.error('Sign up failed:', signUpError);
        
        let errorMessage = 'Failed to create account. Please try again.';
        
        // Handle rate limiting errors
        if (signUpError.message?.includes('Too many sign-up attempts') || 
            signUpError.message?.includes('Sign-up temporarily blocked') ||
            signUpError.message?.includes('Email sending limit reached')) {
          errorMessage = signUpError.message;
        } else
        if (signUpError.message?.includes('already registered')) {
          errorMessage = '📧 Email already registered\n\n• This email is already associated with an account\n• Try logging in instead\n• Use "Forgot Password" if you need to reset your password';
        } else if (signUpError.message?.includes('Username already exists')) {
          errorMessage = '👤 Username already taken\n\n• This username is already in use\n• Please choose a different username\n• Try adding numbers or underscores';
        } else if (signUpError.message?.includes('Invalid email')) {
          errorMessage = '📧 Invalid email format\n\n• Please enter a valid email address\n• Example: user@example.com';
        } else if (signUpError.message?.includes('Password')) {
          errorMessage = '🔒 Password requirements not met\n\n• Password must be at least 6 characters\n• Use a mix of letters and numbers for security';
        } else if (signUpError.message) {
          errorMessage = signUpError.message;
        }
        
        setError(errorMessage);
      } else {
        setSuccess('🎉 Account created successfully!\n\n✅ Welcome to Primo JobsCracker!\n📧 Please check your email to verify your account\n🚀 Redirecting to login...');
        setRedirectCountdown(3);
        // Update remaining attempts after successful signup
        setRemainingAttempts(RateLimiter.getRemainingAttempts());
      }
    } catch (err) {
      console.error('Unexpected error during sign up:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
      // Update remaining attempts display
      setRemainingAttempts(RateLimiter.getRemainingAttempts());
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);

    try {
      const { error } = await signInWithGoogle();

      if (error) {
        setError(`Google sign-up failed: ${error.message}`);
      } else {
        setSuccess('Google sign-up successful! Redirecting...');
      }
    } catch (err) {
      console.error('Unexpected Google sign up error:', err);
      setError('An error occurred with Google sign-up.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <img 
              src={logoImage} 
              alt="Primo JobsCracker Logo" 
              className="h-24 w-auto max-w-none"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg';
                fallback.textContent = 'PJ';
                e.currentTarget.parentNode!.appendChild(fallback);
              }}
            />
          </div>
          <UserPlus className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Create Your Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join Primo JobsCracker and start your interview preparation
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-xl">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-red-700 text-sm whitespace-pre-line">{error}</div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                <div className="text-green-700 text-sm whitespace-pre-line">{success}</div>
              </div>
              {redirectCountdown > 0 && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <div className="flex items-center justify-between">
                    <p className="text-green-800 font-medium text-sm">
                      Redirecting in {redirectCountdown} seconds...
                    </p>
                    <button
                      onClick={() => {
                        setRedirectCountdown(0);
                        navigate('/login', { replace: true });
                      }}
                      className="text-green-600 hover:text-green-700 underline text-sm font-medium"
                    >
                      Go now
                    </button>
                  </div>
                  <div className="mt-2 bg-green-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-1000 ease-linear"
                      style={{ width: `${((3 - redirectCountdown) / 3) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSignUp}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username *</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your username"
                disabled={loading}
                autoComplete="username"
              />
              <p className="mt-1 text-xs text-gray-500">
                3+ characters, letters, numbers, and underscores only
              </p>
            </div>

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name *</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
                disabled={loading}
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address *</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password *</label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Minimum 6 characters
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password *</label>
              <div className="relative mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm your password"
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || RateLimiter.isBlocked()}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
              >
                {RateLimiter.isBlocked() ? (
                  <>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Temporarily Blocked ({RateLimiter.getFormattedTimeUntilUnblock()})
                  </>
                ) : loading ? (
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

            {remainingAttempts < 3 && remainingAttempts > 0 && !RateLimiter.isBlocked() && (
              <div className="text-center">
                <p className="text-sm text-amber-600">
                  ⚠️ {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining before temporary block
                </p>
              </div>
            )}
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleGoogleSignup}
                disabled={loading}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-67.8 67.8C314.6 114.5 283.5 96 248 96c-88.8 0-160.1 71.1-160.1 160.1s71.3 160.1 160.1 160.1c98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path></svg>
                Sign up with Google
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">Sign in here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;