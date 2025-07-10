import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  isAdmin?: boolean;
  provider?: 'email';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;
    let authTimeout: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        setInitializing(true);

        const authPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => {
          authTimeout = setTimeout(() => reject(new Error('Auth initialization timeout')), 2000);
        });

        let session, error;
        try {
          const result = await Promise.race([authPromise, timeoutPromise]) as any;
          session = result.data?.session;
          error = result.error;
        } catch (timeoutError) {
          console.warn('AuthContext: Session fetch timed out, continuing without session');
          if (mounted) {
            setUser(null);
            setLoading(false);
            setInitializing(false);
          }
          return;
        }

        if (authTimeout) clearTimeout(authTimeout);

        if (error) {
          console.error('AuthContext: Error getting session:', error);
          if (mounted) {
            setUser(null);
            setLoading(false);
            setInitializing(false);
          }
          return;
        }

        if (session?.user && mounted) {
          await fetchUserProfile(session.user);
        } else if (mounted) {
          setUser(null);
          setLoading(false);
          setInitializing(false);
        }
      } catch (error) {
        console.error('AuthContext: Error initializing auth:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
          setInitializing(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      console.log('Auth state change:', event, session?.user?.email || 'No user');
      try {
        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null);
        } else if (session?.user) {
          await fetchUserProfile(session.user);
        }
      } catch (error) {
        console.error('AuthContext: Error handling auth state change:', error);
      } finally {
        if (mounted) {
          setLoading(false);
          setInitializing(false);
        }
      }
    });

    return () => {
      mounted = false;
      if (authTimeout) clearTimeout(authTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const isAdmin = profile?.role === 'admin' || supabaseUser.email === 'your-admin-email@gmail.com';

      const userProfile: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: profile?.full_name || supabaseUser.user_metadata?.full_name || 'User',
        avatar_url: profile?.avatar_url || supabaseUser.user_metadata?.avatar_url,
        isAdmin,
        provider: 'email'
      };
      setUser(userProfile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Fallback user object
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: 'User',
        isAdmin: false,
        provider: 'email'
      });
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  };
  
  const signUp = async (email: string, password: string, fullName: string) => {
    const normalizedEmail = email.toLowerCase().trim();
    
    console.log(`Attempting signup for ${normalizedEmail}`);

    try {
      // Sign up without email confirmation
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          // Disable email confirmation
          emailRedirectTo: undefined
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        
        // Handle specific error types
        if (error.message?.includes('User already registered')) {
          return { 
            error: { 
              message: '📧 This email is already registered.\n\n💡 Try:\n• Sign in instead\n• Use a different email\n• Reset your password if you forgot it',
              status: 400 
            } 
          };
        }
        
        if (error.message?.includes('email rate limit exceeded') || error.message?.includes('over_email_send_rate_limit')) {
          return { 
            error: { 
              message: '⏰ Email service temporarily unavailable.\n\n🔧 This is a temporary issue with our email system.\n\n💡 Please try:\n• Wait a few minutes and try again\n• Contact support if the issue persists\n\nYour account may have been created successfully - try signing in.',
              status: 429,
              suggestSignIn: true
            } 
          };
        }
        
        if (error.message?.includes('Password should be at least')) {
          return { 
            error: { 
              message: '🔒 Password is too weak.\n\n✅ Requirements:\n• At least 6 characters\n• Mix of letters and numbers recommended',
              status: 400 
            } 
          };
        }
        
        if (error.message?.includes('Invalid email')) {
          return { 
            error: { 
              message: '📧 Invalid email format.\n\n💡 Please enter a valid email address.',
              status: 400 
            } 
          };
        }
        
        return { error };
      }

      console.log('Sign up successful');
      
      // If user is created and confirmed automatically, they should be signed in
      if (data.user && data.session) {
        console.log('User automatically signed in after signup');
        return { error: null };
      }
      
      // If user is created but not automatically signed in, try to sign them in
      if (data.user && !data.session) {
        console.log('User created, attempting automatic sign in');
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password
        });
        
        if (signInError) {
          console.error('Auto sign-in failed:', signInError);
          return { 
            error: { 
              message: '✅ Account created successfully!\n\n🔑 Please sign in with your credentials to continue.',
              status: 201,
              isSuccess: true
            } 
          };
        }
      }
      
      return { error: null };
    } catch (error) {
      console.error('Unexpected signup error:', error);
      return { 
        error: { 
          message: '❌ An unexpected error occurred.\n\n🔄 Please try again in a moment.',
          status: 500 
        } 
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Sign in error:', error);
    }
    setLoading(false);
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading: loading || initializing,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user,
    isAdmin: !!user?.isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};