import React from 'react';
import PageHeader from '../components/layout/PageHeader';
import ExtensionCard from '../components/extensions/ExtensionCard';
import { useConnectedExtensions } from '../hooks/useConnectedExtensions';

const ExtensionsPage: React.FC = () => {
  const { extensions, loading, refresh, isSocketConnected } = useConnectedExtensions();

  return (
    <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6">
      <PageHeader
        title="Extensions"
        actions={
          <button
            type="button"
            onClick={refresh}
            disabled={!isSocketConnected}
            className="text-sm font-medium px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
          >
            Refresh
          </button>
        }
      />

      {!isSocketConnected && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Socket disconnected. Reconnect to see live extension status.
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Loading extensions…</p>
      ) : extensions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-8 py-16 text-center">
          <p className="text-slate-600 font-medium">No extensions connected</p>
          <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
            Open the LazyBidder browser extension and connect it to the backend. Connected extensions
            will appear here with online status and the current tab.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {extensions.map((ext) => (
            <ExtensionCard key={ext.extensionId} extension={ext} />
          ))}
        </div>
      )}
    </main>
  );
};

export default ExtensionsPage;
