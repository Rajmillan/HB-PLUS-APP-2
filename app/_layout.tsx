import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/features/auth';
import { ProfileProvider } from '../src/features/profile';
import { LoadingScreen } from '../src/components';

/**
 * Root NavigationGuard coordinates top-level authentication state:
 * - Shows LoadingScreen while auth initializes.
 * - Redirects unauthenticated requests to /login.
 * - Redirects authenticated users away from /login to the protected dashboard (/).
 */
function NavigationGuard() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const currentSegment = segments[0] || '';
    const isAuthRoute =
      currentSegment === 'login' || currentSegment === 'auth';

    if (!user && !isAuthRoute) {
      router.replace('/login');
    } else if (user && currentSegment === 'login') {
      router.replace('/');
    }
  }, [user, loading, segments, router]);

  if (loading) {
    return <LoadingScreen message="Verifying authorization..." />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="(app)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="auth/callback" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ProfileProvider>
          <NavigationGuard />
        </ProfileProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
