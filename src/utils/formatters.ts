/**
 * Utility functions for formatting data
 */

export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleString();
};

export const formatTime = (date: Date | string | number): string => {
  const d = typeof date === 'number' ? new Date(date) : new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

/** Format `date_published` for display; returns null if missing or unparseable. */
export function formatJobPublished(
  datePublished: string | null | undefined
): { label: string; relative: string | null } | null {
  const raw = datePublished?.trim();
  if (!raw) return null;
  const ms = new Date(raw).getTime();
  if (!Number.isFinite(ms)) return { label: raw, relative: null };
  const label = new Date(ms).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  const relative = formatRelativeTime(ms);
  return { label, relative };
}

export const formatRelativeTime = (timestamp: number | string): string => {
  const ms = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
  const diff = Date.now() - ms;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return formatDate(new Date(ms));
};

export const formatExtensionId = (extensionId: string): string => {
  if (extensionId.length <= 12) return extensionId;
  return `${extensionId.slice(0, 8)}…${extensionId.slice(-4)}`;
};

export const getTypeColor = (type: string): string => {
  switch (type) {
    case 'page_load':
      return 'bg-blue-50 text-blue-700 ring-blue-600/20';
    case 'spa_navigation':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
    case 'tab_change':
      return 'bg-amber-50 text-amber-700 ring-amber-600/20';
    default:
      return 'bg-slate-50 text-slate-600 ring-slate-500/20';
  }
};

export const getOrderStatusColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
    case 'executing':
      return 'bg-blue-50 text-blue-700 ring-blue-600/20';
    case 'stopped':
      return 'bg-orange-50 text-orange-700 ring-orange-600/20';
    case 'pending':
      return 'bg-amber-50 text-amber-700 ring-amber-600/20';
    case 'failed':
      return 'bg-red-50 text-red-700 ring-red-600/20';
    case 'cancelled':
      return 'bg-slate-50 text-slate-600 ring-slate-500/20';
    default:
      return 'bg-slate-50 text-slate-600 ring-slate-500/20';
  }
};
