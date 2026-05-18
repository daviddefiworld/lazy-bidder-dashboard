import type { ActionOrderStatus } from './actionOrder';

export interface ConnectedExtension {
  extensionId: string;
  isRunning: boolean;
  lastSeen: number;
  version?: string;
  userAgent?: string;
  currentUrl?: string;
  isOnline?: boolean;
  activeOrderId?: string;
  activeOrderStatus?: ActionOrderStatus;
  patchedJobCount?: number;
}
