import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { debounce } from 'lodash'; // Make sure to install lodash if not already installed

// Global rate limiting
let lastSignupAttempt = 0;
const GLOBAL_COOLDOWN = 30000; // 30 seconds between ANY signup attempts

// Email-specific rate limiting
const emailAttempts = new Map<string, number>();
const EMAIL_COOLDOWN = 120000; // 120 seconds (2 minutes) between attempts for the same email

// This is the actual signup logic
const performSignup = async (email: string, password: string, fullName: string) => {
  const now = Date.now();
  const normalizedEmail = email.toLowerCase().trim();

  console.log(`Attempting signup for ${normalizedEmail}`);

  try {
    // Use login page as redirect destination
    const redirectTo = `${window.location.origin}/login`;

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          full_name: fullName,
        }
      }
    });

    if (error) {
      console.error('Sign up error:', error);
      return { error };
    }

    console.log('Sign up successful');
    return { data, error: null };
  } catch (error) {
    console.error('Unexpected signup error:', error);
    return { error };
  }
};

interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  isAdmin?: boolean;
  provider?: 'email' | 'google';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
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
        provider: supabaseUser.app_metadata?.provider || 'email'
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
  
  // This is the main signup function that will be exposed
  const signUp = async (email: string, password: string, fullName: string) => {
    const now = Date.now();
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check global cooldown
    if (now - lastSignupAttempt < GLOBAL_COOLDOWN) {
      const waitTime = Math.ceil((GLOBAL_COOLDOWN - (now - lastSignupAttempt)) / 1000);
      console.log(`Global signup cooldown in effect. Please wait ${waitTime} seconds.`);
      return { 
        error: { 
          message: `Please wait ${waitTime} seconds before trying again.`,
          status: 429 
        } 
      };
    }
    
    // Check email-specific cooldown
    const lastEmailAttempt = emailAttempts.get(normalizedEmail) || 0;
    if (now - lastEmailAttempt < EMAIL_COOLDOWN) {
      const waitTime = Math.ceil((EMAIL_COOLDOWN - (now - lastEmailAttempt)) / 1000);
      console.log(`Email cooldown in effect for ${normalizedEmail}. Please wait ${waitTime} seconds.`);
      return { 
        error: { 
          message: `Too many attempts with this email. Please wait ${waitTime} seconds or try a different email.`,
          status: 429 
        } 
      };
    }
    
    // Update timestamps before performing signup
    lastSignupAttempt = now;
    emailAttempts.set(normalizedEmail, now);
    
    // Perform the actual signup
    return await performSignup(email, password, fullName);
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

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) console.error('Google sign in error:', error);
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
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
    isAdmin: !!user?.isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};