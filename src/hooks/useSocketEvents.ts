import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { ExtensionStatus } from '../types/dashboard';
import { UrlHistoryItem } from '../services/apiService';

interface UseSocketEventsReturn {
  extensionStatuses: Record<string, ExtensionStatus>;
  onUrlChange: (callback: (urlHistoryItem: UrlHistoryItem) => void) => void;
}

export const useSocketEvents = (): UseSocketEventsReturn => {
  const { isConnected, on, off, requestExtensionStatus } = useSocket();
  const { user } = useAuth();
  const [extensionStatuses, setExtensionStatuses] = useState<Record<string, ExtensionStatus>>({});
  const urlChangeCallbackRef = useRef<((urlHistoryItem: UrlHistoryItem) => void) | null>(null);

  useEffect(() => {
    // Set up socket event listeners for real-time updates
    const handleExtensionStatusList = (data: any) => {
      console.log('Received extension status list:', data);
      const statusMap: Record<string, ExtensionStatus> = {};
      
      data.extensions.forEach((ext: any) => {
        // Extensions are considered online if they're in the status list (connected to backend)
        statusMap[ext.extensionId] = {
          isRunning: ext.isRunning,
          lastSeen: new Date(ext.lastSeen),
          isOnline: true, // If we're getting this list, extensions are connected
          currentUrl: ext.currentUrl
        };
      });
      
      setExtensionStatuses(statusMap);
    };

    const handleExtensionRunningUpdate = (data: any) => {
      console.log('Received extension running update:', data);
      setExtensionStatuses(prev => ({
        ...prev,
        [data.extensionId]: {
          ...prev[data.extensionId],
          isRunning: data.isRunning,
          lastSeen: new Date(data.timestamp)
        }
      }));
    };

    const handleExtensionStatus = (data: any) => {
      console.log('Received extension status:', data);
      if (data.extensionId) {
        setExtensionStatuses(prev => ({
          ...prev,
          [data.extensionId]: {
            ...prev[data.extensionId],
            isOnline: data.isConnected,
            lastSeen: new Date(data.lastSeen || Date.now()),
            currentUrl: data.currentUrl
          }
        }));
      }
    };

    const handleExtensionOnlineStatus = (data: any) => {
      console.log('Received extension online status:', data);
      if (data.extensionId) {
        setExtensionStatuses(prev => ({
          ...prev,
          [data.extensionId]: {
            ...prev[data.extensionId],
            isOnline: data.isOnline,
            lastSeen: new Date(data.timestamp || Date.now())
          }
        }));
      }
    };

    const handleExtensionUrlChange = (data: any) => {
      console.log('Received extension URL change:', data);
      if (data.extensionId && urlChangeCallbackRef.current) {
        // Update extension status with new URL
        setExtensionStatuses(prev => ({
          ...prev,
          [data.extensionId]: {
            ...prev[data.extensionId],
            currentUrl: data.url,
            lastSeen: new Date(data.timestamp || Date.now())
          }
        }));

        // Create URL history item and call the callback
        const urlHistoryItem: UrlHistoryItem = {
          _id: `temp_${data.timestamp}_${data.extensionId}`,
          userEmail: user?.email || '',
          userId: user?.id || '',
          extensionId: data.extensionId,
          url: data.url,
          previousUrl: '',
          title: '',
          tabId: 0,
          timestamp: new Date(data.timestamp || Date.now()).toISOString(),
          type: 'tab_change',
          createdAt: new Date(data.timestamp || Date.now()).toISOString(),
          updatedAt: new Date(data.timestamp || Date.now()).toISOString()
        };

        urlChangeCallbackRef.current(urlHistoryItem);
      }
    };

    // Set up event listeners
    on('extension:status_list', handleExtensionStatusList);
    on('extension:running_update', handleExtensionRunningUpdate);
    on('extension:status', handleExtensionStatus);
    on('extension:online_status', handleExtensionOnlineStatus);
    on('extension:url_change', handleExtensionUrlChange);

    // Request extension status on mount
    if (isConnected) {
      requestExtensionStatus();
    }

    return () => {
      off('extension:status_list', handleExtensionStatusList);
      off('extension:running_update', handleExtensionRunningUpdate);
      off('extension:status', handleExtensionStatus);
      off('extension:online_status', handleExtensionOnlineStatus);
      off('extension:url_change', handleExtensionUrlChange);
    };
  }, [isConnected, on, off, requestExtensionStatus, user?.email, user?.id]);

  const onUrlChange = useCallback((callback: (urlHistoryItem: UrlHistoryItem) => void) => {
    urlChangeCallbackRef.current = callback;
  }, []);

  return {
    extensionStatuses,
    onUrlChange,
  };
};
