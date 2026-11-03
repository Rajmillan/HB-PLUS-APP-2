import type { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { AdminAnnouncement, Profile } from './types';

export interface ProfileServiceResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Reads user profile from public.profiles table using Supabase client.
 * Enforces RLS: users can only read their own profile with valid @hbplus.fit domain.
 */
export async function getProfile(
  userId: string
): Promise<ProfileServiceResponse<Profile>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url, role, created_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return {
        data: null,
        error: error.message || 'Unable to retrieve user profile.',
      };
    }

    return {
      data: data as Profile | null,
      error: null,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Network error while fetching profile.';
    return {
      data: null,
      error: message,
    };
  }
}

/**
 * Fallback self-provisioning: If trigger was delayed or unavailable,
 * client attempts safe insert with role='user'.
 * RLS enforces auth.uid() = id, valid @hbplus.fit domain, and role='user'.
 */
export async function provisionDefaultProfile(
  user: User
): Promise<ProfileServiceResponse<Profile>> {
  try {
    const defaultName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      '';
    const defaultAvatar =
      user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

    const newProfile = {
      id: user.id,
      email: user.email?.trim().toLowerCase() || '',
      full_name: defaultName,
      avatar_url: defaultAvatar,
      role: 'user' as const, // Strict client constraint: cannot self-assign admin
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(newProfile, { onConflict: 'id' })
      .select('id, email, full_name, avatar_url, role, created_at')
      .single();

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: data as Profile,
      error: null,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to provision profile.';
    return {
      data: null,
      error: message,
    };
  }
}

/**
 * Updates editable profile fields (full_name, avatar_url).
 * Note: Role modification is strictly forbidden and stripped out client-side,
 * and enforced server-side via PostgreSQL RLS and trigger.
 */
export async function updateProfile(
  userId: string,
  updates: { full_name?: string; avatar_url?: string }
): Promise<ProfileServiceResponse<Profile>> {
  try {
    // Defense-in-depth: explicitly only include full_name and avatar_url
    const safePayload: { full_name?: string; avatar_url?: string } = {};
    if (updates.full_name !== undefined) {
      safePayload.full_name = updates.full_name.trim();
    }
    if (updates.avatar_url !== undefined) {
      safePayload.avatar_url = updates.avatar_url;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(safePayload)
      .eq('id', userId)
      .select('id, email, full_name, avatar_url, role, created_at')
      .single();

    if (error) {
      return {
        data: null,
        error: error.message || 'Failed to update profile.',
      };
    }

    return {
      data: data as Profile,
      error: null,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unexpected error updating profile.';
    return {
      data: null,
      error: message,
    };
  }
}

/**
 * Fetches admin announcements from public.admin_announcements table.
 * Secured by RLS (public.is_admin() server function).
 * Non-admin users will receive empty results or an authorization error from PostgreSQL.
 */
export async function getAdminAnnouncements(): Promise<
  ProfileServiceResponse<AdminAnnouncement[]>
> {
  try {
    const { data, error } = await supabase
      .from('admin_announcements')
      .select('id, title, content, priority, created_by, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return {
        data: null,
        error: error.message || 'Access restricted to administrators.',
      };
    }

    return {
      data: (data || []) as AdminAnnouncement[],
      error: null,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : 'Failed to retrieve admin announcements.';
    return {
      data: null,
      error: message,
    };
  }
}

/**
 * Creates an admin announcement.
 * Enforced by RLS: will fail with a database violation if caller is not an admin.
 */
export async function postAdminAnnouncement(
  title: string,
  content: string,
  priority: 'standard' | 'urgent' | 'critical' = 'standard'
): Promise<ProfileServiceResponse<AdminAnnouncement>> {
  try {
    const { data, error } = await supabase
      .from('admin_announcements')
      .insert({
        title: title.trim(),
        content: content.trim(),
        priority,
      })
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: data as AdminAnnouncement,
      error: null,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to publish announcement.';
    return {
      data: null,
      error: message,
    };
  }
}
