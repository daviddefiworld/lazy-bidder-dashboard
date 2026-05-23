import React, { useState } from 'react';

interface DetailSectionProps {
  title: string;
  children: React.ReactNode;
  id?: string;
  action?: React.ReactNode;
  /** When set, section body can be collapsed (starts open unless defaultCollapsed). */
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

const DetailSection: React.FC<DetailSectionProps> = ({
  title,
  children,
  id,
  action,
  collapsible = false,
  defaultCollapsed = false
}) => {
  const [open, setOpen] = useState(!defaultCollapsed);

  return (
    <section id={id} className="rounded-xl border border-slate-200 bg-white overflow-hidden scroll-mt-24">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-3">
        {collapsible ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex min-w-0 flex-1 items-center gap-2 text-left group"
            aria-expanded={open}
          >
            <svg
              className={`h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-slate-600 ${open ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <h3 className="text-sm font-semibold text-slate-900 truncate">{title}</h3>
          </button>
        ) : (
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        )}
        {action}
      </div>
      {(!collapsible || open) && <div className="px-5 py-4">{children}</div>}
    </section>
  );
};

export default DetailSection;
