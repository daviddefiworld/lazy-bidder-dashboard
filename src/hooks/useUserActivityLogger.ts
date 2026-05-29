import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';
import type { LogUserActivityInput } from '../types/userActivity';

export function useUserActivityLogger() {
  const { user } = useAuth();

  return useCallback(
    (input: LogUserActivityInput) => {
      if (!user || user.role === 'admin') return;
      void apiService.logUserActivity(input).catch(() => {
        // Activity logging should never block UI flows.
      });
    },
    [user]
  );
}
