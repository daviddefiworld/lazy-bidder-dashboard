import { useCallback, useEffect, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import socketService, { type SocketEvents } from '../services/socketService';
import type { ActionOrderStatus } from '../types/actionOrder';
import type { ConnectedExtension } from '../types/extension';
import { toTimestampMs } from '../utils/extensionUtils';

const TERMINAL_ORDER_STATUSES = new Set<ActionOrderStatus>(['completed', 'failed', 'cancelled']);

function mergeExtension(
  base: ConnectedExtension,
  patch: Partial<ConnectedExtension> & { extensionId: string }
): ConnectedExtension {
  const next: ConnectedExtension = { ...base, ...patch, extensionId: patch.extensionId };
  if (patch.lastSeen !== undefined) {
    next.lastSeen = toTimestampMs(patch.lastSeen);
  }
  return next;
}

export function useConnectedExtensions(pollMs = 2000) {
  const { isConnected } = useSocket();
  const [extensions, setExtensions] = useState<ConnectedExtension[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (socketService.getConnectionStatus()) {
      socketService.requestExtensionStatus();
    }
  }, []);

  useEffect(() => {
    if (!isConnected) {
      setExtensions([]);
      setLoading(false);
      return;
    }

    const onList = (data: { extensions: ConnectedExtension[] }) => {
      setExtensions((prev) => {
        const prevById = new Map(prev.map((e) => [e.extensionId, e]));
        return (data.extensions ?? []).map((ext) => {
          const normalized: ConnectedExtension = {
            ...ext,
            lastSeen: toTimestampMs(ext.lastSeen),
            isOnline: ext.isOnline !== false,
          };
          const existing = prevById.get(ext.extensionId);
          if (!existing) return normalized;
          return mergeExtension(normalized, {
            extensionId: ext.extensionId,
            activeOrderId: existing.activeOrderId,
            activeOrderStatus: existing.activeOrderStatus,
            patchedJobCount: existing.patchedJobCount,
            currentUrl: normalized.currentUrl ?? existing.currentUrl,
          });
        });
      });
      setLoading(false);
    };

    const patchExtension = (patch: Partial<ConnectedExtension> & { extensionId: string }) => {
      setExtensions((prev) => {
        const idx = prev.findIndex((e) => e.extensionId === patch.extensionId);
        if (idx === -1) {
          refresh();
          return prev;
        }
        const next = [...prev];
        next[idx] = mergeExtension(next[idx], patch);
        return next;
      });
    };

    const onOnlineStatus: SocketEvents['extension:online_status'] = (data) => {
      patchExtension({
        extensionId: data.extensionId,
        isOnline: data.isOnline,
        lastSeen: data.timestamp,
      });
    };

    const onRunningUpdate: SocketEvents['extension:running_update'] = (data) => {
      patchExtension({
        extensionId: data.extensionId,
        isRunning: data.isRunning,
        lastSeen: data.timestamp,
      });
    };

    const onUrlChange: SocketEvents['extension:url_change'] = (data) => {
      patchExtension({
        extensionId: data.extensionId,
        currentUrl: data.url,
        lastSeen: data.timestamp,
      });
    };

    const onHeartbeat: SocketEvents['extension:heartbeat'] = (data) => {
      patchExtension({
        extensionId: data.extensionId,
        isOnline: data.isOnline,
        lastSeen: data.lastSeen,
      });
    };

    const onExtensionStatus: SocketEvents['extension:status'] = (data) => {
      if (!data.extensionId) return;
      if (data.isConnected === false) {
        setExtensions((prev) => prev.filter((e) => e.extensionId !== data.extensionId));
        return;
      }
      patchExtension({
        extensionId: data.extensionId,
        isOnline: true,
        lastSeen: data.lastSeen,
        ...(data.currentUrl ? { currentUrl: data.currentUrl } : {}),
      });
      refresh();
    };

    const onOrderSent: SocketEvents['action:order_sent'] = (data) => {
      patchExtension({
        extensionId: data.extensionId,
        activeOrderId: data.orderId,
        activeOrderStatus: 'pending',
        patchedJobCount: 0,
        isRunning: true,
        lastSeen: Date.now(),
      });
    };

    const onActionResult: SocketEvents['action:result'] = (data) => {
      const status = data.status as ActionOrderStatus;
      const jobCount = data.patchedJobCount ?? data.resultsCount;
      if (TERMINAL_ORDER_STATUSES.has(status)) {
        patchExtension({
          extensionId: data.extensionId,
          activeOrderId: undefined,
          activeOrderStatus: undefined,
          isRunning: false,
          ...(typeof jobCount === 'number' ? { patchedJobCount: jobCount } : {}),
          lastSeen: Date.now(),
        });
        return;
      }
      patchExtension({
        extensionId: data.extensionId,
        activeOrderId: data.orderId,
        activeOrderStatus: status,
        isRunning: status === 'executing' || status === 'pending',
        ...(typeof jobCount === 'number' ? { patchedJobCount: jobCount } : {}),
        lastSeen: Date.now(),
      });
    };

    const onJobResult: SocketEvents['action:job_result'] = (data) => {
      const jobCount = data.patchedJobCount ?? data.resultsCount;
      if (typeof jobCount !== 'number') return;
      patchExtension({
        extensionId: data.extensionId,
        patchedJobCount: jobCount,
        activeOrderId: data.orderId,
        activeOrderStatus: 'executing',
        isRunning: true,
        lastSeen: Date.now(),
      });
    };

    socketService.on('extension:status_list', onList);
    socketService.on('extension:online_status', onOnlineStatus);
    socketService.on('extension:running_update', onRunningUpdate);
    socketService.on('extension:url_change', onUrlChange);
    socketService.on('extension:heartbeat', onHeartbeat);
    socketService.on('extension:status', onExtensionStatus);
    socketService.on('action:order_sent', onOrderSent);
    socketService.on('action:result', onActionResult);
    socketService.on('action:job_result', onJobResult);

    refresh();
    const interval = setInterval(refresh, pollMs);

    return () => {
      clearInterval(interval);
      socketService.off('extension:status_list', onList);
      socketService.off('extension:online_status', onOnlineStatus);
      socketService.off('extension:running_update', onRunningUpdate);
      socketService.off('extension:url_change', onUrlChange);
      socketService.off('extension:heartbeat', onHeartbeat);
      socketService.off('extension:status', onExtensionStatus);
      socketService.off('action:order_sent', onOrderSent);
      socketService.off('action:result', onActionResult);
      socketService.off('action:job_result', onJobResult);
    };
  }, [isConnected, pollMs, refresh]);

  return { extensions, loading, refresh, isSocketConnected: isConnected };
}
