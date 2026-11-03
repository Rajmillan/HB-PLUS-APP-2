/**
 * Profile and Role Type Definitions for HBPLUS (Phase 2)
 */

export type UserRole = 'admin' | 'user';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
}

export interface AdminAnnouncement {
  id: string;
  title: string;
  content: string;
  priority: 'standard' | 'urgent' | 'critical';
  created_by?: string | null;
  created_at: string;
}

export interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  updateProfileName: (fullName: string) => Promise<{ success: boolean; error?: string }>;
}
