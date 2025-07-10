import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Add error handling for missing environment variables
const checkEnvironmentVariables = () => {
  const requiredEnvVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error('Missing environment variables:', missingVars);
    
    // Show user-friendly error message
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
      <div style="
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        margin: 0;
        padding: 20px;
      ">
        <div style="
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          text-align: center;
          max-width: 500px;
          width: 100%;
        ">
          <div style="
            width: 60px;
            height: 60px;
            background: #ff6b6b;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 24px;
          ">⚠️</div>
          <h1 style="
            color: #2d3748;
            margin: 0 0 16px;
            font-size: 24px;
            font-weight: 600;
          ">Configuration Required</h1>
          <p style="
            color: #4a5568;
            margin: 0 0 24px;
            line-height: 1.6;
          ">
            This application requires Supabase configuration to function properly.
            Please set up the following environment variables:
          </p>
          <div style="
            background: #f7fafc;
            padding: 16px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: left;
          ">
            <code style="
              color: #e53e3e;
              font-family: 'Monaco', 'Menlo', monospace;
              font-size: 14px;
              display: block;
              margin: 4px 0;
            ">VITE_SUPABASE_URL</code>
            <code style="
              color: #e53e3e;
              font-family: 'Monaco', 'Menlo', monospace;
              font-size: 14px;
              display: block;
              margin: 4px 0;
            ">VITE_SUPABASE_ANON_KEY</code>
          </div>
          <p style="
            color: #718096;
            font-size: 14px;
            margin: 0;
          ">
            Please contact the administrator or check the deployment settings.
          </p>
        </div>
      </div>
    `;
    
    document.body.innerHTML = '';
    document.body.appendChild(errorDiv);
    return false;
  }
  
  return true;
};

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

try {
  // Check environment variables before rendering
  if (checkEnvironmentVariables()) {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error('Root element not found');
    }

    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  }
} catch (error) {
  console.error('Failed to render app:', error);
  
  // Fallback error display
  document.body.innerHTML = `
    <div style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f7fafc;
      font-family: system-ui, sans-serif;
      padding: 20px;
    ">
      <div style="
        background: white;
        padding: 40px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        text-align: center;
        max-width: 400px;
      ">
        <h1 style="color: #e53e3e; margin-bottom: 16px;">Application Error</h1>
        <p style="color: #4a5568; margin-bottom: 20px;">Failed to load the application</p>
        <button onclick="window.location.reload()" style="
          background: #3182ce;
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        ">
          Reload Page
        </button>
      </div>
    </div>
  `;
}