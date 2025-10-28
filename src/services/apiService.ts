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
}

class ApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    const baseURL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
    
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.loadToken();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle API response format
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

  private getToken(): string | null {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      return userData.token;
    }
    return null;
  }

  private loadToken() {
    // Token is loaded automatically via interceptor
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

  // Update token when user logs in
  updateToken(_token: string) {
    // Token is managed automatically via localStorage
  }

  // Clear token when user logs out
  clearToken() {
    // Token is managed automatically via localStorage
  }

  async createActionOrder(extensionId: string, actionType: string, actionConfig: any) {
    return this.axiosInstance.post('/api/action-orders', {
      extensionId,
      actionType,
      actionConfig
    });
  }

  async getActionOrders(extensionId?: string) {
    const params = extensionId ? { extensionId } : {};
    return this.axiosInstance.get('/api/action-orders', { params });
  }

  async getActionOrder(orderId: string) {
    return this.axiosInstance.get(`/api/action-orders/${orderId}`);
  }
}

export const apiService = new ApiService();
export default apiService;
