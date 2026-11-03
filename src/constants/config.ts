/**
 * Application Constants and Environment Configuration
 *
 * Security: Only public (EXPO_PUBLIC_) variables are used client-side.
 * Secret keys (e.g. Supabase service_role) must NEVER be referenced here.
 */

export const SUPABASE_URL: string =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';

export const SUPABASE_ANON_KEY: string =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const IS_SUPABASE_CONFIGURED: boolean = Boolean(
  process.env.EXPO_PUBLIC_SUPABASE_URL &&
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.EXPO_PUBLIC_SUPABASE_URL.includes('placeholder')
);

/**
 * Domain policy constants
 * Defaults to '@hbplus.fit'. Can be customized or extended for testing via env vars.
 */
export const ALLOWED_EMAIL_DOMAIN: string =
  process.env.EXPO_PUBLIC_ALLOWED_EMAIL_DOMAIN || '@hbplus.fit';

/**
 * Optional list of developer/test emails permitted for testing when off-domain.
 * Example in .env: EXPO_PUBLIC_DEV_ALLOWED_EMAILS=myname@gmail.com,developer@test.com
 */
export const DEV_ALLOWED_EMAILS: string[] = (
  process.env.EXPO_PUBLIC_DEV_ALLOWED_EMAILS || ''
)
  .split(',')
  .map((e: string) => e.trim().toLowerCase())
  .filter(Boolean);

/**
 * Optional developer toggle to allow all emails during early sandbox testing.
 * Set EXPO_PUBLIC_DEV_ALLOW_ALL_EMAILS=true in .env to enable.
 */
export const DEV_ALLOW_ALL_EMAILS: boolean =
  process.env.EXPO_PUBLIC_DEV_ALLOW_ALL_EMAILS === 'true';

/**
 * Deep link scheme for native OAuth redirection
 */
export const APP_SCHEME = 'hbplus' as const;

/**
 * Standard user-facing error messages
 */
export const DOMAIN_RESTRICTION_MESSAGE =
  'Access restricted. Please login using your official domain email.' as const;

export const AUTH_CANCELLED_MESSAGE =
  'Google sign-in was cancelled.' as const;

export const AUTH_GENERIC_ERROR_MESSAGE =
  'Unable to complete authentication. Please try again or contact your administrator.' as const;
