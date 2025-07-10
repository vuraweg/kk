import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, UserPlus, Phone, MessageSquare, CheckCircle, AlertCircle, Timer } from 'lucide-react';
import logoImage from '../assets/wihout-gb-logo.png';

const SignupPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [redirectCountdown, setRedirectCountdown] = useState(0);
  const { sendOTP, verifyOTP, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Effect for success redirect countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (success && redirectCountdown > 0) {
      timer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1);
      }, 1000);
    } else if (redirectCountdown === 0 && success && step === 'otp') {
      navigate('/', { replace: true });
    }
    return () => clearTimeout(timer);
  }, [redirectCountdown, success, navigate, step]);

  // Handle countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

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

  const validatePhoneNumber = (phoneNumber: string) => {
    const digits = phoneNumber.replace(/\D/g, '');
    return digits.length === 10 && /^[6-9]/.test(digits);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError('');
    setSuccess('');
    
    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    const phoneDigits = phone.replace(/\D/g, '');
    
    if (!validatePhoneNumber(phone)) {
      setError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9');
      return;
    }

    setLoading(true);

    try {
      const { error: sendError } = await sendOTP(phoneDigits);
      
      if (sendError) {
        console.error('Send OTP failed:', sendError);
        
        let errorMessage = 'Failed to send OTP. Please try again.';
        
        if (sendError.message?.includes('rate limit') || sendError.message?.includes('Too many')) {
          errorMessage = '⏰ Too many OTP requests\n\n• Please wait 5-10 minutes before requesting again\n• This is a security measure to prevent spam\n\nTry again later or contact support if needed.';
        } else if (sendError.message?.includes('Invalid phone number')) {
          errorMessage = '📱 Invalid phone number format\n\n• Enter a valid 10-digit Indian mobile number\n• Number should start with 6, 7, 8, or 9\n• Don\'t include +91 or country code\n\nExample: 9876543210';
        } else if (sendError.message?.includes('Network') || sendError.message?.includes('timeout')) {
          errorMessage = '🌐 Network connection issue\n\n• Check your internet connection\n• Try again in a few moments\n• Contact support if problem persists';
        } else if (sendError.message) {
          errorMessage = sendError.message;
        }
        
        setError(errorMessage);
      } else {
        setSuccess(`📱 OTP sent successfully to +91-${formatPhoneNumber(phoneDigits)}\n\n• Check your SMS inbox\n• OTP is valid for 5 minutes\n• Enter the 6-digit code below`);
        setStep('otp');
        setCountdown(60); // 60 seconds before allowing resend
      }
    } catch (err) {
      console.error('Unexpected error during send OTP:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError('');
    setSuccess('');
    
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const phoneDigits = phone.replace(/\D/g, '');
      const { error: verifyError } = await verifyOTP(phoneDigits, otp);
      
      if (verifyError) {
        console.error('Verify OTP failed:', verifyError);
        
        let errorMessage = 'Invalid OTP. Please try again.';
        
        if (verifyError.message?.includes('expired')) {
          errorMessage = '⏰ OTP has expired\n\n• OTP is valid for only 5 minutes\n• Request a new OTP to continue\n• Make sure to enter OTP quickly after receiving';
        } else if (verifyError.message?.includes('invalid') || verifyError.message?.includes('wrong')) {
          errorMessage = '❌ Invalid OTP code\n\n• Double-check the 6-digit code from SMS\n• Make sure you\'re entering the latest OTP\n• Request new OTP if needed';
        } else if (verifyError.message?.includes('rate limit') || verifyError.message?.includes('Too many')) {
          errorMessage = '⏰ Too many verification attempts\n\n• Please wait 5-10 minutes\n• Request a new OTP after waiting\n• This is a security measure';
        } else if (verifyError.message) {
          errorMessage = verifyError.message;
        }
        
        setError(errorMessage);
      } else {
        setSuccess('🎉 Account created successfully!\n\n✅ Phone number verified\n🚀 Welcome to Primo JobsCracker!\n\nRedirecting to dashboard...');
        setRedirectCountdown(3); // Start countdown on success
      }
    } catch (err) {
      console.error('Unexpected error during verify OTP:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const phoneDigits = phone.replace(/\D/g, '');
      const { error: sendError } = await sendOTP(phoneDigits);
      
      if (sendError) {
        setError('Failed to resend OTP. Please try again.');
      } else {
        setSuccess('📱 New OTP sent successfully!\n\n• Check your SMS inbox\n• Use the latest OTP received');
        setCountdown(60);
        setOtp(''); // Clear previous OTP
      }
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
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

  const handleBackToDetails = () => {
    setStep('details');
    setOtp('');
    setError('');
    setSuccess('');
    setCountdown(0);
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
            {step === 'details' ? 'Create Your Account' : 'Verify Your Number'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 'details' 
              ? 'Join Primo JobsCracker and start your interview preparation'
              : `Enter the OTP sent to +91-${formatPhoneNumber(phone.replace(/\D/g, ''))}`
            }
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

          {step === 'details' ? (
            <form className="space-y-6" onSubmit={handleSendOTP}>
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name *</label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setError('');
                  }}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  disabled={loading}
                  autoComplete="name"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Mobile Number *</label>
                <div className="relative mt-1">
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
                      setError('');
                    }}
                    className="block w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="9876543210"
                    disabled={loading}
                    maxLength={12} // XXX-XXX-XXXX format
                    autoComplete="tel"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Enter your 10-digit mobile number (without +91)
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || !fullName.trim() || !validatePhoneNumber(phone)}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send OTP
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleVerifyOTP}>
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 6-Digit OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(value);
                    setError('');
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-center text-lg font-mono tracking-widest"
                  placeholder="123456"
                  disabled={loading}
                  maxLength={6}
                  autoComplete="one-time-code"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Check your SMS for the 6-digit verification code
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {redirectCountdown > 0 ? 'Redirecting...' : 'Creating Account...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify & Create Account
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleBackToDetails}
                  disabled={loading}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                >
                  ← Change Details
                </button>
                
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading || countdown > 0}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 flex items-center"
                >
                  {countdown > 0 ? (
                    <>
                      <Timer className="h-4 w-4 mr-1" />
                      Resend in {countdown}s
                    </>
                  ) : (
                    'Resend OTP'
                  )}
                </button>
              </div>
            </form>
          )}

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