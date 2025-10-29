/**
 * Utility functions for formatting data
 */

export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleString();
};

export const formatExtensionId = (extensionId: string): string => {
  return `${extensionId.slice(0, 8)}...`;
};

export const getTypeColor = (type: string): string => {
  switch (type) {
    case 'page_load': return 'bg-blue-100 text-blue-800';
    case 'spa_navigation': return 'bg-green-100 text-green-800';
    case 'tab_change': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusColor = (isRunning: boolean): string => {
  return isRunning ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
};

export const getConnectionColor = (isOnline: boolean): string => {
  return isOnline ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800';
};
