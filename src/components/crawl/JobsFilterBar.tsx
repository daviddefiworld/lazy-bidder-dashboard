import React from 'react';
import type { JobListSort } from '../../types/crawl';
import SearchField from './SearchField';

export const POSTED_WITHIN_OPTIONS = [
  { value: '', label: 'Any date' },
  { value: '1', label: 'Last 24 hours' },
  { value: '3', label: 'Last 3 days' },
  { value: '7', label: 'Last 7 days' },
  { value: '14', label: 'Last 14 days' },
  { value: '30', label: 'Last 30 days' }
] as const;

const selectClass =
  'rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm text-slate-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20';

interface JobsFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  sort: JobListSort;
  onSortChange: (v: JobListSort) => void;
  postedWithin: string;
  onPostedWithinChange: (v: string) => void;
  skills: string;
  onSkillsChange: (v: string) => void;
  onRefresh: () => void;
  loading?: boolean;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

const JobsFilterBar: React.FC<JobsFilterBarProps> = ({
  search,
  onSearchChange,
  sort,
  onSortChange,
  postedWithin,
  onPostedWithinChange,
  skills,
  onSkillsChange,
  onRefresh,
  loading,
  hasActiveFilters,
  onClearFilters
}) => {
  const relevantDisabled = !search.trim();

  return (
    <div className="space-y-3">
      <SearchField
        value={search}
        onChange={onSearchChange}
        placeholder="Search jobs by title, company, location…"
        id="jobs-list-search"
      />

      <div className="flex flex-col xl:flex-row xl:items-end gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          <div>
            <label htmlFor="jobs-sort" className="block text-xs font-medium text-slate-600 mb-1">
              Sort
            </label>
            <select
              id="jobs-sort"
              value={sort}
              onChange={(e) => onSortChange(e.target.value as JobListSort)}
              className={`${selectClass} w-full`}
            >
              <option value="date">Date (newest)</option>
              <option value="title">Job name (A–Z)</option>
              <option value="relevant" disabled={relevantDisabled}>
                Relevant{relevantDisabled ? ' — add search' : ''}
              </option>
            </select>
          </div>

          <div>
            <label htmlFor="jobs-posted" className="block text-xs font-medium text-slate-600 mb-1">
              Date posted
            </label>
            <select
              id="jobs-posted"
              value={postedWithin}
              onChange={(e) => onPostedWithinChange(e.target.value)}
              className={`${selectClass} w-full`}
            >
              {POSTED_WITHIN_OPTIONS.map((o) => (
                <option key={o.value || 'any'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="jobs-skills" className="block text-xs font-medium text-slate-600 mb-1">
              Skills
            </label>
            <input
              id="jobs-skills"
              type="search"
              value={skills}
              onChange={(e) => onSkillsChange(e.target.value)}
              placeholder="e.g. React, Python…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasActiveFilters && onClearFilters ? (
            <button
              type="button"
              onClick={onClearFilters}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              Clear filters
            </button>
          ) : null}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobsFilterBar;
