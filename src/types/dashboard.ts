import { Extension, UrlHistoryItem } from '../services/apiService';

export interface ExtensionStatus {
  isActive: boolean;
  lastSeen: Date;
  isOnline: boolean;
  currentUrl?: string;
}

export interface UrlChange {
  extensionId: string;
  url: string;
  timestamp: number;
}

export interface DashboardStats {
  totalExtensions: number;
  activeExtensions: number;
  onlineExtensions: number;
  totalUrlChanges: number;
  recentActivity: number;
}

export interface ExtensionWithStatus extends Extension {
  status: ExtensionStatus;
}

export interface DashboardFilters {
  extensionId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  urlType?: 'page_load' | 'spa_navigation' | 'tab_change';
  domain?: string;
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface DashboardState {
  extensions: Extension[];
  urlHistory: UrlHistoryItem[];
  extensionStatuses: Record<string, ExtensionStatus>;
  recentUrlChanges: UrlChange[];
  loading: boolean;
  error: string | null;
  pagination: PaginationState;
}

export interface DashboardActions {
  loadData: () => Promise<void>;
  setPage: (page: number) => void;
  setError: (error: string | null) => void;
  activateExtension: (extensionId: string) => void;
  deactivateExtension: (extensionId: string) => void;
  sendTestMessage: () => void;
}

export interface DashboardProps {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

export interface CardProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'active' | 'inactive';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}
