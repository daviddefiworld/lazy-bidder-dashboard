import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { IApiResponse } from '../types/api';

export interface Extension {
  _id: string;
  extensionId: string;
  userEmail: string;
  userId: string;
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

export interface UrlHistoryItem {
  _id: string;
  userEmail: string;
  userId: string;
  extensionId: string;
  url: string;
  previousUrl?: string;
  title?: string;
  tabId?: number;
  timestamp: string;
  type: 'tab_change' | 'spa_navigation' | 'page_load';
  domain?: string;
  path?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UrlHistoryParams {
  limit?: number;
  offset?: number;
  extensionId?: string;
}

class ApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    const baseURL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';

    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
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
        throw error;
      }
    );
  }

  async getExtensions(): Promise<Extension[]> {
    return this.axiosInstance.get('/api/extensions');
  }

  async getUrlHistory(params: UrlHistoryParams = {}): Promise<UrlHistoryItem[]> {
    return this.axiosInstance.get('/api/extensions/url-history', { params });
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

  async getActionOrders(extensionId?: string) {
    const params = extensionId ? { extensionId } : {};
    return this.axiosInstance.get('/api/action-orders', { params });
  }

  async getActionOrder(orderId: string) {
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
}

export const apiService = new ApiService();
export default apiService;
