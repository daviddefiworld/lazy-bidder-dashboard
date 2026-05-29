import type { UserActivityRow } from '../types/userActivity';
import { companyDetailPath, jobDetailPath } from './crawlUtils';

export interface UserActivityLink {
  to: string;
  label: string;
}

function str(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function jobsListPath(details: Record<string, unknown>): string {
  const params = new URLSearchParams();
  const q = str(details.query);
  const skills = str(details.skills);
  const sort = str(details.sort);
  const posted = str(details.posted);

  if (q) params.set('q', q);
  if (skills) params.set('skills', skills);
  if (sort) params.set('sort', sort);
  if (posted) params.set('posted', posted);

  const qs = params.toString();
  return qs ? `/jobs?${qs}` : '/jobs';
}

function companiesListPath(details: Record<string, unknown>): string {
  const params = new URLSearchParams();
  const q = str(details.query);
  const sort = str(details.sort);
  const order = str(details.order);
  const posted = str(details.posted);
  const ignored = str(details.ignored);

  if (q) params.set('q', q);
  if (sort) params.set('sort', sort);
  if (order) params.set('order', order);
  if (posted) params.set('posted', posted);
  if (ignored) params.set('ignored', ignored);

  const qs = params.toString();
  return qs ? `/companies?${qs}` : '/companies';
}

export function getUserActivityLink(row: UserActivityRow): UserActivityLink | null {
  const d = row.details;

  switch (row.action) {
    case 'view_job':
    case 'apply': {
      const jobId = str(d.jobId) ?? str(d.job_id);
      if (!jobId) return null;
      return {
        to: jobDetailPath(jobId),
        label: row.action === 'apply' ? 'Open job' : 'Open job'
      };
    }
    case 'view_company': {
      const platform = str(d.platform) ?? '';
      const to = companyDetailPath(platform, {
        companypage: str(d.companypage),
        company_name: str(d.company_name)
      });
      if (!to) return null;
      return { to, label: 'Open company' };
    }
    case 'search':
    case 'sort':
      if (row.context === 'jobs') {
        return { to: jobsListPath(d), label: 'Open jobs' };
      }
      if (row.context === 'companies') {
        return { to: companiesListPath(d), label: 'Open companies' };
      }
      return null;
    default:
      return null;
  }
}

export function getUserActivityContextLink(row: UserActivityRow): UserActivityLink | null {
  switch (row.context) {
    case 'job': {
      const jobId = str(row.details.jobId) ?? str(row.details.job_id);
      return jobId ? { to: jobDetailPath(jobId), label: 'Job' } : null;
    }
    case 'company': {
      const platform = str(row.details.platform) ?? '';
      const to = companyDetailPath(platform, {
        companypage: str(row.details.companypage),
        company_name: str(row.details.company_name)
      });
      return to ? { to, label: 'Company' } : null;
    }
    case 'jobs':
      return { to: jobsListPath(row.details), label: 'Jobs' };
    case 'companies':
      return { to: companiesListPath(row.details), label: 'Companies' };
    default:
      return null;
  }
}
