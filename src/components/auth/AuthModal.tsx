import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Sparkles } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { AuthView, AuthModalProps } from '../../types/auth';

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  initialView = 'login' 
}) => {
  const [currentView, setCurrentView] = useState<AuthView>(initialView);
  const [isClosing, setIsClosing] = useState(false);

  // Reset view when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentView(initialView);
      setIsClosing(false);
    }
  }, [isOpen, initialView]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setCurrentView('login');
      setIsClosing(false);
    }, 150);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleClose();
  };

  const handleSignupSuccess = () => {
    setCurrentView('success');
    setTimeout(() => {
      handleClose();
    }, 2000); // Shorter timeout
  };

  const handleForgotPasswordSuccess = () => {
    setCurrentView('success');
    setTimeout(() => {
      handleClose();
    }, 3000); // Reasonable timeout for password reset
  };

  const getTitle = () => {
    switch (currentView) {
      case 'login': return 'Welcome Back';
      case 'signup': return 'Join Resume Optimizer';
      case 'forgot-password': return 'Reset Password';
      case 'success': return 'Success!';
      default: return 'Authentication';
    }
  };

  const getDescription = () => {
    switch (currentView) {
      case 'login': return 'Sign in to optimize your resume with AI';
      case 'signup': return 'Create your account and start optimizing';
      case 'forgot-password': return 'We\'ll help you reset your password';
      case 'success': 
        return currentView === 'success' && currentView !== 'forgot-password'
          ? 'Your account has been created successfully!'
          : 'Check your email for the password reset link.';
      default: return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity duration-150 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div 
        className={`bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[95vh] overflow-y-auto border border-gray-100 transition-transform duration-150 ${
          isClosing ? 'scale-95' : 'scale-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 px-6 py-8 border-b border-gray-100">
          <button
            onClick={handleCloseClick}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-white/50 z-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 id="auth-modal-title" className="text-2xl font-bold text-gray-900 mb-2">
              {getTitle()}
            </h1>
            <p className="text-gray-600 text-sm">
              {getDescription()}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentView === 'login' && (
            <LoginForm
              onSwitchToSignup={() => setCurrentView('signup')}
              onForgotPassword={() => setCurrentView('forgot-password')}
              onClose={handleClose}
            />
          )}
          
          {currentView === 'signup' && (
            <SignupForm
              onSwitchToLogin={() => setCurrentView('login')}
              onSignupSuccess={handleSignupSuccess}
            />
          )}
          
          {currentView === 'forgot-password' && (
            <ForgotPasswordForm
              onBackToLogin={() => setCurrentView('login')}
              onSuccess={handleForgotPasswordSuccess}
            />
          )}
          
          {currentView === 'success' && (
            <div className="text-center py-8">
              <div className="bg-green-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">All Set!</h2>
              <p className="text-gray-600 leading-relaxed">
                {getDescription()}
              </p>
              <div className="mt-6">
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className="bg-green-600 h-1 rounded-full transition-all duration-100 ease-linear"
                    style={{ 
                      animation: currentView === 'success' 
                        ? 'progress 3s linear forwards' 
                        : 'progress 5s linear forwards' 
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Closing automatically...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};