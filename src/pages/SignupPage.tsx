import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';

const SignupPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [redirectCountdown, setRedirectCountdown] = useState(0);
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Prevent double submissions
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    isActive: boolean;
    timeRemaining: number;
    message: string;
    isSupabaseLimit: boolean;
  }>({ isActive: false, timeRemaining: 0, message: '' });

  // Effect for success redirect countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (success && redirectCountdown > 0) {
      timer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1);
      }, 1000);
    } else if (redirectCountdown === 0 && success) {
      navigate('/login', {
        state: {
          message: 'Account created successfully! Please check your email for the confirmation link, then sign in to access the platform.',
          email: email.trim()
        }
      });
    }
    return () => clearTimeout(timer);
  }, [redirectCountdown, success, navigate, email]);

  // Effect to handle rate limit countdown
  useEffect(() => {
    if (rateLimitInfo.isActive && rateLimitInfo.timeRemaining > 0) {
      const timer = setTimeout(() => {
        setRateLimitInfo(prev => ({
          ...prev,
          timeRemaining: Math.max(0, prev.timeRemaining - 1)
        }));
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (rateLimitInfo.isActive && rateLimitInfo.timeRemaining === 0) {
      setRateLimitInfo({ isActive: false, timeRemaining: 0, message: '' });
      setError(''); // Clear any rate limit error
    }
  }, [rateLimitInfo]);

  // Helper function to parse rate limit error and extract time
  const parseRateLimitError = (errorMessage: string) => {
    // For Supabase rate limits, use a longer default time
    if (errorMessage.includes('Supabase') || errorMessage.includes('over_email_send_rate_limit')) {
      return 120; // 2 minutes for Supabase rate limits
    }
    
    // Extract time from error message
    const timeMatch = errorMessage.match(/(\d+)\s*seconds?/);
    if (timeMatch) {
      return parseInt(timeMatch[1]);
    }
    return 30; // Default fallback
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const now = Date.now();
    
    // Prevent rapid double-clicks (within 2 seconds)
    if (now - lastSubmitTime < 2000) {
      setError('⚠️ Please wait a moment before submitting again.');
      return;
    }
    
    // Prevent submission during cooldown
    if (rateLimitInfo.isActive) {
      const minutes = Math.floor(rateLimitInfo.timeRemaining / 60);
      const seconds = rateLimitInfo.timeRemaining % 60;
      const timeString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
      setError(`⏰ Please wait ${timeString} before trying again.`);
      return;
    }
    
    // Prevent multiple submissions
    if (isSubmitting) {
      setError('⏳ Sign-up request is already in progress. Please wait...');
      return;
    }
    
    // Clear previous messages
    setError('');
    setSuccess('');
    setLastSubmitTime(now);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    setLoading(true);
    setIsSubmitting(true);

    console.log('Starting signup process for:', email.trim());

    try {
      const { error } = await signUp(email.trim(), password, fullName.trim());

      if (error) {
        // Handle rate limit errors with smooth countdown
        if (error.status === 429 || error.message.includes('rate limit') || error.message.includes('Too many')) {
          const waitTime = parseRateLimitError(error.message);
          const isSupabaseLimit = error.isSupabaseRateLimit || error.message.includes('Supabase');
          
          setRateLimitInfo({
            isActive: true,
            timeRemaining: waitTime,
            message: error.message,
            isSupabaseLimit
          });
          setError(error.message);
        } else if (error.status === 409) {
          // Duplicate request error
          setError(error.message);
        } else {
          setError(`Sign up failed: ${error.message}`);
        }
      } else {
        setSuccess('🎉 Account created successfully! Please check your email for a confirmation link.');
        setRedirectCountdown(5); // Start countdown on success
      }
    } catch (err) {
      console.error('Unexpected sign up error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
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
          <UserPlus className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Create Your Account</h2>
          <p className="mt-2 text-sm text-gray-600">Join Primo JobsCracker and start your interview preparation</p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                <div className="whitespace-pre-line text-sm">{error}</div>
                {rateLimitInfo.isActive && (
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-red-800 font-medium text-sm">
                        Time remaining: {Math.floor(rateLimitInfo.timeRemaining / 60)}m {rateLimitInfo.timeRemaining % 60}s
                      </span>
                      <div className="text-xs text-red-600">
                        {Math.round((1 - rateLimitInfo.timeRemaining / parseRateLimitError(rateLimitInfo.message || '')) * 100)}%
                      </div>
                    </div>
                    <div className="w-full bg-red-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-1000 ease-linear ${
                          rateLimitInfo.isSupabaseLimit ? 'bg-orange-600' : 'bg-red-600'
                        }`}
                        style={{ 
                          width: `${Math.max(0, (1 - rateLimitInfo.timeRemaining / parseRateLimitError(rateLimitInfo.message || '')) * 100)}%` 
                        }}
                      ></div>
                    </div>
                    <div className="mt-2 text-xs text-red-600 space-y-1">
                      <div>The form will be automatically enabled when the cooldown expires.</div>
                      {rateLimitInfo.isSupabaseLimit && (
                        <div className="text-orange-600 font-medium">
                          ⚠️ This is a Supabase server limit - not from our app
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                <div className="whitespace-pre-line text-sm">{success}</div>
                {redirectCountdown > 0 && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <div className="flex items-center justify-between">
                      <p className="text-green-800 font-medium text-sm">
                        Redirecting to login in {redirectCountdown} seconds...
                      </p>
                      <button
                        onClick={() => {
                          setRedirectCountdown(0);
                          navigate('/login', {
                            state: {
                              message: 'Account created successfully! Please check your email for the confirmation link, then sign in to access the platform.',
                              email: email.trim()
                            }
                          });
                        }}
                        className="text-green-600 hover:text-green-700 underline text-sm font-medium"
                      >
                        Go now
                      </button>
                    </div>
                    <div className="mt-2 bg-green-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-1000 ease-linear"
                        style={{ width: `${((5 - redirectCountdown) / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name *</label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
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
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  placeholder="Enter your password"
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500">Must be at least 6 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password *</label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm your password"
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || isSubmitting || rateLimitInfo.isActive || !email.trim() || !password || !fullName.trim() || password !== confirmPassword}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors select-none"
                style={{ userSelect: 'none' }} // Prevent text selection on button
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {redirectCountdown > 0 ? 'Redirecting...' : 'Creating Account...'}
                  </>
                ) : rateLimitInfo.isActive ? (
                  `Try again in ${Math.floor(rateLimitInfo.timeRemaining / 60)}m ${rateLimitInfo.timeRemaining % 60}s`
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
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
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
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