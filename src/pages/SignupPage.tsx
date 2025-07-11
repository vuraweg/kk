import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, UserPlus, AlertCircle, CheckCircle, User, Mail, Lock, Phone } from 'lucide-react';
import logoImage from '../assets/wihout-gb-logo.png';

const SignupPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(0);
  
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Effect for success redirect countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (successMessage && redirectCountdown > 0) {
      timer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1);
      }, 1000);
    } else if (redirectCountdown === 0 && successMessage) {
      navigate('/', { replace: true });
    }
    return () => clearTimeout(timer);
  }, [redirectCountdown, successMessage, navigate]);

  // Auto-clear messages after some time
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 10000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 15000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Limit to 10 digits
    const limitedDigits = digits.slice(0, 10);
    
    // Format as XXX-XXX-XXXX
    if (limitedDigits.length >= 6) {
      return `${limitedDigits.slice(0, 3)}-${limitedDigits.slice(3, 6)}-${limitedDigits.slice(6)}`;
    } else if (limitedDigits.length >= 3) {
      return `${limitedDigits.slice(0, 3)}-${limitedDigits.slice(3)}`;
    }
    return limitedDigits;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phoneNumber: string) => {
    const digits = phoneNumber.replace(/\D/g, '');
    return digits.length === 10 && /^[6-9]/.test(digits);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const validateForm = () => {
    // Clear previous messages
    setErrorMessage('');
    setSuccessMessage('');

    // Validate full name
    if (!fullName.trim()) {
      setErrorMessage('📝 Full name is required\n\n• Please enter your complete name\n• This will be displayed in your profile');
      return false;
    }

    if (fullName.trim().length < 2) {
      setErrorMessage('📝 Full name is too short\n\n• Name must be at least 2 characters\n• Please enter your complete name');
      return false;
    }

    // Validate email
    if (!email.trim()) {
      setErrorMessage('📧 Email address is required\n\n• Please enter a valid email address\n• This will be used for login and notifications');
      return false;
    }

    if (!validateEmail(email)) {
      setErrorMessage('📧 Invalid email format\n\n• Please enter a valid email address\n• Example: user@example.com');
      return false;
    }

    // Validate password
    if (!password) {
      setErrorMessage('🔒 Password is required\n\n• Please create a secure password\n• Minimum 6 characters required');
      return false;
    }

    if (!validatePassword(password)) {
      setErrorMessage('🔒 Password is too weak\n\n• Password must be at least 6 characters\n• Use a mix of letters, numbers, and symbols\n• Avoid common passwords');
      return false;
    }

    // Validate phone number
    if (!phone.trim()) {
      setErrorMessage('📱 Mobile number is required\n\n• Please enter your 10-digit mobile number\n• This will be used for account security');
      return false;
    }

    if (!validatePhoneNumber(phone)) {
      setErrorMessage('📱 Invalid mobile number\n\n• Enter a valid 10-digit Indian mobile number\n• Number should start with 6, 7, 8, or 9\n• Don\'t include +91 or country code\n\nExample: 9876543210');
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    // Validate form first
    if (!validateForm()) {
      return;
    }

    setIsSigningUp(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Import supabase here to avoid circular dependencies
      const { supabase } = await import('../lib/supabase');
      
      const phoneDigits = phone.replace(/\D/g, '');
      const formattedPhone = `+91${phoneDigits}`;

      // Attempt to sign up the user
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        phone: formattedPhone,
        options: {
          data: {
            full_name: fullName.trim(),
            name: fullName.trim(),
            phone: formattedPhone
          }
        }
      });

      if (error) {
        console.error('Signup error:', error);
        
        let errorMsg = 'Failed to create account. Please try again.';
        
        if (error.message?.includes('User already registered')) {
          errorMsg = '👤 Account already exists\n\n• An account with this email already exists\n• Try signing in instead\n• Use "Forgot Password" if you need to reset';
        } else if (error.message?.includes('Invalid email')) {
          errorMsg = '📧 Invalid email address\n\n• Please check your email format\n• Make sure there are no typos\n• Example: user@example.com';
        } else if (error.message?.includes('Password')) {
          errorMsg = '🔒 Password requirements not met\n\n• Password must be at least 6 characters\n• Use a mix of letters and numbers\n• Avoid common passwords';
        } else if (error.message?.includes('Phone')) {
          errorMsg = '📱 Phone number issue\n\n• Please check your mobile number\n• Use 10-digit Indian mobile number\n• Don\'t include +91 or country code';
        } else if (error.message?.includes('rate limit') || error.message?.includes('Too many')) {
          errorMsg = '⏰ Too many signup attempts\n\n• Please wait 5-10 minutes before trying again\n• This is a security measure\n• Contact support if issue persists';
        } else if (error.message?.includes('Network') || error.message?.includes('timeout')) {
          errorMsg = '🌐 Network connection issue\n\n• Check your internet connection\n• Try again in a few moments\n• Contact support if problem persists';
        } else if (error.message) {
          errorMsg = error.message;
        }
        
        setErrorMessage(errorMsg);
        return;
      }

      // Success
      console.log('Signup successful:', data);
      setSuccessMessage('🎉 Account created successfully!\n\n✅ Welcome to Primo JobsCracker!\n🚀 Redirecting to your dashboard...');
      setRedirectCountdown(3); // Start countdown on success

    } catch (err) {
      console.error('Unexpected signup error:', err);
      setErrorMessage('❌ An unexpected error occurred\n\n• Please try again in a few moments\n• Check your internet connection\n• Contact support if problem persists');
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleGoogleSignup = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsSigningUp(true);

    try {
      const { error } = await signInWithGoogle();

      if (error) {
        console.error('Google signup error:', error);
        
        let errorMessage = 'Google sign-up failed. Please try email signup below.';
        
        if (error.message?.includes('popup')) {
          errorMessage = 'Google sign-up popup was blocked or closed.\n\nPlease allow popups for this site and try again.';
        } else if (error.message?.includes('timed out') || error.message?.includes('timeout')) {
          errorMessage = 'Google sign-up timed out.\n\nPlease check your internet connection and try again.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setErrorMessage(errorMessage);
      } else {
        setSuccessMessage('🎉 Google sign-up successful!\n\n✅ Welcome to Primo JobsCracker!\n🚀 Redirecting...');
        setRedirectCountdown(2);
      }
    } catch (err) {
      console.error('Unexpected Google signup error:', err);
      setErrorMessage('An unexpected error occurred with Google sign-up. Please try email signup below.');
    } finally {
      setIsSigningUp(false);
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
            Join Primo JobsCracker and start your interview preparation journey
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-xl">
          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6" role="alert" aria-live="polite">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-red-700 text-sm whitespace-pre-line">{errorMessage}</div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6" role="alert" aria-live="polite">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                <div className="text-green-700 text-sm whitespace-pre-line">{successMessage}</div>
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
                        navigate('/', { replace: true });
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

          {/* Signup Form */}
          <div className="space-y-6">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Full Name *
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setErrorMessage('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your full name"
                disabled={isSigningUp}
                autoComplete="name"
                aria-describedby="fullName-help"
              />
              <p id="fullName-help" className="mt-1 text-xs text-gray-500">
                Enter your complete name as it should appear on your profile
              </p>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline h-4 w-4 mr-1" />
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your email address"
                disabled={isSigningUp}
                autoComplete="email"
                aria-describedby="email-help"
              />
              <p id="email-help" className="mt-1 text-xs text-gray-500">
                We'll use this email for login and important notifications
              </p>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="inline h-4 w-4 mr-1" />
                Password *
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Create a secure password"
                disabled={isSigningUp}
                autoComplete="new-password"
                aria-describedby="password-help"
              />
              <p id="password-help" className="mt-1 text-xs text-gray-500">
                Minimum 6 characters. Use a mix of letters, numbers, and symbols
              </p>
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="inline h-4 w-4 mr-1" />
                Mobile Number *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">+91</span>
                </div>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setPhone(formatted);
                    setErrorMessage('');
                  }}
                  className="block w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="9876543210"
                  disabled={isSigningUp}
                  maxLength={12} // XXX-XXX-XXXX format
                  autoComplete="tel"
                  aria-describedby="phone-help"
                />
              </div>
              <p id="phone-help" className="mt-1 text-xs text-gray-500">
                Enter your 10-digit mobile number (without +91)
              </p>
            </div>

            {/* Sign Up Button */}
            <div>
              <button
                type="button"
                onClick={handleSignUp}
                disabled={isSigningUp || !fullName.trim() || !email.trim() || !password || !phone.trim()}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
                aria-describedby="signup-button-help"
              >
                {isSigningUp ? (
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
              <p id="signup-button-help" className="mt-1 text-xs text-gray-500 text-center">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Google Signup */}
            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={isSigningUp}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-67.8 67.8C314.6 114.5 283.5 96 248 96c-88.8 0-160.1 71.1-160.1 160.1s71.3 160.1 160.1 160.1c98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path></svg>
                Sign up with Google
              </button>
            </div>
          </div>

          {/* Login Link */}
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

export default SignupPage;