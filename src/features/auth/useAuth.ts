import { useContext } from 'react';
import { AuthContext, type AuthContextType } from './AuthProvider';

/**
 * Hook to access current authentication state and actions.
 * Throws a helpful error if used outside an AuthProvider hierarchy.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
