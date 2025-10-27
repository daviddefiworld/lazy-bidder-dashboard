import { Extension, UrlHistoryItem } from './apiService';

export interface DashboardStats {
  totalExtensions: number;
  activeExtensions: number;
  onlineExtensions: number;
  totalUrlChanges: number;
  recentActivity: number;
}

export interface ExtensionWithStatus extends Extension {
  status: {
    isActive: boolean;
    lastSeen: Date;
    isOnline: boolean;
    currentUrl?: string;
  };
}

export class DashboardService {
  /**
   * Calculate dashboard statistics
   */
  static calculateStats(
    extensions: Extension[],
    extensionStatuses: Record<string, any>,
    urlHistory: UrlHistoryItem[]
  ): DashboardStats {
    const totalExtensions = extensions.length;
    const activeExtensions = Object.values(extensionStatuses).filter(
      (status: any) => status.isActive
    ).length;
    const onlineExtensions = Object.values(extensionStatuses).filter(
      (status: any) => status.isOnline
    ).length;
    const totalUrlChanges = urlHistory.length;
    
    // Calculate recent activity (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentActivity = urlHistory.filter(
      item => new Date(item.timestamp) > oneDayAgo
    ).length;

    return {
      totalExtensions,
      activeExtensions,
      onlineExtensions,
      totalUrlChanges,
      recentActivity,
    };
  }

  /**
   * Merge extensions with their real-time status
   */
  static mergeExtensionsWithStatus(
    extensions: Extension[],
    extensionStatuses: Record<string, any>
  ): ExtensionWithStatus[] {
    return extensions.map(extension => ({
      ...extension,
      status: extensionStatuses[extension.extensionId] || {
        isActive: extension.isActive,
        lastSeen: new Date(extension.lastSeen),
        isOnline: false,
      },
    }));
  }

  /**
   * Filter URL history by extension
   */
  static filterUrlHistoryByExtension(
    urlHistory: UrlHistoryItem[],
    extensionId: string
  ): UrlHistoryItem[] {
    return urlHistory.filter(item => item.extensionId === extensionId);
  }

  /**
   * Get recent URL changes for a specific extension
   */
  static getRecentUrlChangesForExtension(
    urlHistory: UrlHistoryItem[],
    extensionId: string,
    limit: number = 5
  ): UrlHistoryItem[] {
    return urlHistory
      .filter(item => item.extensionId === extensionId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Format extension ID for display
   */
  static formatExtensionId(extensionId: string, length: number = 8): string {
    return `${extensionId.slice(0, length)}...`;
  }

  /**
   * Get domain from URL
   */
  static getDomainFromUrl(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  /**
   * Check if URL is from a specific domain
   */
  static isUrlFromDomain(url: string, domain: string): boolean {
    try {
      const urlDomain = new URL(url).hostname;
      return urlDomain.includes(domain);
    } catch {
      return false;
    }
  }

  /**
   * Group URL history by domain
   */
  static groupUrlHistoryByDomain(urlHistory: UrlHistoryItem[]): Record<string, UrlHistoryItem[]> {
    return urlHistory.reduce((groups, item) => {
      const domain = this.getDomainFromUrl(item.url);
      if (!groups[domain]) {
        groups[domain] = [];
      }
      groups[domain].push(item);
      return groups;
    }, {} as Record<string, UrlHistoryItem[]>);
  }
}
