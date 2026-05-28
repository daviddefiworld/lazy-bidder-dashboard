import React from 'react';
import type { JobListSort } from '../../types/crawl';
import SearchField from './SearchField';
import { filterBtnClass, filterInputClass, filterSelectClass } from './listPageStyles';

/** Days for `posted` URL param / API `posted_within` — default list window. */
export const DEFAULT_POSTED_WITHIN = '1';

export const POSTED_WITHIN_OPTIONS = [
  { value: '', label: 'Any date' },
  { value: '1', label: 'Last 24 hours' },
  { value: '3', label: 'Last 3 days' },
  { value: '7', label: 'Last 7 days' },
  { value: '14', label: 'Last 14 days' },
  { value: '30', label: 'Last 30 days' }
] as const;

interface JobsFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  sort: JobListSort;
  onSortChange: (v: JobListSort) => void;
  postedWithin: string;
  onPostedWithinChange: (v: string) => void;
  skills: string;
  onSkillsChange: (v: string) => void;
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
  hasActiveFilters,
  onClearFilters
}) => {
  const relevantDisabled = !search.trim();

  return (
    <div className="flex flex-wrap items-center gap-2 min-w-0">
      <SearchField
        value={search}
        onChange={onSearchChange}
        placeholder="Search title, company, location…"
        id="jobs-list-search"
        className="min-w-[10rem] flex-[2_1_14rem] max-w-full"
      />

      <input
        id="jobs-skills"
        type="search"
        value={skills}
        onChange={(e) => onSkillsChange(e.target.value)}
        placeholder="Search skills…"
        aria-label="Search skills"
        className={`${filterInputClass} min-w-[9.5rem] flex-[1_1_10rem] max-w-[14rem]`}
      />

      <select
        id="jobs-posted"
        value={postedWithin}
        onChange={(e) => onPostedWithinChange(e.target.value)}
        className={`${filterSelectClass} min-w-[9.5rem] flex-[0_0_auto]`}
        aria-label="Date posted"
      >
        {POSTED_WITHIN_OPTIONS.map((o) => (
          <option key={o.value || 'any'} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <select
        id="jobs-sort"
        value={sort}
        onChange={(e) => onSortChange(e.target.value as JobListSort)}
        className={`${filterSelectClass} min-w-[10.5rem] flex-[0_0_auto]`}
        aria-label="Sort"
      >
        <option value="fit_score">Fit score</option>
        <option value="date">Date (newest)</option>
        <option value="title">Job name (A–Z)</option>
        <option value="relevant" disabled={relevantDisabled}>
          Relevant{relevantDisabled ? ' — add search' : ''}
        </option>
      </select>

      {hasActiveFilters && onClearFilters ? (
        <button type="button" onClick={onClearFilters} className={`${filterBtnClass} text-slate-600`}>
          Clear
        </button>
      ) : null}
    </div>
  );
};

export default JobsFilterBar;
