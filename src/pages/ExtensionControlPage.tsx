import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { apiService, Extension, UrlHistoryItem } from '../services/apiService';
import { ExtensionStatus } from '../types/dashboard';
import ErrorAlert from '../components/ErrorAlert';
import LoadingSpinner from '../components/LoadingSpinner';
import ActionOrderCreator from '../components/ActionOrderCreator';

type ActionType = 'activate_extension' | 'deactivate_extension' | 'test_message' | 'custom';

interface ActionLog {
  id: string;
  timestamp: Date;
  actionType: string;
  parameters: any;
  result: any;
  success: boolean;
}

const ExtensionControlPage: React.FC = () => {
  const { extensionId } = useParams<{ extensionId: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isConnected, sendMessage } = useSocket();

  const [extension, setExtension] = useState<Extension | null>(null);
  const [status, setStatus] = useState<ExtensionStatus | null>(null);
  const [urlHistory, setUrlHistory] = useState<UrlHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Action panel state
  const [actionType, setActionType] = useState<ActionType>('test_message');
  const [parameters, setParameters] = useState('');
  const [sending, setSending] = useState(false);
  
  // Refs to store latest values for socket handlers
  const actionTypeRef = useRef(actionType);
  const parametersRef = useRef(parameters);
  
  // Update refs when values change
  useEffect(() => {
    actionTypeRef.current = actionType;
  }, [actionType]);
  
  useEffect(() => {
    parametersRef.current = parameters;
  }, [parameters]);
  
  // Logs state
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  
  // Stats
  const [totalActions, setTotalActions] = useState(0);
  const [failedActions, setFailedActions] = useState(0);

  // Add action log function
  const addActionLog = React.useCallback((action: string, params: string, result: any, success: boolean) => {
    const log: ActionLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      actionType: action,
      parameters: params,
      result,
      success
    };
    
    setActionLogs(prev => [log, ...prev].slice(0, 100)); // Keep last 100 logs
    setTotalActions(prev => prev + 1);
    if (!success) {
      setFailedActions(prev => prev + 1);
    }
  }, []);

  useEffect(() => {
    loadExtensionData();
  }, [extensionId]);

  // Set up socket listeners
  useEffect(() => {
    let cleanupFn: (() => void) | undefined;
    
    import('../services/socketService').then(module => {
      const socketService = module.default;
      
      const handleStatusUpdate = (data: any) => {
        if (data.extensionId === extensionId) {
          setStatus(prev => ({
            ...prev!,
            currentUrl: data.currentUrl,
            lastSeen: new Date(data.lastSeen),
            isOnline: true
          }));
        }
      };
      
      const handleActivationUpdate = (data: any) => {
        if (data.extensionId === extensionId) {
          setStatus(prev => ({
            ...prev!,
            isActive: data.isActive
          }));
        }
      };
      
      const handleOnlineStatus = (data: any) => {
        if (data.extensionId === extensionId) {
          setStatus(prev => ({
            ...prev!,
            isOnline: data.isOnline,
            lastSeen: new Date()
          }));
        }
      };
      
      const handleUrlChange = (data: any) => {
        if (data.extensionId === extensionId) {
          loadUrlHistory();
        }
      };

      const handleBackendResponse = (data: any) => {
        setActionLogs(prev => {
          const log: ActionLog = {
            id: Date.now().toString(),
            timestamp: new Date(),
            actionType: actionTypeRef.current,
            parameters: parametersRef.current,
            result: data,
            success: true
          };
          setTotalActions(prev => prev + 1);
          return [log, ...prev].slice(0, 100);
        });
        setSending(false);
      };

      const handleBackendError = (data: any) => {
        setActionLogs(prev => {
          const log: ActionLog = {
            id: Date.now().toString(),
            timestamp: new Date(),
            actionType: actionTypeRef.current,
            parameters: parametersRef.current,
            result: data,
            success: false
          };
          setTotalActions(prev => prev + 1);
          setFailedActions(prev => prev + 1);
          return [log, ...prev].slice(0, 100);
        });
        setSending(false);
      };

      const handleActionResult = (data: any) => {
        if (data.extensionId === extensionId) {
          setActionLogs(prev => {
            const log: ActionLog = {
              id: Date.now().toString(),
              timestamp: new Date(),
              actionType: `${data.actionType} (${data.orderId.slice(0, 8)})`,
              parameters: JSON.stringify(data.actionConfig || {}),
              result: data.error || data.result,
              success: data.status === 'completed'
            };
            setTotalActions(prev => prev + 1);
            if (data.status !== 'completed') {
              setFailedActions(prev => prev + 1);
            }
            return [log, ...prev].slice(0, 100);
          });
        }
      };

      socketService.on('extension:status', handleStatusUpdate);
      socketService.on('extension:activation_update', handleActivationUpdate);
      socketService.on('extension:online_status', handleOnlineStatus);
      socketService.on('extension:url_change', handleUrlChange);
      socketService.on('backend:response', handleBackendResponse);
      socketService.on('backend:error', handleBackendError);
      socketService.on('action:result', handleActionResult);

      cleanupFn = () => {
        socketService.off('extension:status', handleStatusUpdate);
        socketService.off('extension:activation_update', handleActivationUpdate);
        socketService.off('extension:online_status', handleOnlineStatus);
        socketService.off('extension:url_change', handleUrlChange);
        socketService.off('backend:response', handleBackendResponse);
        socketService.off('backend:error', handleBackendError);
        socketService.off('action:result', handleActionResult);
      };
    });

    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [extensionId]);

  const loadExtensionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const extensions = await apiService.getExtensions();
      const foundExtension = extensions.find(ext => ext.extensionId === extensionId);
      
      if (!foundExtension) {
        setError('Extension not found');
        return;
      }
      
      setExtension(foundExtension);
      setStatus({
        isActive: foundExtension.isActive,
        lastSeen: new Date(foundExtension.lastSeen),
        isOnline: true, // Will be updated by socket
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

  const handleSendAction = async () => {
    if (!extensionId || !isConnected) {
      setError('Extension not connected or not available');
      return;
    }
    
    try {
      setSending(true);
      setError(null);
      
      let data: any = {};
      
      // Parse parameters if provided
      if (parameters.trim()) {
        try {
          data = JSON.parse(parameters);
        } catch {
          // If not valid JSON, treat as single parameter
          data = { value: parameters };
        }
      }
      
      // Add extensionId to data for action types that need it
      if (actionType !== 'test_message') {
        data.extensionId = extensionId;
      }
      
      // Send the message
      sendMessage(actionType, data);
      
    } catch (err) {
      console.error('Failed to send action:', err);
      setError(err instanceof Error ? err.message : 'Failed to send action');
      setSending(false);
    }
  };

  const handleActivate = async () => {
    if (!extensionId) return;
    setActionType('activate_extension');
    setParameters('{}');
    await handleSendAction();
  };

  const handleDeactivate = async () => {
    if (!extensionId) return;
    setActionType('deactivate_extension');
    setParameters('{}');
    await handleSendAction();
  };

  const handleCreateOrder = async (extensionId: string, actionType: string, actionConfig: any) => {
    try {
      setError(null);
      
      // Use socket service to send action order via socket interface
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

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !extension) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ErrorAlert error={error} onDismiss={() => navigate('/dashboard')} />
      </div>
    );
  }

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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Left Section - Extension Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Extension Status</h2>
              
              {extension && status && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium text-gray-700">Status</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      status.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {status.isActive ? 'Active' : 'Inactive'}
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
                    {!status.isActive ? (
                      <button
                        onClick={handleActivate}
                        disabled={!isConnected || sending}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Activate
                      </button>
                    ) : (
                      <button
                        onClick={handleDeactivate}
                        disabled={!isConnected || sending}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Deactivate
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
            
            {/* Action Controller (Deprecated - kept for backward compatibility) */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Action Controller</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action Type
                  </label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value as ActionType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="test_message">Test Message</option>
                    <option value="activate_extension">Activate Extension</option>
                    <option value="deactivate_extension">Deactivate Extension</option>
                    <option value="custom">Custom Action</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parameters (JSON)
                  </label>
                  <textarea
                    value={parameters}
                    onChange={(e) => setParameters(e.target.value)}
                    placeholder='{"key": "value"}'
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>
                
                <button
                  onClick={handleSendAction}
                  disabled={!isConnected || sending}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? 'Sending...' : 'Send Action'}
                </button>
                
                {/* Action Stats */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-gray-900">{totalActions}</p>
                      <p className="text-xs text-gray-600">Total Actions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-red-600">{failedActions}</p>
                      <p className="text-xs text-gray-600">Failed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Logs Section */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Action Logs</h2>
            
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

