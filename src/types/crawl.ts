export interface IndeedJob {
  _id?: string;
  job_id: string;
  platform: string;
  indeed_job_key: string;
  title: string;
  normalized_title: string;
  company_name: string;
  company_page: string;
  employer_key: string;
  apply_url: string;
  job_country: string;
  city: string;
  admin1_code: string;
  admin1_name: string;
  postal_code: string;
  latitude?: number | null;
  longitude?: number | null;
  location_short: string;
  location_long: string;
  description_text: string;
  date_published?: string | null;
  expired: number;
  occupations_json: unknown[];
  benefits_json: unknown[];
  attributes_json: unknown[];
  company_review_rating?: number | null;
  company_review_count?: number | null;
  payload_json: Record<string, unknown>;
  source_query: string;
  source_location: string;
  source_sort: string;
  source_fromage: number;
  job_scraped_at: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IndeedCompany {
  _id?: string;
  platform: string;
  companypage: string;
  company_name: string;
  rating?: number | null;
  review_count?: number | null;
  employer_key: string;
  ceo_approval_pct?: number | null;
  founded?: number | null;
  headquarters: string;
  employee_range: string;
  website_url: string;
  is_gig_employer: number;
  jobs_tab_count?: number | null;
  /** Jobs in DB for this employer (stored on company, updated on job upsert). */
  jobs_count?: number;
  salaries_tab_count?: number | null;
  qa_tab_count?: number | null;
  interviews_tab_count?: number | null;
  faqs_json: unknown[];
  job_titles_json: unknown[];
  job_locations_json: unknown[];
  similar_companies_json: unknown[];
  payload_json: Record<string, unknown>;
  detail_scraped_at: string;
  ignored?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Companies list filter for ignored employers. */
export type CompanyIgnoredFilter = 'hide' | 'only' | 'all';

export interface CrawlListResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export type JobListSort = 'date' | 'relevant' | 'title';

export type CompanyListSort = 'updated' | 'jobs' | 'founded';

export type ListSortOrder = 'asc' | 'desc';

export interface CrawlListParams {
  limit?: number;
  offset?: number;
  platform?: string;
  company_name?: string;
  /** Exact employer slug; use with `platform` on company detail. */
  company_page?: string;
  search?: string;
}

export interface CompanyListParams extends CrawlListParams {
  ignored?: CompanyIgnoredFilter;
  sort?: CompanyListSort;
  order?: ListSortOrder;
  /** Only employers with jobs posted in the last N days */
  posted_within?: number;
  date_from?: string;
  date_to?: string;
}

export interface JobListParams extends CrawlListParams {
  sort?: JobListSort;
  skills?: string;
  /** Last N days posted */
  posted_within?: number;
  date_from?: string;
  date_to?: string;
}
