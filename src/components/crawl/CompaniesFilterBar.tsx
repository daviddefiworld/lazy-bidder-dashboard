import React from 'react';
import type { CompanyListSort, ListSortOrder } from '../../types/crawl';
import SearchField from './SearchField';
import { POSTED_WITHIN_OPTIONS } from './JobsFilterBar';
import { filterBtnClass, filterSelectClass, iconBtnClass } from './listPageStyles';
import { SortAscendingIcon, SortDescendingIcon } from './ListPageIcons';

interface CompaniesFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  postedWithin: string;
  onPostedWithinChange: (v: string) => void;
  sort: CompanyListSort;
  onSortChange: (v: CompanyListSort) => void;
  order: ListSortOrder;
  onOrderToggle: () => void;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

const CompaniesFilterBar: React.FC<CompaniesFilterBarProps> = ({
  search,
  onSearchChange,
  postedWithin,
  onPostedWithinChange,
  sort,
  onSortChange,
  order,
  onOrderToggle,
  hasActiveFilters,
  onClearFilters
}) => (
  <div className="flex items-center gap-2 min-w-0">
    <SearchField
      value={search}
      onChange={onSearchChange}
      placeholder="Search name, HQ, slug…"
      id="companies-list-search"
      className="min-w-0 flex-1"
    />

    <select
      id="companies-posted"
      value={postedWithin}
      onChange={(e) => onPostedWithinChange(e.target.value)}
      className={`${filterSelectClass} min-w-[9rem]`}
      aria-label="Jobs posted"
    >
      {POSTED_WITHIN_OPTIONS.map((o) => (
        <option key={o.value || 'any'} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>

    <select
      id="companies-sort"
      value={sort}
      onChange={(e) => onSortChange(e.target.value as CompanyListSort)}
      className={`${filterSelectClass} min-w-[9.5rem]`}
      aria-label="Sort"
    >
      <option value="updated">Recently updated</option>
      <option value="fit_score">Fit score</option>
      <option value="jobs">Job count</option>
      <option value="founded">Founded</option>
    </select>

    <button
      type="button"
      onClick={onOrderToggle}
      aria-label={order === 'desc' ? 'Descending (click for ascending)' : 'Ascending (click for descending)'}
      title={order === 'desc' ? 'Descending' : 'Ascending'}
      className={iconBtnClass}
    >
      {order === 'desc' ? <SortDescendingIcon /> : <SortAscendingIcon />}
    </button>

    {hasActiveFilters && onClearFilters ? (
      <button type="button" onClick={onClearFilters} className={`${filterBtnClass} text-slate-600`}>
        Clear
      </button>
    ) : null}
  </div>
);

export default CompaniesFilterBar;
