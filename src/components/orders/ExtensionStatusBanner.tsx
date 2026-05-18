import React from 'react';
import type { ConnectedExtension } from '../../types/extension';
import { formatExtensionId, formatRelativeTime } from '../../utils/formatters';
import { getExtensionActivityLabel, getExtensionActivityTone } from '../../utils/extensionUtils';
import { truncateUrl } from '../../utils/urlUtils';

interface ExtensionStatusBannerProps {
  extension: ConnectedExtension | null;
  extensionId: string;
}

const activityToneClass: Record<ReturnType<typeof getExtensionActivityTone>, string> = {
  active: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  paused: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  idle: 'bg-slate-50 text-slate-500 ring-slate-500/20',
  error: 'bg-red-50 text-red-700 ring-red-600/20',
};

const ExtensionStatusBanner: React.FC<ExtensionStatusBannerProps> = ({ extension, extensionId }) => {
  const online = Boolean(extension && extension.isOnline !== false);
  const activityLabel = extension ? getExtensionActivityLabel(extension) : 'Unknown';
  const activityTone = extension ? getExtensionActivityTone(extension) : 'idle';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
            online
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
              : 'bg-slate-50 text-slate-500 ring-slate-500/20'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          {online ? 'Connected' : 'Disconnected'}
        </span>
        {extension && (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${activityToneClass[activityTone]}`}
          >
            {activityLabel}
          </span>
        )}
      </div>

      <div>
        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Extension ID</p>
        <p className="font-mono text-sm text-slate-900 break-all mt-0.5">{formatExtensionId(extensionId)}</p>
        <p className="font-mono text-[10px] text-slate-400 break-all mt-1">{extensionId}</p>
      </div>

      {extension?.activeOrderStatus && (
        <p className="text-xs text-slate-600">
          <span className="font-medium text-slate-800">{extension.patchedJobCount ?? 0}</span> jobs patched
        </p>
      )}

      <div>
        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Current tab</p>
        {extension?.currentUrl ? (
          <a
            href={extension.currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary-600 hover:underline break-all mt-0.5 block"
          >
            {truncateUrl(extension.currentUrl, 100)}
          </a>
        ) : (
          <p className="text-sm text-slate-400 italic mt-0.5">Not reported</p>
        )}
      </div>

      {extension && (
        <p className="text-xs text-slate-400">
          Last seen {formatRelativeTime(extension.lastSeen)}
          {extension.version ? ` · v${extension.version}` : ''}
        </p>
      )}
    </div>
  );
};

export default ExtensionStatusBanner;
