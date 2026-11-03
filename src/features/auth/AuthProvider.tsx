import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import {
  AUTH_CANCELLED_MESSAGE,
  AUTH_GENERIC_ERROR_MESSAGE,
  DOMAIN_RESTRICTION_MESSAGE,
} from '../../constants/config';
import { signInWithGoogle, signOutUser } from './authService';
import { validateAuthorizedUser } from './domainPolicy';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isSigningIn: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Evaluates session and enforces domain restriction.
   * If non-matching domain or unverified:
   * 1. Signs out immediately from Supabase client
   * 2. Purges session and user state
   * 3. Sets restricted domain error
   *
   * Returns true if authorized, false if rejected.
   */
  const processAndValidateSession = useCallback(
    async (incomingSession: Session | null): Promise<boolean> => {
      if (!incomingSession?.user) {
        setUser(null);
        setSession(null);
        return false;
      }

      const validation = validateAuthorizedUser(incomingSession.user);

      if (!validation.isAuthorized) {
        // Enforce immediate sign out and state purge
        try {
          await supabase.auth.signOut();
        } catch (signOutErr) {
          console.error('[AuthProvider] Error during security purge sign out:', signOutErr);
        }
        setUser(null);
        setSession(null);
        setError(DOMAIN_RESTRICTION_MESSAGE);
        return false;
      }

      // Valid @hbplus.fit authenticated user
      setUser(incomingSession.user);
      setSession(incomingSession);
      return true;
    },
    []
  );

  // Initial session restoration and auth state change subscription
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const { data, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr) {
          console.warn('[AuthProvider] Session retrieval note:', sessionErr.message);
        }

        if (isMounted) {
          if (data?.session) {
            await processAndValidateSession(data.session);
          } else {
            setUser(null);
            setSession(null);
          }
        }
      } catch (initErr) {
        console.error('[AuthProvider] Initial session restoration error:', initErr);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    // Listen for auth state transitions (OAuth redirects, tokens, sign-out)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setLoading(false);
        return;
      }

      if (
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED'
      ) {
        if (newSession) {
          await processAndValidateSession(newSession);
        } else {
          setUser(null);
          setSession(null);
        }
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [processAndValidateSession]);

  const handleSignInWithGoogle = useCallback(async (): Promise<boolean> => {
    setError(null);
    setIsSigningIn(true);
    try {
      const result = await signInWithGoogle();

      if (result.type === 'cancelled') {
        setError(AUTH_CANCELLED_MESSAGE);
        return false;
      }

      if (result.type === 'error') {
        setError(result.error || AUTH_GENERIC_ERROR_MESSAGE);
        return false;
      }

      if (result.type === 'success' && result.session) {
        const authorized = await processAndValidateSession(result.session);
        return authorized;
      }

      // On web redirect, the page will reload with tokens, handled by restoreSession/listener
      return true;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : AUTH_GENERIC_ERROR_MESSAGE;
      setError(message);
      return false;
    } finally {
      setIsSigningIn(false);
    }
  }, [processAndValidateSession]);

  const handleSignOut = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const { error: signOutErr } = await signOutUser();
      if (signOutErr) {
        setError(signOutErr);
      } else {
        setError(null);
      }
      setUser(null);
      setSession(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Sign out failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      loading,
      isSigningIn,
      error,
      signInWithGoogle: handleSignInWithGoogle,
      signOut: handleSignOut,
      clearError,
    }),
    [
      user,
      session,
      loading,
      isSigningIn,
      error,
      handleSignInWithGoogle,
      handleSignOut,
      clearError,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
