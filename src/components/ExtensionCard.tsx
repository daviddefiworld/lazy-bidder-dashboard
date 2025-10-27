import React from 'react';
import { Extension } from '../services/apiService';
import { ExtensionStatus } from '../types/dashboard';

interface ExtensionCardProps {
  extension: Extension;
  status: ExtensionStatus;
  isConnected: boolean;
  onActivate: (extensionId: string) => void;
  onDeactivate: (extensionId: string) => void;
}

const ExtensionCard: React.FC<ExtensionCardProps> = ({
  extension,
  status,
  isConnected,
  onActivate,
  onDeactivate,
}) => {
  const formatDate = (date: Date) => {
    return date.toLocaleString();
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col h-full">
        <div className="flex items-center space-x-2 mb-3">
          <div className={`w-3 h-3 rounded-full ${status.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {extension.extensionId.slice(0, 8)}...
          </h3>
        </div>
        
        <div className="flex flex-col space-y-2 mb-4 flex-grow">
          <div className="flex flex-wrap gap-1">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              status.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {status.isActive ? 'Active' : 'Inactive'}
            </span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              status.isOnline ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {status.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          
          <div className="text-xs text-gray-600 space-y-1">
            <p>Last seen: {formatDate(status.lastSeen)}</p>
            {extension.version && <p>v{extension.version}</p>}
            {status.currentUrl && (
              <div className="mt-2">
                <p className="text-xs font-medium text-gray-700 mb-1">Current URL:</p>
                <p className="text-xs text-blue-600 break-all truncate" title={status.currentUrl}>
                  {status.currentUrl}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-auto">
          {status.isActive ? (
            <button
              onClick={() => onDeactivate(extension.extensionId)}
              disabled={!isConnected}
              className="w-full px-3 py-2 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Deactivate
            </button>
          ) : (
            <button
              onClick={() => onActivate(extension.extensionId)}
              disabled={!isConnected}
              className="w-full px-3 py-2 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Activate
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExtensionCard;
