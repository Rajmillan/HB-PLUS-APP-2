import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from '../auth';
import {
  getProfile,
  provisionDefaultProfile,
  updateProfile,
} from './profileService';
import type { Profile, ProfileState } from './types';

export const ProfileContext = createContext<ProfileState | undefined>(
  undefined
);

interface ProfileProviderProps {
  children: React.ReactNode;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({
  children,
}) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getProfile(user.id);

      if (response.error) {
        setError(response.error);
        setProfile(null);
      } else if (response.data) {
        setProfile(response.data);
      } else {
        // Profile not found in database (trigger may be pending or table empty)
        // Attempt safe fallback insert with role='user'
        const provisionRes = await provisionDefaultProfile(user);
        if (provisionRes.data) {
          setProfile(provisionRes.data);
        } else {
          // If provisioning fails, synthesize a fallback read state from verified auth claims
          // but role defaults strictly to 'user'
          setProfile({
            id: user.id,
            email: user.email || '',
            full_name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              null,
            avatar_url:
              user.user_metadata?.avatar_url ||
              user.user_metadata?.picture ||
              null,
            role: 'user',
            created_at: new Date().toISOString(),
          });
        }
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Error fetching user profile.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Re-fetch profile whenever user changes or session restores
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleUpdateName = useCallback(
    async (
      fullName: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (!user) {
        return { success: false, error: 'User is not authenticated.' };
      }

      const res = await updateProfile(user.id, { full_name: fullName });
      if (res.error) {
        return { success: false, error: res.error };
      }

      if (res.data) {
        setProfile(res.data);
        return { success: true };
      }

      return { success: false, error: 'Unknown update error.' };
    },
    [user]
  );

  const isAdmin = Boolean(profile && profile.role === 'admin');

  const contextValue = useMemo<ProfileState>(
    () => ({
      profile,
      loading,
      error,
      isAdmin,
      refreshProfile: fetchUserProfile,
      updateProfileName: handleUpdateName,
    }),
    [profile, loading, error, isAdmin, fetchUserProfile, handleUpdateName]
  );

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
};

export function useProfile(): ProfileState {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider.');
  }
  return context;
}
