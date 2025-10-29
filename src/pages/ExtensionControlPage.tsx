import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { apiService, Extension, UrlHistoryItem } from '../services/apiService';
import ErrorAlert from '../components/ErrorAlert';
import LoadingSpinner from '../components/LoadingSpinner';
import ActionOrderCreator from '../components/ActionOrderCreator';
import { useActionLogs } from '../hooks/useActionLogs';
import { useExtensionStatus } from '../hooks/useExtensionStatus';
import { formatDate } from '../utils/formatters';

const ExtensionControlPage: React.FC = () => {
  const { extensionId } = useParams<{ extensionId: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isConnected, startExtension, stopExtension, on, off } = useSocket();

  const [extension, setExtension] = useState<Extension | null>(null);
  const [urlHistory, setUrlHistory] = useState<UrlHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use custom hooks
  const { actionLogs, totalActions, failedActions, addActionLog, clearLogs } = useActionLogs();
  const { status, setStatus, handleStatusUpdate, handleActivationUpdate, handleRunningUpdate, handleOnlineStatus } = useExtensionStatus(extensionId);

  // Load URL history
  const loadUrlHistory = async () => {
    if (!extensionId) return;
    
    try {
      const history = await apiService.getUrlHistory({ limit: 50, offset: 0 });
      const filtered = history.filter(item => item.extensionId === extensionId);
      setUrlHistory(filtered);
    } catch (err) {
      console.error('Failed to load URL history:', err);
    }
  };

  const loadExtensionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!extensionId) {
        setError('Extension ID is required');
        return;
      }
      
      const extensions = await apiService.getExtensions();
      const foundExtension = extensions.find(ext => ext.extensionId === extensionId);
      
      if (!foundExtension) {
        setError('Extension not found');
        return;
      }
      
      setExtension(foundExtension);
      setStatus({
        isRunning: foundExtension.isRunning,
        lastSeen: new Date(foundExtension.lastSeen),
        isOnline: true,
        currentUrl: undefined
      });
      
      await loadUrlHistory();
    } catch (err) {
      console.error('Failed to load extension data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load extension data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExtensionData();
  }, [extensionId]);

  // Socket event handlers
  const handleUrlChange = (data: any) => {
    if (data.extensionId === extensionId) {
      loadUrlHistory();
    }
  };

  const handleBackendResponse = (data: any) => {
    addActionLog('backend_response', '{}', data, true);
  };

  const handleBackendError = (data: any) => {
    addActionLog('backend_error', '{}', data, false);
  };

  const handleActionResult = (data: any) => {
    if (data.extensionId === extensionId) {
      addActionLog(
        `${data.actionType} (${data.orderId.slice(0, 8)})`,
        JSON.stringify(data.actionConfig || {}),
        data.error || data.result,
        data.status === 'completed'
      );
    }
  };

  // Set up socket listeners
  useEffect(() => {
    on('extension:status', handleStatusUpdate);
    on('extension:activation_update', handleActivationUpdate);
    on('extension:running_update', handleRunningUpdate);
    on('extension:online_status', handleOnlineStatus);
    on('extension:url_change', handleUrlChange);
    on('backend:response', handleBackendResponse);
    on('backend:error', handleBackendError);
    on('action:result', handleActionResult);

    return () => {
      off('extension:status', handleStatusUpdate);
      off('extension:activation_update', handleActivationUpdate);
      off('extension:running_update', handleRunningUpdate);
      off('extension:online_status', handleOnlineStatus);
      off('extension:url_change', handleUrlChange);
      off('backend:response', handleBackendResponse);
      off('backend:error', handleBackendError);
      off('action:result', handleActionResult);
    };
  }, [extensionId, on, off, handleStatusUpdate, handleActivationUpdate, handleRunningUpdate, handleOnlineStatus, handleUrlChange, handleBackendResponse, handleBackendError, handleActionResult]);

  const handleActivate = () => {
    if (!extensionId) return;
    startExtension(extensionId);
  };

  const handleDeactivate = () => {
    if (!extensionId) return;
    stopExtension(extensionId);
  };

  const handleCreateOrder = async (extensionId: string, actionType: string, actionConfig: any) => {
    try {
      setError(null);
      
      if (isConnected) {
        const socketModule = await import('../services/socketService');
        const socketService = socketModule.default;
        socketService.sendActionOrder(extensionId, actionType, actionConfig);
        addActionLog('create_order', JSON.stringify({ actionType, actionConfig }), 'Order sent via socket', true);
      } else {
        throw new Error('Socket not connected. Please wait for connection.');
      }
    } catch (err) {
      console.error('Failed to create action order:', err);
      setError(err instanceof Error ? err.message : 'Failed to create action order');
      addActionLog('create_order', JSON.stringify({ actionType, actionConfig }), err, false);
    }
  };


  if (loading) {
    console.log('ExtensionControlPage: Showing loading spinner');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !extension) {
    console.log('ExtensionControlPage: Showing error:', error);
    return (
      <div className="min-h-screen bg-gray-50">
        <ErrorAlert error={error} onDismiss={() => navigate('/dashboard')} />
      </div>
    );
  }

  console.log('ExtensionControlPage: Rendering main content');
  console.log('Extension:', extension);
  console.log('Status:', status);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Extension Control</h1>
              <span className="text-sm text-gray-500">
                {extensionId?.slice(0, 8)}...
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user?.name}</span>
              <button onClick={logout} className="btn-secondary">
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && <ErrorAlert error={error} onDismiss={() => setError(null)} />}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Left Section - Extension Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Extension Status</h2>
              
              {extension && status && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium text-gray-700">Status</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      status.isRunning ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {status.isRunning ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium text-gray-700">Connection</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      status.isOnline ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {status.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm font-medium text-gray-700 mb-1">Last Seen</p>
                    <p className="text-sm text-gray-600">{formatDate(status.lastSeen)}</p>
                  </div>
                  
                  {status.currentUrl && (
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-sm font-medium text-gray-700 mb-1">Current URL</p>
                      <p className="text-sm text-blue-600 break-all">{status.currentUrl}</p>
                    </div>
                  )}
                  
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm font-medium text-gray-700 mb-1">Extension ID</p>
                    <p className="text-sm font-mono text-gray-600">{extension.extensionId}</p>
                  </div>
                  
                  {extension.version && (
                    <div className="p-3 bg-gray-50 rounded">
                      <p className="text-sm font-medium text-gray-700 mb-1">Version</p>
                      <p className="text-sm text-gray-600">v{extension.version}</p>
                    </div>
                  )}
                  
                  <div className="flex space-x-3 pt-4">
                    {!status.isRunning ? (
                      <button
                        onClick={handleActivate}
                        disabled={!isConnected}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Start
                      </button>
                    ) : (
                      <button
                        onClick={handleDeactivate}
                        disabled={!isConnected}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Stop
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Section - Action Order Creator */}
            {extensionId && (
              <ActionOrderCreator
                extensionId={extensionId}
                onCreateOrder={handleCreateOrder}
              />
            )}
          </div>

          {/* Logs Section */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Action Logs</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Total: {totalActions}</span>
                  <span>Failed: {failedActions}</span>
                </div>
                <button
                  onClick={clearLogs}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                >
                  Clear Logs
                </button>
              </div>
            </div>
            
            {actionLogs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No action logs yet</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {actionLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 rounded border ${
                      log.success 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{log.actionType}</span>
                      <span className="text-xs text-gray-500">{formatDate(log.timestamp)}</span>
                    </div>
                    <div className="text-xs text-gray-600 mb-1">
                      <strong>Parameters:</strong> {JSON.stringify(log.parameters)}
                    </div>
                    <div className={`text-xs ${log.success ? 'text-green-700' : 'text-red-700'}`}>
                      <strong>Result:</strong> {JSON.stringify(log.result)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">URL History</h2>
            
            {urlHistory.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No URL history yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        URL
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {urlHistory.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(item.timestamp)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="max-w-md truncate text-blue-600" title={item.url}>
                            {item.url}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            item.type === 'page_load' 
                              ? 'bg-blue-100 text-blue-800'
                              : item.type === 'spa_navigation'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {item.title || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExtensionControlPage;

