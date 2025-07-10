import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  phone: string;
  name: string;
  avatar_url?: string;
  isAdmin?: boolean;
  provider?: 'phone' | 'google';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  sendOTP: (phone: string) => Promise<{ error: any }>;
  verifyOTP: (phone: string, otp: string) => Promise<{ error: any }>;
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
      console.log('Auth state change:', event, session?.user?.phone || 'No user');
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

      // Check if user is admin based on phone number
      const adminPhones = ['+919876543210', '+911234567890']; // Add admin phone numbers
      const isAdmin = adminPhones.includes(supabaseUser.phone || '');

      const userProfile: User = {
        id: supabaseUser.id,
        phone: supabaseUser.phone || '',
        name: profile?.name || supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || 'User',
        avatar_url: profile?.avatar_url || supabaseUser.user_metadata?.avatar_url,
        isAdmin,
        provider: supabaseUser.app_metadata?.provider || 'phone'
      };
      setUser(userProfile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Fallback user object
      setUser({
        id: supabaseUser.id,
        phone: supabaseUser.phone || '',
        name: 'User',
        isAdmin: false,
        provider: 'phone'
      });
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  };

  const sendOTP = async (phone: string) => {
    try {
      // Ensure phone number is in correct format (+91xxxxxxxxxx)
      const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          channel: 'sms'
        }
      });

      if (error) {
        console.error('Send OTP error:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Unexpected send OTP error:', error);
      return { error };
    }
  };

  const verifyOTP = async (phone: string, otp: string) => {
    try {
      // Ensure phone number is in correct format
      const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
      
      const { error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms'
      });

      if (error) {
        console.error('Verify OTP error:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Unexpected verify OTP error:', error);
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login`
      }
    });
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
    sendOTP,
    verifyOTP,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
    isAdmin: !!user?.isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};