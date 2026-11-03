import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LoadingScreen } from '../../src/components';
import { useAuth } from '../../src/features/auth';
import { handleOAuthRedirectUrl } from '../../src/features/auth/authService';

/**
 * Route handler for OAuth redirects.
 * Intercepts callback parameters on web or deep links, completes token exchange,
 * and delegates navigation to the root layout guard.
 */
export default function AuthCallback() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    async function processCallback() {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        try {
          if (window.location.search || window.location.hash) {
            await handleOAuthRedirectUrl(window.location.href);
          }
        } catch (err) {
          console.error('[AuthCallback] Error handling web OAuth callback:', err);
        }
      }
    }

    processCallback();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return <LoadingScreen message="Finalizing authentication..." />;
}
