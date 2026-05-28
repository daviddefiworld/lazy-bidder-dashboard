export const DASHBOARD_PERMISSIONS = [
  'view_analytics',
  'view_jobs',
  'view_companies',
  'manage_extensions',
  'manage_api_keys',
  'manage_actions',
  'manage_users',
  'run_company_grok',
  'run_company_analyze',
  'set_company_ignored'
] as const;

export type DashboardPermission = (typeof DASHBOARD_PERMISSIONS)[number];

export interface AuthUser {
  userId: string;
  username: string;
  role: 'admin' | 'user';
  permissions: DashboardPermission[];
}
