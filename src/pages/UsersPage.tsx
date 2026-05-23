import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader';
import apiService, { type Extension } from '../services/apiService';
import { formatRelativeTime } from '../utils/formatters';

const UsersPage: React.FC = () => {
  const [rows, setRows] = useState<Extension[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getExtensions();
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRemove = async (extensionId: string) => {
    if (!window.confirm(`Remove extension ${extensionId} from the database?`)) return;
    setBusyId(extensionId);
    try {
      await apiService.removeExtension(extensionId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader title="Users" as="h2" />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No extensions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Extension ID</th>
                  <th className="px-4 py-3">Version</th>
                  <th className="px-4 py-3">Running</th>
                  <th className="px-4 py-3">Last seen</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.extensionId} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-mono text-xs text-slate-800">{r.extensionId}</td>
                    <td className="px-4 py-3 text-slate-600">{r.version ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          r.isRunning
                            ? 'text-emerald-700 font-medium'
                            : 'text-slate-500'
                        }
                      >
                        {r.isRunning ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatRelativeTime(r.lastSeen)}</td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <Link
                        to={`/extensions/${encodeURIComponent(r.extensionId)}`}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Open
                      </Link>
                      <button
                        type="button"
                        disabled={busyId === r.extensionId}
                        onClick={() => void handleRemove(r.extensionId)}
                        className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
