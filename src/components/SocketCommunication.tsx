import React from 'react';

interface SocketCommunicationProps {
  isConnected: boolean;
  onSendTestMessage: () => void;
}

const SocketCommunication: React.FC<SocketCommunicationProps> = ({ 
  isConnected, 
  onSendTestMessage 
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Socket Communication</h2>
      <button
        onClick={onSendTestMessage}
        disabled={!isConnected}
        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Send Test Message
      </button>
    </div>
  );
};

export default SocketCommunication;
