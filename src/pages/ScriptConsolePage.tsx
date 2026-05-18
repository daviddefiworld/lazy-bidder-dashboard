import React, { useCallback, useEffect, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import socketService from '../services/socketService';

export interface ConnectedExtensionRow {
  extensionId: string;
  isRunning: boolean;
  lastSeen: number;
  version?: string;
  userAgent?: string;
  currentUrl?: string;
  isOnline?: boolean;
}

const ScriptConsolePage: React.FC = () => {
  const { isConnected } = useSocket();
  const [extensions, setExtensions] = useState<ConnectedExtensionRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('software');
  const [location, setLocation] = useState('remote');
  const [sort, setSort] = useState('date');
  const [fromage, setFromage] = useState('7');
  const [error, setError] = useState<string | null>(null);
  const [statusLine, setStatusLine] = useState('');
  const [jobsSaved, setJobsSaved] = useState(0);

  const refreshList = useCallback(() => {
    if (socketService.getConnectionStatus()) {
      socketService.requestExtensionStatus();
    }
  }, []);

  useEffect(() => {
    if (!isConnected) return;

    const onList = (data: { extensions: ConnectedExtensionRow[] }) => {
      setExtensions(data.extensions ?? []);
    };
    const onResult = (data: {
      orderId: string;
      status: string;
      resultsCount?: number;
      error?: string;
    }) => {
      if (data.status === 'completed') {
        setStatusLine(`Completed ${data.orderId.slice(0, 8)}… — ${data.resultsCount ?? 0} jobs saved`);
      } else if (data.status === 'failed') {
        setStatusLine(`Failed ${data.orderId.slice(0, 8)}… — ${data.error || 'error'}`);
      } else if (data.status === 'executing') {
        setStatusLine(`Order ${data.orderId.slice(0, 8)}… running on extension`);
      }
    };
    const onJob = (data: { resultsCount?: number }) => {
      if (data.resultsCount != null) {
        setJobsSaved(data.resultsCount);
      }
    };

    socketService.on('extension:status_list', onList);
    socketService.on('action:result', onResult);
    socketService.on('action:job_result', onJob);
    return () => {
      socketService.off('extension:status_list', onList);
      socketService.off('action:result', onResult);
      socketService.off('action:job_result', onJob);
    };
  }, [isConnected]);

  useEffect(() => {
    if (!isConnected) return;
    refreshList();
    const interval = setInterval(refreshList, 2000);
    return () => clearInterval(interval);
  }, [isConnected, refreshList]);

  const runOrder = () => {
    setError(null);
    setJobsSaved(0);
    if (!selectedId) {
      setError('Select an extension from the list.');
      return;
    }
    if (!socketService.getConnectionStatus()) {
      setError('Socket is not connected.');
      return;
    }
    socketService.sendIndeedOrder(selectedId, { query, location, sort, fromage });
    setStatusLine('Order sent — extension will open Indeed and scrape jobs…');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">LazyBidder</h1>
          <p className="text-sm text-gray-500">Indeed scrape console</p>
        </div>
        <span className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
          {isConnected ? 'Socket connected' : 'Socket disconnected'}
        </span>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <section className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-medium text-gray-900">Running extensions</h2>
            <button
              type="button"
              onClick={refreshList}
              className="text-sm px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800"
            >
              Refresh
            </button>
          </div>
          {extensions.length === 0 ? (
            <p className="text-sm text-gray-500">
              No extension connected. Open the browser extension side panel.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 border border-gray-100 rounded-md overflow-hidden">
              {extensions.map((ext) => (
                <li key={ext.extensionId}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(ext.extensionId)}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 ${
                      selectedId === ext.extensionId ? 'bg-blue-50 ring-inset ring-1 ring-blue-200' : ''
                    }`}
                  >
                    <div className="font-mono text-xs text-gray-900 break-all">{ext.extensionId}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-lg shadow border border-gray-200 p-4 space-y-4">
          <h2 className="text-lg font-medium text-gray-900">Indeed search</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="text-gray-600">Query</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="text-gray-600">Location</span>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="text-gray-600">Sort</span>
              <input
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="text-gray-600">Fromage (days)</span>
              <input
                value={fromage}
                onChange={(e) => setFromage(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={runOrder}
            disabled={!selectedId || !isConnected}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Send scrape order
          </button>
          {statusLine && <p className="text-xs text-gray-600 font-mono break-all">{statusLine}</p>}
          {jobsSaved > 0 && (
            <p className="text-xs text-green-700">Jobs saved so far: {jobsSaved}</p>
          )}
        </section>
      </main>
    </div>
  );
};

export default ScriptConsolePage;
