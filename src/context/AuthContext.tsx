import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { googleAuth } from '../lib/googleAuth';

interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatar_url?: string;
  isAdmin?: boolean;
  provider?: 'email' | 'google' | 'phone';
  name?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, fullName: string) => Promise<{ error: any }>;
  signIn: (emailOrUsername: string, password: string) => Promise<{ error: any }>;
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
        .from('user_profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      // Check if user is admin based on email
      const adminEmails = ['admin@primojobs.com', 'admin@example.com', 'virat52418@gmail.com'];
      const isAdmin = adminEmails.includes(supabaseUser.email || '');

      const userProfile: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        username: profile?.username || supabaseUser.user_metadata?.username || 'user',
        fullName: profile?.full_name || supabaseUser.user_metadata?.full_name || 'User',
        name: profile?.full_name || supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || 'User',
        avatar_url: profile?.avatar_url || supabaseUser.user_metadata?.avatar_url,
        phone: profile?.phone || supabaseUser.user_metadata?.phone,
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
        username: 'user',
        fullName: 'User',
        name: 'User',
        isAdmin: false,
        provider: 'email'
      });
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  };

  const signUp = async (email: string, password: string, username: string, fullName: string) => {
    try {
      // First check if username already exists
      const { data: existingUser, error: usernameCheckError } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      // If there's any error from maybeSingle, handle it
      if (usernameCheckError) {
        console.error('Username check error:', usernameCheckError);
        return { error: { message: 'Unable to verify username availability. Please try again.' } };
      }

      if (existingUser) {
        return { error: { message: 'Username already exists. Please choose a different username.' } };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName
          }
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        return { error };
      }

      // If signup successful, create user profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email_address: email,
            username,
            full_name: fullName,
            role: 'client'
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }
      }

      return { error: null };
    } catch (error) {
      console.error('Unexpected sign up error:', error);
      return { error };
    }
  };

  const signIn = async (emailOrUsername: string, password: string) => {
    try {
      let email = emailOrUsername;

      // Check if input is username (doesn't contain @)
      if (!emailOrUsername.includes('@')) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('email_address')
          .eq('username', emailOrUsername)
          .maybeSingle();

        if (profileError) {
          console.error('Profile lookup error:', profileError);
          return { error: { message: 'Unable to find user. Please try again.' } };
        }

        if (!profile) {
          return { error: { message: 'Username not found. Please check your username or use email to login.' } };
        }

        email = profile.email_address;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Sign in error:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('Starting Google sign-in...');
      
      // Use Google Identity Services for sign-in
      const googleUser = await googleAuth.signInWithGoogle();
      console.log('Google user data:', googleUser);
      
      // Sign in with Supabase using the Google user data
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });
      
      if (error) {
        console.error('Supabase Google sign-in error:', error);
        return { error };
      }
      
      console.log('Google sign-in successful');
      return { error: null };
      
    } catch (error) {
      console.error('Google sign-in failed:', error);
      return { error: { message: error.message || 'Google sign-in failed' } };
    }
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