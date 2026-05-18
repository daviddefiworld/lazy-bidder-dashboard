import React from 'react';

interface IndeedScrapePanelProps {
  query: string;
  location: string;
  sort: string;
  fromage: string;
  onQueryChange: (v: string) => void;
  onLocationChange: (v: string) => void;
  onSortChange: (v: string) => void;
  onFromageChange: (v: string) => void;
  onRun: () => void;
  disabled?: boolean;
  busy?: boolean;
  error?: string | null;
}

const IndeedScrapePanel: React.FC<IndeedScrapePanelProps> = ({
  query,
  location,
  sort,
  fromage,
  onQueryChange,
  onLocationChange,
  onSortChange,
  onFromageChange,
  onRun,
  disabled,
  busy,
  error,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRun();
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">Indeed scrape</h2>
        <p className="text-xs text-slate-500 mt-0.5">Search and save job listings on this extension.</p>
      </div>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2" role="alert">
            {error}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Job title / keywords</span>
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="e.g. software engineer"
              className="mt-1.5 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Location</span>
            <input
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              placeholder="e.g. remote"
              className="mt-1.5 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Posted within</span>
            <select
              value={fromage}
              onChange={(e) => onFromageChange(e.target.value)}
              className="mt-1.5 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
            >
              <option value="1">Last 24 hours</option>
              <option value="3">Last 3 days</option>
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Sort by</span>
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value)}
              className="mt-1.5 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
            >
              <option value="date">Date</option>
              <option value="relevance">Relevance</option>
            </select>
          </label>
        </div>
        <button
          type="submit"
          disabled={disabled || busy}
          className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition"
        >
          {busy ? 'Starting…' : 'Start scrape'}
        </button>
      </form>
    </section>
  );
};

export default IndeedScrapePanel;
