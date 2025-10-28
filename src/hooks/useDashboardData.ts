import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService, Extension, UrlHistoryItem } from '../services/apiService';

interface UseDashboardDataReturn {
  extensions: Extension[];
  urlHistory: UrlHistoryItem[];
  loading: boolean;
  error: string | null;
  urlHistoryLimit: number;
  totalUrlHistory: number;
  hasMoreUrlHistory: boolean;
  setError: (error: string | null) => void;
  loadData: () => Promise<void>;
  loadMoreUrlHistory: () => Promise<void>;
  addUrlToHistory: (urlHistoryItem: UrlHistoryItem) => void;
  removeExtension: (extensionId: string) => Promise<void>;
}

export const useDashboardData = (): UseDashboardDataReturn => {
  const { user } = useAuth();
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [urlHistory, setUrlHistory] = useState<UrlHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [urlHistoryLimit] = useState(10);
  const [totalUrlHistory, setTotalUrlHistory] = useState(0);
  const [hasMoreUrlHistory, setHasMoreUrlHistory] = useState(true);
  const [urlHistoryOffset, setUrlHistoryOffset] = useState(0);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [extensionsData, urlHistoryData] = await Promise.all([
        apiService.getExtensions(),
        apiService.getUrlHistory({ limit: urlHistoryLimit, offset: 0 })
      ]);
      
      setExtensions(extensionsData);
      setUrlHistory(urlHistoryData);
      setUrlHistoryOffset(urlHistoryData.length);
      setHasMoreUrlHistory(urlHistoryData.length === urlHistoryLimit);
      // For now, we'll estimate total based on current data
      // In a real implementation, the API should return total count
      setTotalUrlHistory(urlHistoryData.length === urlHistoryLimit ? urlHistoryLimit + 1 : urlHistoryData.length);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreUrlHistory = async () => {
    if (!user || !hasMoreUrlHistory) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const urlHistoryData = await apiService.getUrlHistory({ 
        limit: urlHistoryLimit, 
        offset: urlHistoryOffset 
      });
      
      setUrlHistory(prev => [...prev, ...urlHistoryData]);
      setUrlHistoryOffset(prev => prev + urlHistoryData.length);
      setHasMoreUrlHistory(urlHistoryData.length === urlHistoryLimit);
      setTotalUrlHistory(prev => prev + urlHistoryData.length);
    } catch (err) {
      console.error('Error loading more URL history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load more data');
    } finally {
      setLoading(false);
    }
  };

  const addUrlToHistory = useCallback((urlHistoryItem: UrlHistoryItem) => {
    setUrlHistory(prev => {
      // Check if this URL change already exists to prevent duplicates
      const exists = prev.some(item => 
        item.url === urlHistoryItem.url && 
        item.extensionId === urlHistoryItem.extensionId && 
        item.timestamp === urlHistoryItem.timestamp
      );
      
      if (exists) {
        return prev; // Don't add duplicate
      }
      
      setTotalUrlHistory(prevTotal => prevTotal + 1);
      return [urlHistoryItem, ...prev];
    });
  }, []);

  const removeExtension = useCallback(async (extensionId: string) => {
    setError(null);
    
    try {
      await apiService.removeExtension(extensionId);
      // Remove extension from local state
      setExtensions(prev => prev.filter(ext => ext.extensionId !== extensionId));
    } catch (err) {
      console.error('Error removing extension:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove extension');
      throw err;
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [user]);

  return {
    extensions,
    urlHistory,
    loading,
    error,
    urlHistoryLimit,
    totalUrlHistory,
    hasMoreUrlHistory,
    setError,
    loadData,
    loadMoreUrlHistory,
    addUrlToHistory,
    removeExtension,
  };
};
