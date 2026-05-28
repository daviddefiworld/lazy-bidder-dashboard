import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { AUTH_TOKEN_STORAGE_KEY } from '../constants/authStorage';
import { IApiResponse } from '../types/api';
import type { JobsCountByDayByPlatformResult, JobsCountByDayResult } from '../types/analytics';
import type {
  CompanyListParams,
  CrawlListResult,
  IndeedCompany,
  IndeedJob,
  JobListParams
} from '../types/crawl';
import type { ActionOrder } from '../types/actionOrder';
import type { CompanyAnalyzer, GrokResearchStartResult } from '../types/companyResearch';
import type { AuthUser, DashboardPermission } from '../types/auth';

export interface Extension {
  _id: string;
  extensionId: string;
  userEmail?: string;
  userId?: string;
  isRunning: boolean;
  lastSeen: string;
  userAgent?: string;
  version?: string;
  guideId?: string;
  profileId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Guide {
  _id: string;
  name: string;
  platform: string;
  description: string;
  steps: any[];
  userId: string;
  userEmail: string;
  isDefault?: boolean;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  _id: string;
  name: string;
  userId: string;
  userEmail: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  location?: string;
  resumeUrl?: string;
  coverLetterTemplate?: string;
  skills?: string[];
  experience?: Array<{
    title: string;
    company: string;
    duration: string;
    description?: string;
  }>;
  education?: Array<{
    degree: string;
    school: string;
    year?: string;
  }>;
  preferences?: {
    minSalary?: number;
    maxSalary?: number;
    preferredLocations?: string[];
    jobTypes?: string[];
    remotePreferred?: boolean;
  };
  customFields?: Record<string, any>;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyRow {
  id: string;
  name: string;
  keyId: string;
  keyPrefix: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface CreateApiKeyResponse {
  id: string;
  name: string;
  keyId: string;
  key: string;
  createdAt: string;
}

export interface CombineActionResult {
  groups: number;
  combinedRecords: number;
  sourcesMarked: number;
  skipped?: number;
  duplicateGroupsMerged?: number;
  duplicateRecordsMerged?: number;
}

export interface UncombinedCounts {
  companies: number;
  jobs: number;
}

export interface DashboardUserRow {
  id: string;
  username: string;
  role: 'admin' | 'user';
  permissions: DashboardPermission[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyBatchAnalyzeCurrent {
  platform: string;
  companypage: string;
  company_name?: string;
  stage: 'grok' | 'ai';
  orderId?: string;
}

export interface CompanyBatchAnalyzeStatus {
  running: boolean;
  total: number;
  completed: number;
  failed: number;
  remaining: number;
  current?: CompanyBatchAnalyzeCurrent;
  lastError?: string;
  startedAt?: string;
  finishedAt?: string;
  stopped?: boolean;
}

export interface CompanyAnalyzerBatchOverview {
  nonAnalyzed: number;
  reanalyzeEligible: number;
  batch: CompanyBatchAnalyzeStatus;
}

class ApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    const baseURL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5005';

    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.axiosInstance.interceptors.request.use((config) => {
      if (typeof window !== 'undefined') {
        const t = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
        if (t) {
          config.headers.Authorization = `Bearer ${t}`;
        }
      }
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse<IApiResponse>) => {
        const { data } = response;
        if (!data.success) {
          throw new Error(data.error || data.message || 'API request failed');
        }
        return data.data;
      },
      (error) => {
        console.error('API Error:', error);
        const body = error?.response?.data;
        const msg =
          (typeof body?.message === 'string' && body.message) ||
          (typeof body?.error === 'string' && body.error) ||
          error?.message ||
          'API request failed';
        throw new Error(msg);
      }
    );
  }

  async login(
    username: string,
    password: string
  ): Promise<{ token: string; user: AuthUser }> {
    return this.axiosInstance.post('/api/auth/login', { username, password });
  }

  async getSession(): Promise<{ user: AuthUser }> {
    return this.axiosInstance.get('/api/auth/session');
  }

  async listUsers(): Promise<DashboardUserRow[]> {
    return this.axiosInstance.get('/api/admin/users');
  }

  async createUser(input: {
    username: string;
    password: string;
    role: 'admin' | 'user';
    permissions?: DashboardPermission[];
  }): Promise<DashboardUserRow> {
    return this.axiosInstance.post('/api/admin/users', input);
  }

  async updateUserPermissions(
    id: string,
    input: { role: 'admin' | 'user'; permissions: DashboardPermission[] }
  ): Promise<DashboardUserRow> {
    return this.axiosInstance.patch(`/api/admin/users/${id}/permissions`, input);
  }

  async updateUserPassword(id: string, password: string): Promise<void> {
    return this.axiosInstance.patch(`/api/admin/users/${id}/password`, { password });
  }

  async deleteUser(id: string): Promise<void> {
    return this.axiosInstance.delete(`/api/admin/users/${id}`);
  }

  async listApiKeys(): Promise<ApiKeyRow[]> {
    return this.axiosInstance.get('/api/admin/api-keys');
  }

  async createApiKey(name: string): Promise<CreateApiKeyResponse> {
    return this.axiosInstance.post('/api/admin/api-keys', { name });
  }

  async revokeApiKey(id: string): Promise<void> {
    return this.axiosInstance.patch(`/api/admin/api-keys/${id}/revoke`);
  }

  async getExtensions(): Promise<Extension[]> {
    return this.axiosInstance.get('/api/extensions');
  }

  async removeExtension(extensionId: string): Promise<void> {
    return this.axiosInstance.delete(`/api/extensions/${extensionId}`);
  }

  async createActionOrder(
    extensionId: string,
    params: { query: string; location: string; sort: string; fromage: string; sitename?: string }
  ) {
    return this.axiosInstance.post('/api/action-orders', {
      extensionId,
      ...params
    });
  }

  async createGrokActionOrder(extensionId: string, message: string) {
    return this.axiosInstance.post('/api/action-orders/grok', {
      extensionId,
      message
    });
  }

  async getActionOrders(extensionId?: string) {
    const params = extensionId ? { extensionId } : {};
    return this.axiosInstance.get('/api/action-orders', { params });
  }

  async getActionOrder(orderId: string): Promise<ActionOrder> {
    return this.axiosInstance.get(`/api/action-orders/${orderId}`);
  }

  async updateExtension(extensionId: string, data: { guideId?: string | null; profileId?: string | null }) {
    return this.axiosInstance.put(`/api/extensions/${extensionId}`, data);
  }

  async getGuides(): Promise<Guide[]> {
    return this.axiosInstance.get('/api/guides');
  }

  async getGuide(guideId: string) {
    return this.axiosInstance.get(`/api/guides/${guideId}`);
  }

  async createGuide(data: Partial<Guide>) {
    return this.axiosInstance.post('/api/guides', data);
  }

  async updateGuide(guideId: string, data: Partial<Guide>) {
    return this.axiosInstance.put(`/api/guides/${guideId}`, data);
  }

  async deleteGuide(guideId: string) {
    return this.axiosInstance.delete(`/api/guides/${guideId}`);
  }

  async getPlatformGuides(platform: string) {
    return this.axiosInstance.get(`/api/guides/platform/${platform}`);
  }

  async getProfiles(): Promise<UserProfile[]> {
    return this.axiosInstance.get('/api/profiles');
  }

  async getProfile(profileId: string) {
    return this.axiosInstance.get(`/api/profiles/${profileId}`);
  }

  async createProfile(data: Partial<UserProfile>) {
    return this.axiosInstance.post('/api/profiles', data);
  }

  async updateProfile(profileId: string, data: Partial<UserProfile>) {
    return this.axiosInstance.put(`/api/profiles/${profileId}`, data);
  }

  async deleteProfile(profileId: string) {
    return this.axiosInstance.delete(`/api/profiles/${profileId}`);
  }

  async getJobsCountByDay(params: { days: number; platform?: string }): Promise<JobsCountByDayResult> {
    return this.axiosInstance.get('/api/admin/crawl/analytics/jobs-per-day', { params });
  }

  async getJobsCountByDayByPlatform(params: { days: number }): Promise<JobsCountByDayByPlatformResult> {
    return this.axiosInstance.get('/api/admin/crawl/analytics/jobs-per-day-by-platform', { params });
  }

  async listCrawlJobs(params: JobListParams = {}): Promise<CrawlListResult<IndeedJob>> {
    return this.axiosInstance.get('/api/admin/crawl/jobs', { params });
  }

  async getCrawlJob(jobId: string): Promise<IndeedJob> {
    return this.axiosInstance.get(`/api/admin/crawl/jobs/${encodeURIComponent(jobId)}`);
  }

  async listCrawlCompanies(params: CompanyListParams = {}): Promise<CrawlListResult<IndeedCompany>> {
    return this.axiosInstance.get('/api/admin/crawl/companies', { params });
  }

  async getCrawlCompany(
    platform: string,
    opts: { companypage?: string; company_name?: string }
  ): Promise<IndeedCompany> {
    const params: Record<string, string> = { platform };
    if (opts.companypage?.trim()) {
      params.companypage = opts.companypage.trim();
    } else if (opts.company_name?.trim()) {
      params.company_name = opts.company_name.trim();
    }
    return this.axiosInstance.get('/api/admin/crawl/companies/lookup', { params });
  }

  async getCompanyAnalyzer(
    platform: string,
    companypage: string
  ): Promise<CompanyAnalyzer | null> {
    return this.axiosInstance.get('/api/admin/crawl/companies/analyzer', {
      params: { platform, companypage }
    });
  }

  async requestCompanyGrokResearch(
    platform: string,
    companypage: string,
    extensionId?: string
  ): Promise<GrokResearchStartResult> {
    return this.axiosInstance.post('/api/admin/crawl/companies/grok-research', {
      platform,
      companypage,
      ...(extensionId ? { extensionId } : {})
    });
  }

  async analyzeCompany(platform: string, companypage: string): Promise<CompanyAnalyzer> {
    return this.axiosInstance.post('/api/admin/crawl/companies/analyze', {
      platform,
      companypage
    });
  }

  async setCrawlCompanyIgnored(
    platform: string,
    companypage: string,
    ignored: boolean
  ): Promise<IndeedCompany> {
    return this.axiosInstance.patch('/api/admin/crawl/companies/ignored', {
      platform,
      companypage,
      ignored
    });
  }

  async getUncombinedCounts(): Promise<UncombinedCounts> {
    return this.axiosInstance.get('/api/admin/crawl/actions/uncombined-counts');
  }

  async getCompanyAnalyzerBatchOverview(): Promise<CompanyAnalyzerBatchOverview> {
    return this.axiosInstance.get('/api/admin/crawl/actions/company-analysis-status');
  }

  async startCompanyAnalyzerBatch(extensionId?: string): Promise<CompanyAnalyzerBatchOverview> {
    return this.axiosInstance.post('/api/admin/crawl/actions/analyze-companies', {
      ...(extensionId ? { extensionId } : {})
    });
  }

  async startCompanyReanalyzerBatch(): Promise<CompanyAnalyzerBatchOverview> {
    return this.axiosInstance.post('/api/admin/crawl/actions/reanalyze-companies');
  }

  async stopCompanyAnalyzerBatch(): Promise<CompanyAnalyzerBatchOverview> {
    return this.axiosInstance.post('/api/admin/crawl/actions/stop-analyze-companies');
  }

  async combineCrawlCompanies(): Promise<CombineActionResult> {
    return this.axiosInstance.post('/api/admin/crawl/actions/combine-companies');
  }

  async combineCrawlJobs(): Promise<CombineActionResult> {
    return this.axiosInstance.post('/api/admin/crawl/actions/combine-jobs');
  }

  async recombineCrawlCompanies(): Promise<CombineActionResult> {
    return this.axiosInstance.post('/api/admin/crawl/actions/recombine-companies');
  }

  async recombineCrawlJobs(): Promise<CombineActionResult> {
    return this.axiosInstance.post('/api/admin/crawl/actions/recombine-jobs');
  }
}

export const apiService = new ApiService();
export default apiService;
