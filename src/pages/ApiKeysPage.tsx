import React, { useCallback, useEffect, useState } from 'react';
import apiService, { type ApiKeyRow, type CreateApiKeyResponse } from '../services/apiService';
import { formatDate } from '../utils/formatters';

const ApiKeysPage: React.FC = () => {
  const [rows, setRows] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<CreateApiKeyResponse | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.listApiKeys();
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const created = await apiService.createApiKey(name.trim());
      setNewKey(created);
      setName('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Revoke this API key? Clients using it will stop working.')) return;
    setBusyId(id);
    try {
      await apiService.revokeApiKey(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Revoke failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-900 tracking-tight">API keys</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Use keys with{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">Authorization: Bearer &lt;key&gt;</code> or{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">X-API-Key</code> on REST requests. Each key is
          shown in full only once when created.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      {newKey && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">New key for “{newKey.name}” — copy now:</p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-white/80 p-3 text-xs font-mono ring-1 ring-amber-200/60">
            {newKey.key}
          </pre>
          <button
            type="button"
            className="mt-2 text-xs font-medium text-amber-900 underline"
            onClick={() => setNewKey(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleCreate} className="mb-8 flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1 max-w-md">
          <label htmlFor="keyName" className="block text-xs font-medium text-slate-600 mb-1">
            Label
          </label>
          <input
            id="keyName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. CI pipeline, teammate laptop"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <button
          type="submit"
          disabled={creating || !name.trim()}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {creating ? 'Creating…' : 'Create key'}
        </button>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No API keys yet. Create one above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Label</th>
                  <th className="px-4 py-3">Prefix</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Last used</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => {
                  const revoked = Boolean(r.revokedAt);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-medium text-slate-900">{r.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{r.keyPrefix}</td>
                      <td className="px-4 py-3">
                        {revoked ? (
                          <span className="text-slate-500">Revoked</span>
                        ) : (
                          <span className="text-emerald-700 font-medium">Active</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {r.lastUsedAt ? formatDate(r.lastUsedAt) : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(r.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {!revoked && (
                          <button
                            type="button"
                            disabled={busyId === r.id}
                            onClick={() => void handleRevoke(r.id)}
                            className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiKeysPage;
