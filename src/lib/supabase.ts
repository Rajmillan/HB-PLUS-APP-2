import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import {
  IS_SUPABASE_CONFIGURED,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from '../constants/config';

if (!IS_SUPABASE_CONFIGURED) {
  console.warn(
    '[Supabase] Warning: EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is missing. ' +
      'Please copy .env.example to .env and configure your Supabase credentials.'
  );
}

/**
 * Single cross-platform Supabase client instance.
 *
 * Configured for:
 * - Native (iOS/Android): AsyncStorage for session persistence, manual deep link/session handling.
 * - Web: AsyncStorage (localStorage adapter), auto-detection of OAuth session tokens in URL.
 *
 * Security: Uses anon/public key only. Database access control must be enforced
 * via Supabase Row Level Security (RLS) policies in Phase 2.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
