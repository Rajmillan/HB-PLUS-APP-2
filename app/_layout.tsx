import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/features/auth';
import { LoadingScreen } from '../src/components';

/**
 * NavigationGuard coordinates route protection based on verified auth state.
 *
 * Rules:
 * 1. While auth is loading/restoring, renders LoadingScreen (never flashes protected content).
 * 2. If unauthenticated and trying to view protected route, redirects immediately to /login.
 * 3. If authenticated with verified @hbplus.fit and on /login, redirects to /.
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
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="auth/callback" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationGuard />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
