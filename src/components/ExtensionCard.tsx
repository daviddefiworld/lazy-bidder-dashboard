import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Extension } from '../services/apiService';
import { ExtensionStatus } from '../types/dashboard';
import { formatDate, formatExtensionId, getStatusColor, getConnectionColor } from '../utils/formatters';

interface ExtensionCardProps {
  extension: Extension;
  status: ExtensionStatus;
  isConnected: boolean;
  onStart: (extensionId: string) => void;
  onStop: (extensionId: string) => void;
  onRemove: (extensionId: string) => void;
}

const ExtensionCard: React.FC<ExtensionCardProps> = ({
  extension,
  status,
  isConnected,
  onStart,
  onStop,
  onRemove,
}) => {
  const navigate = useNavigate();
  
  const handleCardClick = () => {
    navigate(`/extension/${extension.extensionId}`);
  };

  return (
    <div 
      className="relative border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(extension.extensionId);
        }}
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
        title="Remove extension"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <div className="flex flex-col h-full">
        <div className="flex items-center space-x-2 mb-3">
          <div className={`w-3 h-3 rounded-full ${status.isRunning ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {formatExtensionId(extension.extensionId)}
          </h3>
        </div>
        
        <div className="flex flex-col space-y-2 mb-4 flex-grow">
          <div className="flex flex-wrap gap-1">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status.isRunning)}`}>
              {status.isRunning ? 'Running' : 'Stopped'}
            </span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConnectionColor(status.isOnline)}`}>
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
        
        <div className="mt-auto" onClick={(e) => e.stopPropagation()}>
          {status.isRunning ? (
            <button
              onClick={() => onStop(extension.extensionId)}
              disabled={!isConnected}
              className="w-full px-3 py-2 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={() => onStart(extension.extensionId)}
              disabled={!isConnected}
              className="w-full px-3 py-2 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExtensionCard;
