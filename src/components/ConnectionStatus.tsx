import React from 'react';

interface ConnectionStatusProps {
  isConnected: boolean;
  socketId?: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isConnected, socketId }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Connection Status</h2>
      <div className="flex items-center space-x-4">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-sm text-gray-600">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
        {socketId && (
          <span className="text-xs text-gray-500">Socket ID: {socketId}</span>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;
