import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { env } from '../../config/env';

type Session = Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'];

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  signInWithOtp: (email: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  showLoginScreen: () => void;
  hideLoginScreen: () => void;
  isLoginScreenVisible: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoginScreenVisible, setIsLoginScreenVisible] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Check if we have valid Supabase config
    if (env.supabaseUrl.includes('placeholder')) {
      console.log('[Auth] Using mock authentication for development');
      if (mounted) {
        setLoading(false);
        // Mock authenticated session for development
        setSession({ 
          user: { 
            id: 'mock-user-id', 
            email: 'developer@kigen.app' 
          } 
        } as Session);
      }
      return;
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (mounted) {
        if (error) {
          console.error('[Auth] Error getting session:', error.message);
        }
        setSession(data.session);
        setLoading(false);
      }
    }).catch((error) => {
      console.error('[Auth] Failed to get session:', error.message);
      if (mounted) {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, current) => {
      setSession(current);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signInWithOtp(email: string) {
    if (env.supabaseUrl.includes('placeholder')) {
      console.log('[Auth] Mock sign-in for development');
      return;
    }
    await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: 'https://example.com/auth' } });
  }

  async function signInWithPassword(email: string, password: string) {
    if (env.supabaseUrl.includes('placeholder')) {
      console.log('[Auth] Mock password sign-in for development');
      // Mock successful authentication
      setSession({ 
        user: { 
          id: 'mock-user-id', 
          email: email 
        } 
      } as Session);
      return;
    }
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signUp(email: string, password: string, name?: string) {
    if (env.supabaseUrl.includes('placeholder')) {
      console.log('[Auth] Mock sign-up for development');
      // Mock successful registration
      setSession({ 
        user: { 
          id: 'mock-user-id', 
          email: email,
          user_metadata: { name }
        },
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        token_type: 'bearer'
      } as unknown as Session);
      return;
    }
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });
    if (error) throw error;
  }

  async function signOut() {
    if (env.supabaseUrl.includes('placeholder')) {
      console.log('[Auth] Mock sign-out for development');
      setSession(null);
      return;
    }
    await supabase.auth.signOut();
  }

  function showLoginScreen() {
    setIsLoginScreenVisible(true);
  }

  function hideLoginScreen() {
    setIsLoginScreenVisible(false);
  }

  return (
    <AuthContext.Provider value={{ 
      session, 
      loading, 
      signInWithOtp, 
      signInWithPassword,
      signUp,
      signOut,
      showLoginScreen,
      hideLoginScreen,
      isLoginScreenVisible
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}