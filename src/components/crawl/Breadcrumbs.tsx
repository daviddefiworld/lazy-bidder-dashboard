import React from 'react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  compact?: boolean;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, compact }) => (
  <nav aria-label="Breadcrumb" className={compact ? 'mb-3' : 'mb-6'}>
    <ol className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <li key={i} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <span className="text-slate-300 shrink-0">/</span>}
            {item.to && !last ? (
              <Link to={item.to} className="hover:text-primary-700 transition truncate max-w-[12rem] sm:max-w-xs">
                {item.label}
              </Link>
            ) : (
              <span
                className={`truncate max-w-[14rem] sm:max-w-md ${last ? 'text-slate-800 font-medium' : ''}`}
                title={item.label}
              >
                {item.label}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  </nav>
);

export default Breadcrumbs;
