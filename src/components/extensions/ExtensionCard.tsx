import React from 'react';
import { Link } from 'react-router-dom';
import type { ConnectedExtension } from '../../types/extension';
import { formatExtensionId, formatRelativeTime } from '../../utils/formatters';
import { getExtensionActivityLabel, getExtensionActivityTone } from '../../utils/extensionUtils';
import { truncateUrl } from '../../utils/urlUtils';

interface ExtensionCardProps {
  extension: ConnectedExtension;
}

const activityToneClass: Record<ReturnType<typeof getExtensionActivityTone>, string> = {
  active: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  paused: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  idle: 'bg-slate-50 text-slate-500 ring-slate-500/20',
  error: 'bg-red-50 text-red-700 ring-red-600/20',
};

const ExtensionCard: React.FC<ExtensionCardProps> = ({ extension }) => {
  const online = extension.isOnline !== false;
  const tab = extension.currentUrl?.trim();
  const activityLabel = getExtensionActivityLabel(extension);
  const activityTone = getExtensionActivityTone(extension);
  const hasActiveOrder = Boolean(extension.activeOrderStatus);

  return (
    <Link
      to={`/extensions/${encodeURIComponent(extension.extensionId)}`}
      className="group block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-primary-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white ${
              online ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
            title={online ? 'Connected' : 'Disconnected'}
          />
          <span className="font-mono text-sm font-medium text-slate-900 truncate">
            {formatExtensionId(extension.extensionId)}
          </span>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${activityToneClass[activityTone]}`}
        >
          {activityLabel}
        </span>
      </div>

      {hasActiveOrder && (
        <p className="mt-2 text-xs text-slate-600">
          <span className="font-medium text-slate-800">{extension.patchedJobCount ?? 0}</span> jobs patched
          {extension.activeOrderId ? (
            <span className="text-slate-400"> · {extension.activeOrderId.slice(0, 8)}…</span>
          ) : null}
        </p>
      )}

      <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 min-h-[2.75rem]">
        {tab ? (
          <p className="text-xs text-slate-700 line-clamp-2 break-all" title={tab}>
            {truncateUrl(tab, 80)}
          </p>
        ) : (
          <p className="text-xs text-slate-400 italic">No active tab reported</p>
        )}
      </div>

      <p className="mt-3 text-[11px] text-slate-400">
        Last seen {formatRelativeTime(extension.lastSeen)}
        {extension.version ? ` · v${extension.version}` : ''}
      </p>
    </Link>
  );
};

export default ExtensionCard;
