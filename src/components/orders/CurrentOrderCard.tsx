import React from 'react';
import type { ActionOrderStatus } from '../../types/actionOrder';
import { getOrderStatusColor } from '../../utils/formatters';

export interface CurrentOrderView {
  orderId: string;
  extensionId: string;
  sitename?: string;
  message?: string;
  status: ActionOrderStatus;
  patchedJobCount: number;
  error?: string;
}

interface CurrentOrderCardProps {
  order: CurrentOrderView | null;
  disabled?: boolean;
  onStop?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
}

const statusLabel: Record<ActionOrderStatus, string> = {
  pending: 'Starting',
  executing: 'Running',
  stopped: 'Paused',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

const CurrentOrderCard: React.FC<CurrentOrderCardProps> = ({
  order,
  disabled,
  onStop,
  onResume,
  onCancel,
}) => {
  const isGrok = order?.sitename === 'grok';

  if (!order) {
    return (
      <section className="rounded-xl border border-dashed border-slate-200 bg-white px-5 py-4">
        <p className="text-sm text-slate-500">
          No active order. Start a Grok order or an Indeed scrape below when the extension is online.
        </p>
      </section>
    );
  }

  const canStop = !isGrok && (order.status === 'pending' || order.status === 'executing');
  const canResume = !isGrok && order.status === 'stopped';
  const canCancel =
    order.status === 'pending' || order.status === 'executing' || order.status === 'stopped';
  const hasActions = (canStop || canResume || canCancel) && (onStop || onResume || onCancel);

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              {isGrok ? 'Active Grok order' : 'Active scrape'}
            </h2>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 ring-inset ${getOrderStatusColor(order.status)}`}
            >
              {statusLabel[order.status] ?? order.status}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
            {isGrok ? (
              <p className="text-slate-600 line-clamp-3 break-words" title={order.message}>
                {order.message ? <span className="text-slate-900 font-medium">“{order.message}”</span> : '—'}
              </p>
            ) : (
              <p className="text-slate-600">
                <span className="text-2xl font-semibold text-slate-900 tabular-nums">
                  {order.patchedJobCount}
                </span>{' '}
                jobs saved
              </p>
            )}
            <p className="font-mono text-xs text-slate-400 truncate" title={order.orderId}>
              {order.orderId.slice(0, 8)}…
            </p>
          </div>
          {order.error && (
            <p className="mt-2 text-xs text-red-700 bg-red-50 rounded-lg px-2.5 py-1.5 break-words">
              {order.error}
            </p>
          )}
        </div>

        {hasActions && (
          <div className="flex flex-wrap gap-2 shrink-0">
            {canResume && onResume && (
              <button
                type="button"
                onClick={onResume}
                disabled={disabled}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Resume
              </button>
            )}
            {canStop && onStop && (
              <button
                type="button"
                onClick={onStop}
                disabled={disabled}
                className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
              >
                Pause
              </button>
            )}
            {canCancel && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={disabled}
                className="px-3 py-2 text-xs font-semibold rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default CurrentOrderCard;
