import type { User } from '@supabase/supabase-js';
import {
  ALLOWED_EMAIL_DOMAIN,
  DEV_ALLOW_ALL_EMAILS,
  DEV_ALLOWED_EMAILS,
  DOMAIN_RESTRICTION_MESSAGE,
} from '../../constants/config';

/**
 * Validates if an email belongs to the authorized domain policy.
 *
 * Rules:
 * - Trims and lowercases the input.
 * - Supports developer override via EXPO_PUBLIC_DEV_ALLOWED_EMAILS or EXPO_PUBLIC_DEV_ALLOW_ALL_EMAILS.
 * - Requires exact suffix "@hbplus.fit" (or configured ALLOWED_EMAIL_DOMAIN).
 * - DOES NOT use String.prototype.includes() per strict assignment requirements.
 * - Ensures a valid local part exists prior to the domain.
 */
export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const normalized = email.trim().toLowerCase();

  // Basic sanity check: must contain '@' and have characters before and after
  const atPos = normalized.indexOf('@');
  if (atPos <= 0 || atPos === normalized.length - 1) {
    return false;
  }

  // Developer toggle: allow all emails during testing if explicitly enabled
  if (DEV_ALLOW_ALL_EMAILS) {
    return true;
  }

  // Developer whitelist: allow specific test/dev emails if listed
  if (DEV_ALLOWED_EMAILS.indexOf(normalized) !== -1) {
    return true;
  }

  // Guard against string just being the domain without a local part
  if (normalized.length <= ALLOWED_EMAIL_DOMAIN.length) {
    return false;
  }

  // Exact suffix check (NO includes() used)
  if (!normalized.endsWith(ALLOWED_EMAIL_DOMAIN)) {
    return false;
  }

  // Ensure valid local part before domain
  const localPart = normalized.slice(0, normalized.length - ALLOWED_EMAIL_DOMAIN.length);

  // Local part must be non-empty and cannot contain another '@'
  if (localPart.length === 0 || localPart.indexOf('@') !== -1) {
    return false;
  }

  return true;
}

/**
 * Validates whether the user's email address is verified by Supabase or Google OAuth.
 */
export function isEmailVerified(
  user: Partial<Pick<User, 'email_confirmed_at' | 'confirmed_at' | 'user_metadata' | 'app_metadata'>> | null | undefined
): boolean {
  if (!user) {
    return false;
  }

  // Check Supabase email_confirmed_at timestamp
  if (Boolean(user.email_confirmed_at) || Boolean(user.confirmed_at)) {
    return true;
  }

  // Check OAuth provider claims in user_metadata
  if (user.user_metadata && user.user_metadata.email_verified === true) {
    return true;
  }

  return false;
}

export interface DomainValidationResult {
  isAuthorized: boolean;
  errorMessage?: string;
}

/**
 * Comprehensive check for user authorization against the domain policy.
 * Rejects missing email, non-matching domain, or unverified email.
 */
export function validateAuthorizedUser(
  user: User | null | undefined
): DomainValidationResult {
  if (!user || !user.email) {
    return {
      isAuthorized: false,
      errorMessage: DOMAIN_RESTRICTION_MESSAGE,
    };
  }

  if (!isAllowedEmail(user.email)) {
    return {
      isAuthorized: false,
      errorMessage: DOMAIN_RESTRICTION_MESSAGE,
    };
  }

  if (!isEmailVerified(user)) {
    return {
      isAuthorized: false,
      errorMessage: DOMAIN_RESTRICTION_MESSAGE,
    };
  }

  return { isAuthorized: true };
}
