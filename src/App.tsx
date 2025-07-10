import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import QuestionDetailPage from './pages/QuestionDetailPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import MaterialsPage from './pages/MaterialsPage';
import CompanyPracticePage from './pages/CompanyPracticePage';
import LoadingSpinner from './components/LoadingSpinner';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-6">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Go Home
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">Error Details</summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading component
const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
    <LoadingSpinner message="Loading Primo JobsCracker..." size="lg" />
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  // console.log('ProtectedRoute: isAuthenticated:', isAuthenticated, 'loading:', loading);
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  
  // console.log('AdminRoute: isAuthenticated:', isAuthenticated, 'isAdmin:', isAdmin, 'loading:', loading);
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  return isAuthenticated && isAdmin ? <>{children}</> : <Navigate to="/" />;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              
              {/* Protected Routes */}
              <Route path="/question/:id" element={
                <ProtectedRoute>
                  <QuestionDetailPage />
                </ProtectedRoute>
              } />
              
              {/* Practice Routes - All variations */}
              <Route path="/practice" element={
                <ProtectedRoute>
                  <CompanyPracticePage />
                </ProtectedRoute>
              } />
              <Route path="/questions" element={
                <ProtectedRoute>
                  <CompanyPracticePage />
                </ProtectedRoute>
              } />
              <Route path="/practice/:company" element={
                <ProtectedRoute>
                  <CompanyPracticePage />
                </ProtectedRoute>
              } />
              <Route path="/company/:company" element={
                <ProtectedRoute>
                  <CompanyPracticePage />
                </ProtectedRoute>
              } />
              <Route path="/company/:company/practice" element={
                <ProtectedRoute>
                  <CompanyPracticePage />
                </ProtectedRoute>
              } />
              
              {/* Other Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/materials" element={
                <ProtectedRoute>
                  <MaterialsPage />
                </ProtectedRoute>
              } />
              
              {/* Admin Routes */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              } />
              
              {/* Catch-all route for 404s */}
              <Route path="*" element={
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                    <p className="text-gray-600 mb-6">Page not found</p>
                    <button
                      onClick={() => window.location.href = '/'}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Go Home
                    </button>
                  </div>
                </div>
              } />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;