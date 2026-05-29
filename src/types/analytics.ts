export interface JobsCountByDayPoint {
  date: string;
  count: number;
  relevantCount: number;
}

export interface JobsCountByDayResult {
  series: JobsCountByDayPoint[];
  total: number;
  totalRelevant: number;
  relevantThreshold: number;
  days: number;
}

export interface JobsCountByDayPlatformPoint {
  date: string;
  indeed: number;
  glassdoor: number;
}

export interface JobsCountByDayByPlatformResult {
  series: JobsCountByDayPlatformPoint[];
  totals: { indeed: number; glassdoor: number };
  days: number;
}
