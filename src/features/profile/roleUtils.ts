import type { UserRole } from './types';

/**
 * Validates whether a given string is a valid UserRole.
 */
export function isValidRole(role: unknown): role is UserRole {
  return role === 'admin' || role === 'user';
}

/**
 * Evaluates whether an entity has admin privileges.
 * Strict check: must strictly equal 'admin'.
 */
export function checkIsAdmin(role: unknown): boolean {
  return role === 'admin';
}

/**
 * Strips privileged or immutable fields from profile updates to enforce
 * client-side defense-in-depth before sending payloads to Supabase.
 * Server RLS and database triggers remain the true security boundary.
 */
export function sanitizeProfileUpdate(input: Record<string, unknown>): {
  full_name?: string;
  avatar_url?: string;
} {
  const sanitized: { full_name?: string; avatar_url?: string } = {};

  if (typeof input.full_name === 'string') {
    sanitized.full_name = input.full_name.trim();
  }

  if (typeof input.avatar_url === 'string' || input.avatar_url === null) {
    sanitized.avatar_url = input.avatar_url === null ? undefined : input.avatar_url;
  }

  // Notice: 'role', 'id', 'email', 'created_at' are intentionally ignored and omitted.
  return sanitized;
}
