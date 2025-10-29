/**
 * Custom hook for managing extension status updates
 */
import { useState, useCallback } from 'react';
import { ExtensionStatus } from '../types/dashboard';

export const useExtensionStatus = (extensionId?: string) => {
  const [status, setStatus] = useState<ExtensionStatus | null>(null);

  const updateStatus = useCallback((updates: Partial<ExtensionStatus>) => {
    setStatus(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const handleStatusUpdate = useCallback((data: any) => {
    if (!extensionId || data.extensionId === extensionId) {
      updateStatus({
        currentUrl: data.currentUrl,
        lastSeen: new Date(data.lastSeen),
        isOnline: true
      });
    }
  }, [extensionId, updateStatus]);

  const handleActivationUpdate = useCallback((data: any) => {
    if (!extensionId || data.extensionId === extensionId) {
      updateStatus({
        isRunning: data.isActive
      });
    }
  }, [extensionId, updateStatus]);

  const handleRunningUpdate = useCallback((data: any) => {
    if (!extensionId || data.extensionId === extensionId) {
      updateStatus({
        isRunning: data.isRunning
      });
    }
  }, [extensionId, updateStatus]);

  const handleOnlineStatus = useCallback((data: any) => {
    if (!extensionId || data.extensionId === extensionId) {
      updateStatus({
        isOnline: data.isOnline,
        lastSeen: new Date()
      });
    }
  }, [extensionId, updateStatus]);

  return {
    status,
    setStatus,
    updateStatus,
    handleStatusUpdate,
    handleActivationUpdate,
    handleRunningUpdate,
    handleOnlineStatus
  };
};
