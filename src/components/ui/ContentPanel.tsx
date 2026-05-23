import React from 'react';

type ContentPanelTone = 'slate' | 'violet';

interface ContentPanelProps {
  title: string;
  meta?: React.ReactNode;
  action?: React.ReactNode;
  tone?: ContentPanelTone;
  children: React.ReactNode;
  className?: string;
}

const headerTone: Record<ContentPanelTone, string> = {
  slate: 'border-slate-100 bg-slate-50/80',
  violet: 'border-violet-100 bg-violet-50/50'
};

const titleTone: Record<ContentPanelTone, string> = {
  slate: 'text-slate-900',
  violet: 'text-violet-900'
};

const metaTone: Record<ContentPanelTone, string> = {
  slate: 'text-slate-500',
  violet: 'text-violet-700/80'
};

/** Card shell used for report, Grok, and other long-form content on company pages. */
const ContentPanel: React.FC<ContentPanelProps> = ({
  title,
  meta,
  action,
  tone = 'slate',
  children,
  className = ''
}) => (
  <article
    className={`content-panel ${className}`.trim()}
  >
    <header
      className={`content-panel-header flex flex-wrap items-center justify-between gap-2 ${headerTone[tone]}`}
    >
      <div className="min-w-0">
        <h2 className={`text-sm font-semibold ${titleTone[tone]}`}>{title}</h2>
        {meta ? <div className={`mt-0.5 text-[11px] ${metaTone[tone]}`}>{meta}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
    <div className="content-panel-body">{children}</div>
  </article>
);

interface ContentPanelEmptyProps {
  title: string;
  description?: React.ReactNode;
  tone?: 'slate' | 'violet';
  children?: React.ReactNode;
}

export const ContentPanelEmpty: React.FC<ContentPanelEmptyProps> = ({
  title,
  description,
  tone = 'slate',
  children
}) => (
  <div
    className={
      tone === 'violet'
        ? 'content-panel-empty content-panel-empty--violet'
        : 'content-panel-empty'
    }
  >
    <p className="text-sm font-semibold text-slate-900">{title}</p>
    {description ? (
      <p className="mt-2 text-xs text-slate-600 leading-relaxed max-w-md mx-auto">{description}</p>
    ) : null}
    {children}
  </div>
);

export const ContentPanelLoading: React.FC<{ label: string; hint?: string }> = ({ label, hint }) => (
  <div className="content-panel-empty">
    <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
    <p className="mt-3 text-sm font-medium text-slate-800">{label}</p>
    {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
  </div>
);

export default ContentPanel;
