import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Shield } from 'lucide-react';
import logoImage from '../assets/wihout-gb-logo.png';

const Header: React.FC = () => {
  const { user, signOut, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const getUserDisplayName = () => {
    if (!user) return '';
    
    // If user has a name, use it
    if (user.name && user.name.trim() && user.name !== 'Vk1234567@') {
      return user.name;
    }
    
    // Fallback to email prefix
    if (user.email) {
      return user.email.split('@')[0];
    }
    
    return 'User';
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex items-center space-x-3">
                <img 
                  src={logoImage} 
                  alt="Primo JobsCracker Logo" 
                  className="h-12 w-auto"
                  onError={(e) => {
                    // Fallback to text if image fails to load
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'inline';
                  }}
                />
                <span className="text-2xl font-bold text-gray-900 hidden" id="logo-fallback">
                  Primo Jobs
                </span>
              </div>
            </Link>
            
            {isAuthenticated && (
              <nav className="hidden md:flex space-x-6">
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/') 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Home
                </Link>
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/dashboard') 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Dashboard
                </Link>
              </nav>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-2 mr-2">
                  {user?.avatar_url && (
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200">
                      <img
                      src={user.avatar_url}
                      alt="Profile"
                        className="w-full h-full object-cover"
                      onError={(e) => {
                        // Hide image if it fails to load
                          e.currentTarget.parentElement!.style.display = 'none';
                      }}
                      />
                    </div>
                  )}
                  <div className="hidden sm:block">
                    <span className="text-sm text-gray-500">Welcome,</span>
                    <span className="text-gray-700 font-medium ml-1">{getUserDisplayName()}</span>
                  </div>
                  <span className="sm:hidden text-gray-700 font-medium text-sm">
                    {getUserDisplayName()}
                  </span>
                  {user?.provider === 'google' && (
                    <span className="hidden sm:inline text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Google
                    </span>
                  )}
                </div>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:space-x-1 bg-green-600 text-white sm:px-3 sm:py-2 rounded-full sm:rounded-md hover:bg-green-700 transition-colors"
                  >
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:space-x-1 bg-red-600 text-white sm:px-3 sm:py-2 rounded-full sm:rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:space-x-1 text-gray-700 hover:text-blue-600 transition-colors sm:px-3 sm:py-2 rounded-full sm:rounded-md hover:bg-gray-100"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Login</span>
                </Link>
                <Link
                  to="/signup"
                  className="bg-blue-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-full sm:rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <span className="sm:hidden">Join</span>
                  <span className="hidden sm:inline">Sign Up</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;