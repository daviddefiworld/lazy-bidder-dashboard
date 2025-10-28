import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { useSocketEvents } from '../hooks/useSocketEvents';
import {
  ExtensionsGrid,
  UrlHistoryTable,
  ConnectionStatus,
  SocketCommunication,
  LoadingSpinner,
  ErrorAlert,
} from '../components';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { isConnected, socketId, sendMessage, startExtension, stopExtension } = useSocket();
  
  // Use custom hooks for data management
  const {
    extensions,
    urlHistory,
    loading,
    error,
    totalUrlHistory,
    hasMoreUrlHistory,
    setError,
    loadMoreUrlHistory,
    addUrlToHistory,
    removeExtension,
  } = useDashboardData();

  const {
    extensionStatuses,
    onUrlChange,
  } = useSocketEvents();

  // Set up URL change callback to add new URLs directly to history
  React.useEffect(() => {
    onUrlChange(addUrlToHistory);
  }, [onUrlChange, addUrlToHistory]);

  // Event handlers

  const handleSendTestMessage = () => {
    sendMessage('test_message', { message: 'Hello from dashboard!', timestamp: Date.now() });
  };

  const handleStartExtension = (extensionId: string) => {
    startExtension(extensionId);
  };

  const handleStopExtension = (extensionId: string) => {
    stopExtension(extensionId);
  };

  const handleLoadMore = () => {
    loadMoreUrlHistory();
  };

  const handleRemoveExtension = async (extensionId: string) => {
    try {
      await removeExtension(extensionId);
    } catch (err) {
      // Error is already set in the hook
      console.error('Failed to remove extension:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">LazyBidder Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user?.name}</span>
              <button
                onClick={logout}
                className="btn-secondary"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Loading and Error States */}
          {loading && <LoadingSpinner />}
          {error && <ErrorAlert error={error} onDismiss={() => setError(null)} />}

          {/* Extensions Section */}
          <ExtensionsGrid
            extensions={extensions}
            extensionStatuses={extensionStatuses}
            isConnected={isConnected}
            onStartExtension={handleStartExtension}
            onStopExtension={handleStopExtension}
            onRemoveExtension={handleRemoveExtension}
          />

          {/* URL History Section */}
          <UrlHistoryTable
            urlHistory={urlHistory}
            totalItems={totalUrlHistory}
            hasMore={hasMoreUrlHistory}
            loading={loading}
            onLoadMore={handleLoadMore}
          />

          {/* Connection Status */}
          <ConnectionStatus isConnected={isConnected} socketId={socketId} />

          {/* Socket Communication */}
          <SocketCommunication
            isConnected={isConnected}
            onSendTestMessage={handleSendTestMessage}
          />
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
