import type { ActionOrderStatus } from '../types/actionOrder';
import type { ConnectedExtension } from '../types/extension';

export function toTimestampMs(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' || value instanceof Date) {
    const ms = new Date(value).getTime();
    if (Number.isFinite(ms)) return ms;
  }
  return Date.now();
}

const ORDER_STATUS_LABEL: Record<ActionOrderStatus, string> = {
  pending: 'Starting',
  executing: 'Scraping',
  stopped: 'Paused',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

export function getExtensionActivityLabel(extension: ConnectedExtension): string {
  if (extension.activeOrderStatus) {
    return ORDER_STATUS_LABEL[extension.activeOrderStatus] ?? extension.activeOrderStatus;
  }
  if (extension.isRunning) return 'Busy';
  return 'Idle';
}

export function getExtensionActivityTone(
  extension: ConnectedExtension
): 'active' | 'paused' | 'idle' | 'error' {
  switch (extension.activeOrderStatus) {
    case 'executing':
    case 'pending':
      return 'active';
    case 'stopped':
      return 'paused';
    case 'failed':
      return 'error';
    default:
      return extension.isRunning ? 'active' : 'idle';
  }
}
