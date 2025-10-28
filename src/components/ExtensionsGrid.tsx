import React from 'react';
import { Extension } from '../services/apiService';
import { ExtensionStatus } from '../types/dashboard';
import ExtensionCard from './ExtensionCard';

interface ExtensionsGridProps {
  extensions: Extension[];
  extensionStatuses: Record<string, ExtensionStatus>;
  isConnected: boolean;
  onStartExtension: (extensionId: string) => void;
  onStopExtension: (extensionId: string) => void;
  onRemoveExtension: (extensionId: string) => void;
}

const ExtensionsGrid: React.FC<ExtensionsGridProps> = ({
  extensions,
  extensionStatuses,
  isConnected,
  onStartExtension,
  onStopExtension,
  onRemoveExtension,
}) => {
  if (extensions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Extensions</h2>
        <p className="text-sm text-gray-500">No extensions found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Extensions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {extensions.map((extension) => {
          const status = extensionStatuses[extension.extensionId] || {
            isActive: extension.isActive,
            lastSeen: new Date(extension.lastSeen),
            isOnline: false
          };
          
          return (
            <ExtensionCard
              key={extension._id}
              extension={extension}
              status={status}
              isConnected={isConnected}
              onStart={onStartExtension}
              onStop={onStopExtension}
              onRemove={onRemoveExtension}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ExtensionsGrid;
