import React from 'react';
import type { ContactLink } from '../../utils/contactLinks';

interface CompanyContactLinksProps {
  contacts: ContactLink[];
  grokReady?: boolean;
  variant?: 'default' | 'sidebar';
}

const kindIcon: Record<ContactLink['kind'], string> = {
  linkedin: 'in',
  twitter: '𝕏',
  email: '@',
  web: '↗',
  other: '·'
};

const kindTitle: Record<ContactLink['kind'], string> = {
  linkedin: 'LinkedIn',
  twitter: 'X / Twitter',
  email: 'Email',
  web: 'Website',
  other: 'Link'
};

const CompanyContactLinks: React.FC<CompanyContactLinksProps> = ({
  contacts,
  grokReady,
  variant = 'default'
}) => {
  const isSidebar = variant === 'sidebar';

  if (contacts.length === 0) {
    if (!grokReady) return null;
    return (
      <div
        className={
          isSidebar
            ? 'text-xs text-slate-500 leading-snug'
            : 'rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-2.5'
        }
      >
        <p className="text-xs text-slate-500">
          No contacts yet — Grok should list people in{' '}
          <strong>Key people & contact info</strong>.
        </p>
      </div>
    );
  }

  const linkClass = isSidebar
    ? 'inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-800 hover:bg-primary-50 hover:border-primary-200 transition max-w-full min-w-0'
    : 'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-primary-800 hover:bg-primary-50 hover:border-primary-200 transition max-w-[240px]';

  const content = (
    <ul className={`flex flex-wrap gap-1.5 ${isSidebar ? '' : 'gap-2'}`}>
      {contacts.map((c) => (
        <li key={c.url} className={isSidebar ? 'min-w-0 max-w-full' : ''}>
          <a
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
            title={`${kindTitle[c.kind]} — ${c.url}`}
          >
            <span
              className="shrink-0 w-5 h-5 rounded bg-white ring-1 ring-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600 uppercase"
              aria-hidden
            >
              {kindIcon[c.kind]}
            </span>
            <span className="truncate">{c.label}</span>
          </a>
        </li>
      ))}
    </ul>
  );

  if (isSidebar) {
    return (
      <div>
        <p className="text-xs font-medium text-slate-500 mb-2">Contacts</p>
        {content}
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
        Contacts & links
      </h3>
      {content}
    </section>
  );
};

export default CompanyContactLinks;
