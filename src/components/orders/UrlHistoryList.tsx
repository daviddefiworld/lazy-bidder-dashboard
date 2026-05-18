import React from 'react';
import type { UrlHistoryItem } from '../../services/apiService';
import { formatDate, getTypeColor } from '../../utils/formatters';
import { getDomainFromUrl, truncateUrl } from '../../utils/urlUtils';

interface UrlHistoryListProps {
  items: UrlHistoryItem[];
  loading: boolean;
}

const UrlHistoryList: React.FC<UrlHistoryListProps> = ({ items, loading }) => {
  if (loading) {
    return <p className="text-sm text-slate-400 py-4 text-center">Loading…</p>;
  }

  if (items.length === 0) {
    return <p className="text-sm text-slate-400 py-4 text-center">No URL history yet</p>;
  }

  return (
    <ul className="divide-y divide-slate-100 max-h-64 overflow-y-auto log-scroll">
      {items.map((item) => (
        <li key={item._id} className="py-2.5 px-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ring-1 ring-inset ${getTypeColor(item.type)}`}>
              {item.type.replace('_', ' ')}
            </span>
            <span className="text-[10px] text-slate-400 shrink-0">{formatDate(item.timestamp)}</span>
          </div>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary-600 hover:underline break-all line-clamp-2"
            title={item.url}
          >
            {truncateUrl(item.url, 72)}
          </a>
          <p className="text-[10px] text-slate-400 mt-0.5">{getDomainFromUrl(item.url)}</p>
        </li>
      ))}
    </ul>
  );
};

export default UrlHistoryList;
