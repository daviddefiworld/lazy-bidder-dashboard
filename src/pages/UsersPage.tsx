import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../components/layout/PageHeader';
import apiService, { type DashboardUserRow } from '../services/apiService';
import { DASHBOARD_PERMISSIONS, type DashboardPermission } from '../types/auth';

const PERMISSION_LABELS: Record<DashboardPermission, string> = {
  view_analytics: 'View analytics',
  view_jobs: 'View jobs',
  view_companies: 'View companies',
  manage_extensions: 'Manage extensions',
  manage_api_keys: 'Manage API keys',
  manage_actions: 'Manage actions',
  manage_users: 'Manage users',
  run_company_grok: 'Run Ask Grok',
  run_company_analyze: 'Run company analyze',
  set_company_ignored: 'Ignore/unignore companies'
};

const UsersPage: React.FC = () => {
  const [rows, setRows] = useState<DashboardUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [passwordModalUser, setPasswordModalUser] = useState<DashboardUserRow | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [permissionModalUser, setPermissionModalUser] = useState<DashboardUserRow | null>(null);
  const [modalRole, setModalRole] = useState<'admin' | 'user'>('user');
  const [modalPermissions, setModalPermissions] = useState<DashboardPermission[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.listUsers();
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await apiService.createUser({
        username,
        password,
        role
      });
      setUsername('');
      setPassword('');
      setRole('user');
      setSuccess('User created');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create user failed');
    } finally {
      setSaving(false);
    }
  };

  const openPermissionModal = (user: DashboardUserRow) => {
    setPermissionModalUser(user);
    setModalRole(user.role);
    setModalPermissions(user.permissions);
  };

  const closePermissionModal = () => {
    setPermissionModalUser(null);
    setModalRole('user');
    setModalPermissions([]);
  };

  const modalRolePermissions = useMemo(
    () => (modalRole === 'admin' ? [...DASHBOARD_PERMISSIONS] : modalPermissions),
    [modalRole, modalPermissions]
  );

  const toggleModalPermission = (permission: DashboardPermission) => {
    setModalPermissions((prev) =>
      prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission]
    );
  };

  const submitPermissionModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissionModalUser) return;

    setRowBusyId(permissionModalUser.id);
    setError(null);
    setSuccess(null);
    try {
      await apiService.updateUserPermissions(permissionModalUser.id, {
        role: modalRole,
        permissions: modalRolePermissions
      });
      setSuccess(`Permissions updated for ${permissionModalUser.username}`);
      closePermissionModal();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update permissions');
    } finally {
      setRowBusyId(null);
    }
  };

  const openPasswordModal = (user: DashboardUserRow) => {
    setPasswordModalUser(user);
    setNewPassword('');
  };

  const closePasswordModal = () => {
    setPasswordModalUser(null);
    setNewPassword('');
  };

  const submitPasswordModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser) return;

    setRowBusyId(passwordModalUser.id);
    setError(null);
    setSuccess(null);
    try {
      await apiService.updateUserPassword(passwordModalUser.id, newPassword);
      setSuccess(`Password updated for ${passwordModalUser.username}`);
      closePasswordModal();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to change password');
    } finally {
      setRowBusyId(null);
    }
  };

  const handleRemoveUser = async (user: DashboardUserRow) => {
    if (!window.confirm(`Remove user "${user.username}"?`)) return;

    setRowBusyId(user.id);
    setError(null);
    setSuccess(null);
    try {
      await apiService.deleteUser(user.id);
      setSuccess(`Removed ${user.username}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove user');
    } finally {
      setRowBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader title="Users" as="h2" />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      )}

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">Create user</h3>
        <form className="mt-4 space-y-4" onSubmit={handleCreate}>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              required
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="user">Normal user</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <p className="text-xs text-slate-500">
            Detailed permissions are configured later from the <strong>Permissions</strong> modal.
          </p>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? 'Creating…' : 'Create user'}
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No users yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Permissions</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-800">{r.username}</td>
                    <td className="px-4 py-3 text-slate-600 uppercase">{r.role}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="flex flex-wrap gap-1">
                        {r.permissions.map((permission) => (
                          <span
                            key={permission}
                            className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px]"
                          >
                            {PERMISSION_LABELS[permission]}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.isActive ? 'Active' : 'Inactive'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={rowBusyId === r.id}
                          onClick={() => openPermissionModal(r)}
                          className="rounded border border-slate-200 px-2.5 py-1 text-xs hover:bg-slate-50 disabled:opacity-50"
                        >
                          Permissions
                        </button>
                        <button
                          type="button"
                          disabled={rowBusyId === r.id}
                          onClick={() => openPasswordModal(r)}
                          className="rounded border border-slate-200 px-2.5 py-1 text-xs hover:bg-slate-50 disabled:opacity-50"
                        >
                          Password
                        </button>
                        <button
                          type="button"
                          disabled={rowBusyId === r.id}
                          onClick={() => void handleRemoveUser(r)}
                          className="rounded border border-red-200 px-2.5 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {permissionModalUser ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-slate-900">
                Edit permissions: {permissionModalUser.username}
              </h3>
              <button
                type="button"
                onClick={closePermissionModal}
                className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <form onSubmit={submitPermissionModal} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Role
                </label>
                <select
                  value={modalRole}
                  onChange={(e) => setModalRole(e.target.value as 'admin' | 'user')}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="user">Normal user</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Detailed permissions
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {DASHBOARD_PERMISSIONS.map((permission) => (
                    <label
                      key={permission}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={modalRolePermissions.includes(permission)}
                        disabled={modalRole === 'admin'}
                        onChange={() => toggleModalPermission(permission)}
                      />
                      <span>{PERMISSION_LABELS[permission]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closePermissionModal}
                  className="rounded border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rowBusyId === permissionModalUser.id}
                  className="rounded bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  Save permissions
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {passwordModalUser ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-slate-900">
                Change password: {passwordModalUser.username}
              </h3>
              <button
                type="button"
                onClick={closePasswordModal}
                className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <form onSubmit={submitPasswordModal} className="space-y-4">
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                type="password"
                minLength={6}
                placeholder="New password (min 6 chars)"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  className="rounded border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rowBusyId === passwordModalUser.id}
                  className="rounded bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  Save password
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default UsersPage;
