import React from 'react';

interface PaginationBarProps {
  total: number;
  limit: number;
  offset: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

const PaginationBar: React.FC<PaginationBarProps> = ({
  total,
  limit,
  offset,
  onPageChange,
  loading
}) => {
  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + limit, total);

  const windowStart = Math.max(1, page - 2);
  const windowEnd = Math.min(totalPages, page + 2);
  const pages: number[] = [];
  for (let p = windowStart; p <= windowEnd; p++) pages.push(p);

  const btn =
    'min-w-[2.25rem] rounded-lg border px-2.5 py-1.5 text-sm font-medium transition disabled:opacity-40 disabled:pointer-events-none';
  const idle = `${btn} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`;
  const active = `${btn} border-primary-600 bg-primary-600 text-white shadow-sm`;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
      <p className="text-slate-500 tabular-nums">
        {loading ? (
          'Loading…'
        ) : (
          <>
            Showing <span className="font-medium text-slate-700">{from}</span>–
            <span className="font-medium text-slate-700">{to}</span> of{' '}
            <span className="font-medium text-slate-700">{total.toLocaleString()}</span>
          </>
        )}
      </p>
      <div className="flex items-center gap-1 flex-wrap">
        <button
          type="button"
          className={idle}
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(page - 1)}
        >
          Prev
        </button>
        {windowStart > 1 && (
          <>
            <button type="button" className={idle} disabled={loading} onClick={() => onPageChange(1)}>
              1
            </button>
            {windowStart > 2 && <span className="px-1 text-slate-400">…</span>}
          </>
        )}
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            className={p === page ? active : idle}
            disabled={loading}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        {windowEnd < totalPages && (
          <>
            {windowEnd < totalPages - 1 && <span className="px-1 text-slate-400">…</span>}
            <button
              type="button"
              className={idle}
              disabled={loading}
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}
        <button
          type="button"
          className={idle}
          disabled={page >= totalPages || loading}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PaginationBar;
