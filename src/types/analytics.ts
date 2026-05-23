export interface JobsCountByDayPoint {
  date: string;
  count: number;
}

export interface JobsCountByDayResult {
  series: JobsCountByDayPoint[];
  total: number;
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
