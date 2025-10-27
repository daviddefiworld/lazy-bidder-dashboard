import React from 'react';
import { Extension } from '../services/apiService';
import { ExtensionStatus } from '../types/dashboard';
import ExtensionCard from './ExtensionCard';

interface ExtensionsGridProps {
  extensions: Extension[];
  extensionStatuses: Record<string, ExtensionStatus>;
  isConnected: boolean;
  onActivateExtension: (extensionId: string) => void;
  onDeactivateExtension: (extensionId: string) => void;
}

const ExtensionsGrid: React.FC<ExtensionsGridProps> = ({
  extensions,
  extensionStatuses,
  isConnected,
  onActivateExtension,
  onDeactivateExtension,
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
              onActivate={onActivateExtension}
              onDeactivate={onDeactivateExtension}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ExtensionsGrid;
