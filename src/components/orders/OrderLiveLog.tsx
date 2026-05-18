import React, { useEffect, useRef } from 'react';
import type { LogEntry } from '../../types/actionOrder';
import { formatTime } from '../../utils/formatters';

interface OrderLiveLogProps {
  entries: LogEntry[];
}

const levelDot: Record<LogEntry['level'], string> = {
  info: 'bg-slate-400',
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  warn: 'bg-amber-500',
};

const OrderLiveLog: React.FC<OrderLiveLogProps> = ({ entries }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">Activity</h2>
        <p className="text-xs text-slate-500 mt-0.5">Order events for this extension</p>
      </div>

      <div className="max-h-64 overflow-y-auto log-scroll px-5 py-3">
        {entries.length === 0 ? (
          <p className="text-sm text-slate-400 py-2">No activity yet.</p>
        ) : (
          <ul className="space-y-2.5">
            {entries.map((entry) => (
              <li key={entry.id} className="flex gap-3 text-sm">
                <span
                  className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${levelDot[entry.level]}`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-slate-800 break-words">{entry.message}</p>
                  {entry.detail && (
                    <p className="text-xs text-slate-500 mt-0.5 break-words whitespace-pre-wrap">
                      {entry.detail}
                    </p>
                  )}
                </div>
                <time className="text-[11px] text-slate-400 tabular-nums shrink-0">
                  {formatTime(entry.at)}
                </time>
              </li>
            ))}
          </ul>
        )}
        <div ref={bottomRef} aria-hidden />
      </div>
    </section>
  );
};

export default OrderLiveLog;
