export type UserActivityAction = 'search' | 'sort' | 'view_job' | 'view_company' | 'apply';

export type UserActivityContext = 'jobs' | 'companies' | 'job' | 'company';

export interface LogUserActivityInput {
  action: UserActivityAction;
  context: UserActivityContext;
  details?: Record<string, unknown>;
}

export interface UserActivityRow {
  id: string;
  userId: string;
  username: string;
  action: UserActivityAction;
  context: UserActivityContext;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface UserActivitySummaryRow {
  userId: string;
  username: string;
  search: number;
  sort: number;
  view_job: number;
  view_company: number;
  apply: number;
  total: number;
}

export interface UserActivityDailyPoint {
  date: string;
  search: number;
  sort: number;
  view_job: number;
  view_company: number;
  apply: number;
  total: number;
}

export interface UserActivityDailyResult {
  series: UserActivityDailyPoint[];
  totals: Omit<UserActivityDailyPoint, 'date'>;
}

export interface UserActivityUserOption {
  userId: string;
  username: string;
}

export interface UserActivityLogResult {
  items: UserActivityRow[];
  total: number;
  limit: number;
  offset: number;
}

export interface UserActivityBaseParams {
  userId?: string;
  days?: number;
}

export interface UserActivityLogParams extends UserActivityBaseParams {
  action?: UserActivityAction;
  context?: UserActivityContext;
  limit?: number;
  offset?: number;
}

/** @deprecated */
export interface UserActivityListResult {
  items: UserActivityRow[];
  total: number;
  summary: UserActivitySummaryRow[];
}

/** @deprecated */
export interface UserActivityListParams extends UserActivityLogParams {}
