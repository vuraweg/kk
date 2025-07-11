import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase'; // Assuming supabase client is configured and exported from this path
import { User as SupabaseUser } from '@supabase/supabase-js';

// Define the structure of our custom User object
interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatar_url?: string;
  isAdmin?: boolean;
  provider?: 'email' | 'google' | 'phone';
  // 'name' is often used by Google provider, so we include it for compatibility
  name?: string;
  phone?: string;
}

// Define the shape of the Auth context
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

// Create the Auth context with an undefined default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Custom hook to use the AuthContext.
 * Throws an error if used outside of an AuthProvider.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component that manages authentication state and provides auth functions.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetches the user's profile from the `user_profiles` table
   * and builds a complete User object.
   * @param supabaseUser - The user object from Supabase auth.
   */
  const fetchUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single(); // Use .single() to ensure one record is returned or throw an error

      if (error && error.code !== 'PGRST116') { // PGRST116: "exact one row expected"
        throw error;
      }
      
      // Define a list of admin emails for role checking
      const adminEmails = ['admin@primojobs.com', 'admin@example.com', 'virat52418@gmail.com'];
      const isAdmin = adminEmails.includes(supabaseUser.email || '');

      // Construct the final user object, merging data from auth and our profile table
      const userProfile: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        // Fallback chain for username and fullName for robustness
        username: profile?.username || supabaseUser.user_metadata?.username || 'user',
        fullName: profile?.full_name || supabaseUser.user_metadata?.full_name || 'User',
        name: profile?.full_name || supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name,
        avatar_url: profile?.avatar_url || supabaseUser.user_metadata?.avatar_url,
        phone: profile?.phone || supabaseUser.phone,
        isAdmin,
        provider: supabaseUser.app_metadata?.provider || 'email',
      };
      
      setUser(userProfile);

    } catch (error) {
      console.error('Error fetching user profile:', error);
      // If fetching the profile fails, create a fallback user object from the auth data
      // This ensures the app doesn't break if the profile is temporarily unavailable
      const adminEmails = ['admin@primojobs.com', 'admin@example.com', 'virat52418@gmail.com'];
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        username: supabaseUser.user_metadata?.username || 'user',
        fullName: supabaseUser.user_metadata?.full_name || 'User',
        name: supabaseUser.user_metadata?.name || 'User',
        avatar_url: supabaseUser.user_metadata?.avatar_url,
        phone: supabaseUser.phone,
        isAdmin: adminEmails.includes(supabaseUser.email || ''),
        provider: supabaseUser.app_metadata?.provider || 'email',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Effect to handle initial session loading and auth state changes
  useEffect(() => {
    setLoading(true);
    // 1. Fetch the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user);
      } else {
        setLoading(false);
        setUser(null);
      }

      // 2. Set up a listener for auth state changes (SIGN_IN, SIGN_OUT, etc.)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (session?.user) {
            await fetchUserProfile(session.user);
          } else {
            setUser(null);
          }
          setLoading(false);
        }
      );

      // Cleanup function to unsubscribe from the listener
      return () => {
        subscription.unsubscribe();
      };
    });
  }, []);

  /**
   * Signs up a new user with email and password.
   * Also creates a corresponding entry in the `user_profiles` table.
   */
  const signUp = async (email: string, password: string, username: string, fullName: string) => {
    try {
      // First, check if the desired username is already taken
      const { data: existingUser, error: usernameCheckError } = await supabase
        .from('user_profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (usernameCheckError) {
        console.error('Username check error:', usernameCheckError);
        return { error: { message: 'Error checking username. Please try again.' } };
      }

      if (existingUser) {
        return { error: { message: 'Username is already taken. Please choose another.' } };
      }

      // Proceed with Supabase auth sign-up
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Add custom data to be stored in the user's metadata
          data: {
            username,
            full_name: fullName,
          },
        },
      });

      if (error) {
        return { error };
      }

      // If auth sign-up is successful and a user object is returned, create the public profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email_address: email, // Storing email here can be useful for lookups
            username,
            full_name: fullName,
            role: 'client', // Default role
          });

        if (profileError) {
          // This is a secondary error; the user is created in auth but their profile failed.
          // You might want to handle this case, e.g., by notifying an admin.
          console.error('Failed to create user profile:', profileError);
        }
      }

      return { error: null };
    } catch (error: any) {
      console.error('Unexpected sign up error:', error);
      return { error };
    }
  };

  /**
   * Signs in a user using either their email or username.
   */
  const signIn = async (emailOrUsername: string, password: string) => {
    try {
      let email = emailOrUsername;

      // If the input doesn't look like an email, assume it's a username
      // and fetch the corresponding email from our profiles table.
      if (!emailOrUsername.includes('@')) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('email_address')
          .eq('username', emailOrUsername)
          .single();

        if (profileError || !profile) {
          return { error: { message: 'Invalid username or password.' } };
        }
        email = profile.email_address;
      }

      // Sign in with the resolved email and password
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error: any) {
      console.error('Unexpected sign in error:', error);
      return { error };
    }
  };
  
  /**
   * Initiates the Google OAuth sign-in flow.
   */
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Redirect URL after successful sign-in
        redirectTo: window.location.origin,
        // Optional: query params for Google OAuth
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('Google sign-in error:', error);
      return { error };
    }

    return { error: null };
  };

  /**
   * Signs out the current user.
   */
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // The value provided to consuming components
  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
    isAdmin: !!user?.isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
