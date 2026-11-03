import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import {
  APP_SCHEME,
  AUTH_CANCELLED_MESSAGE,
  AUTH_GENERIC_ERROR_MESSAGE,
  DOMAIN_RESTRICTION_MESSAGE,
} from '../../constants/config';
import { isAllowedEmail } from './domainPolicy';

// Ensure any in-progress auth session is cleanly completed (required for web auth session popups)
WebBrowser.maybeCompleteAuthSession();

export interface OAuthResult {
  type: 'success' | 'cancelled' | 'error';
  session?: Session | null;
  error?: string;
}

/**
 * Generates the platform-appropriate redirect URI for OAuth callback.
 * - Native: hbplus://auth/callback
 * - Web: window.location.origin + /auth/callback
 */
export function getOAuthRedirectUri(): string {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location) {
      return `${window.location.origin}/auth/callback`;
    }
    return makeRedirectUri({ path: 'auth/callback' });
  }

  return makeRedirectUri({
    scheme: APP_SCHEME,
    path: 'auth/callback',
  });
}

/**
 * Parses query and hash fragment parameters from an OAuth redirect URL.
 */
function parseUrlParameters(url: string): Record<string, string> {
  const params: Record<string, string> = {};

  const queryIndex = url.indexOf('?');
  const hashIndex = url.indexOf('#');

  let queryString = '';
  let hashString = '';

  if (queryIndex !== -1) {
    queryString =
      hashIndex !== -1 && hashIndex > queryIndex
        ? url.substring(queryIndex + 1, hashIndex)
        : url.substring(queryIndex + 1);
  }

  if (hashIndex !== -1) {
    hashString = url.substring(hashIndex + 1);
  }

  const combinedStrings = [queryString, hashString].filter(Boolean).join('&');

  if (!combinedStrings) return params;

  combinedStrings.split('&').forEach((item) => {
    const [key, value] = item.split('=');
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(
        (value || '').replace(/\+/g, ' ')
      );
    }
  });

  return params;
}

/**
 * Handles the OAuth redirect URL by exchanging PKCE authorization code
 * or setting session tokens.
 */
export async function handleOAuthRedirectUrl(
  url: string
): Promise<Session | null> {
  const params = parseUrlParameters(url);

  // Check for OAuth error parameters
  if (params.error || params.error_description) {
    const errorMsg =
      params.error_description || params.error || 'Authentication failed.';
    throw new Error(errorMsg);
  }

  // PKCE Authorization Code flow (Supabase default)
  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(
      params.code
    );
    if (error) throw error;
    return data.session;
  }

  // Implicit Grant flow (access_token in hash)
  if (params.access_token && params.refresh_token) {
    const { data, error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) throw error;
    return data.session;
  }

  // If no tokens/code present, check current Supabase session
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Initiates Google OAuth sign-in across platforms.
 *
 * - Web: Triggers browser redirection to Google through Supabase.
 * - Native (iOS/Android): Opens secure in-app browser session (ASWebAuthenticationSession / Custom Tabs)
 *   and intercepts the callback deep link to exchange credentials.
 */
export async function signInWithGoogle(): Promise<OAuthResult> {
  try {
    const redirectTo = getOAuthRedirectUri();

    if (Platform.OS === 'web') {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        return {
          type: 'error',
          error: error.message || AUTH_GENERIC_ERROR_MESSAGE,
        };
      }

      // On web, browser will redirect
      return { type: 'success' };
    }

    // Native flow
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      return {
        type: 'error',
        error: error.message || AUTH_GENERIC_ERROR_MESSAGE,
      };
    }

    if (!data?.url) {
      return {
        type: 'error',
        error: 'Authentication service did not provide a login URL.',
      };
    }

    // Open native browser sheet
    const authResult = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectTo
    );

    if (authResult.type === 'cancel' || authResult.type === 'dismiss') {
      return {
        type: 'cancelled',
        error: AUTH_CANCELLED_MESSAGE,
      };
    }

    if (authResult.type === 'success' && authResult.url) {
      const session = await handleOAuthRedirectUrl(authResult.url);
      return {
        type: 'success',
        session,
      };
    }

    return {
      type: 'error',
      error: AUTH_GENERIC_ERROR_MESSAGE,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : AUTH_GENERIC_ERROR_MESSAGE;
    return {
      type: 'error',
      error: message,
    };
  }
}

/**
 * Signs in user with manual Email + Password.
 * Pre-validates the @hbplus.fit domain policy before initiating request.
 */
export async function signInWithEmailPassword(
  email: string,
  password: string
): Promise<OAuthResult> {
  try {
    const normalized = email.trim().toLowerCase();

    // Enforce domain policy: reject non-@hbplus.fit emails before network call
    if (!isAllowedEmail(normalized)) {
      return {
        type: 'error',
        error: DOMAIN_RESTRICTION_MESSAGE,
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalized,
      password,
    });

    if (error) {
      return {
        type: 'error',
        error: error.message || 'Invalid email or password.',
      };
    }

    return {
      type: 'success',
      session: data.session,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Email sign in failed.';
    return {
      type: 'error',
      error: message,
    };
  }
}

/**
 * Sends a passwordless Magic Link / OTP to a verified @hbplus.fit email.
 */
export async function sendMagicLink(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const normalized = email.trim().toLowerCase();

    // Enforce domain policy: reject non-@hbplus.fit emails before network call
    if (!isAllowedEmail(normalized)) {
      return {
        success: false,
        error: DOMAIN_RESTRICTION_MESSAGE,
      };
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: {
        emailRedirectTo: getOAuthRedirectUri(),
        shouldCreateUser: false, // Only existing authorized users
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to send magic link.';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Signs out current user and clears persistent session storage.
 */
export async function signOutUser(): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return { error: error.message };
    return {};
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Sign out failed.';
    return { error: message };
  }
}

/**
 * Fetches the current session from Supabase client.
 */
export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;
  return data.session;
}

/**
 * Fetches the current verified user from Supabase client.
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}
