import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CurrentOrderCard, { type CurrentOrderView } from '../components/orders/CurrentOrderCard';
import OrderLiveLog from '../components/orders/OrderLiveLog';
import IndeedScrapePanel from '../components/orders/IndeedScrapePanel';
import GrokOrderPanel from '../components/orders/GrokOrderPanel';
import { useConnectedExtensions } from '../hooks/useConnectedExtensions';
import { useSocket } from '../contexts/SocketContext';
import apiService from '../services/apiService';
import socketService from '../services/socketService';
import type { ActionOrder, LogEntry } from '../types/actionOrder';
import { formatExtensionId, formatRelativeTime } from '../utils/formatters';
import { getExtensionActivityLabel, getExtensionActivityTone } from '../utils/extensionUtils';
import { truncateUrl } from '../utils/urlUtils';
import { orderGrokMessage, orderPatchedJobCount } from '../utils/orderUtils';

const ACTIVE_STATUSES = new Set(['pending', 'executing', 'stopped']);

const activityToneClass = {
  active: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  paused: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  idle: 'bg-slate-50 text-slate-500 ring-slate-500/20',
  error: 'bg-red-50 text-red-700 ring-red-600/20',
} as const;

function makeLog(level: LogEntry['level'], message: string, detail?: string): LogEntry {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, at: Date.now(), level, message, detail };
}

function pickCurrentOrder(orders: ActionOrder[], preferredId: string | null): ActionOrder | null {
  if (preferredId) {
    const match = orders.find((o) => o.orderId === preferredId);
    if (match && ACTIVE_STATUSES.has(match.status)) return match;
  }
  return orders.find((o) => ACTIVE_STATUSES.has(o.status)) ?? null;
}

function jobCountFromOrder(order: ActionOrder | null): number {
  return orderPatchedJobCount(order);
}

type OrderSection = 'grok' | 'indeed';

const ExtensionDetailPage: React.FC = () => {
  const { extensionId: rawId } = useParams<{ extensionId: string }>();
  const extensionId = rawId ? decodeURIComponent(rawId) : '';
  const { isConnected } = useSocket();
  const { extensions } = useConnectedExtensions();
  const extension = extensions.find((e) => e.extensionId === extensionId) ?? null;

  const [orderSection, setOrderSection] = useState<OrderSection>('grok');
  const [query, setQuery] = useState('software');
  const [location, setLocation] = useState('remote');
  const [sort, setSort] = useState('date');
  const [fromage, setFromage] = useState('7');
  const [grokMessage, setGrokMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [grokError, setGrokError] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const activeOrderIdRef = useRef<string | null>(null);
  const [currentOrder, setCurrentOrder] = useState<ActionOrder | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);

  activeOrderIdRef.current = activeOrderId;

  const appendLog = useCallback((entry: LogEntry) => {
    setLogs((prev) => [...prev.slice(-99), entry]);
  }, []);

  const loadCurrentOrder = useCallback(async () => {
    if (!extensionId) return;
    setLoadingOrder(true);
    try {
      const orderList = (await apiService.getActionOrders(extensionId)) as unknown as ActionOrder[];
      const orders = orderList ?? [];
      const picked = pickCurrentOrder(orders, activeOrderIdRef.current);
      setCurrentOrder(picked);
      setActiveOrderId(picked?.orderId ?? null);
    } catch (e) {
      appendLog(
        makeLog('error', 'Failed to load order', e instanceof Error ? e.message : 'Unknown error')
      );
    } finally {
      setLoadingOrder(false);
    }
  }, [extensionId, appendLog]);

  useEffect(() => {
    loadCurrentOrder();
    const interval = setInterval(loadCurrentOrder, 8000);
    return () => clearInterval(interval);
  }, [loadCurrentOrder]);

  useEffect(() => {
    if (!isConnected || !extensionId) return;

    const onSent = (data: { orderId: string; extensionId: string }) => {
      if (data.extensionId !== extensionId) return;
      setActiveOrderId(data.orderId);
      appendLog(makeLog('info', 'Order queued'));
      loadCurrentOrder();
    };

    const onResult = (data: {
      orderId: string;
      extensionId: string;
      status: string;
      patchedJobCount?: number;
      resultsCount?: number;
      error?: string;
      grokResult?: { message: string; conversationId?: string };
    }) => {
      if (data.extensionId !== extensionId) return;
      const jobCount = data.patchedJobCount ?? data.resultsCount;
      const level = data.status === 'completed' ? 'success' : data.status === 'failed' ? 'error' : 'info';
      let summary = `Order ${data.status}`;
      let detail: string | undefined = data.error;
      if (data.grokResult?.message) {
        summary = `Grok ${data.status}`;
        detail =
          data.status === 'completed'
            ? data.grokResult.message.length > 280
              ? `${data.grokResult.message.slice(0, 280)}…`
              : data.grokResult.message
            : data.error;
      } else if (data.status === 'completed' && !data.grokResult) {
        summary = `Scrape ${data.status}`;
        detail = `${jobCount ?? 0} jobs saved`;
      }
      appendLog(makeLog(level, summary, detail));
      if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
        setActiveOrderId((cur) => (cur === data.orderId ? null : cur));
        setCurrentOrder((cur) => (cur?.orderId === data.orderId ? null : cur));
      } else if (typeof jobCount === 'number') {
        setCurrentOrder((cur) =>
          cur?.orderId === data.orderId
            ? { ...cur, output: { ...cur.output, patchedJobCount: jobCount } }
            : cur
        );
      }
      loadCurrentOrder();
    };

    const onJobResult = (data: {
      orderId: string;
      extensionId: string;
      patchedJobCount?: number;
      resultsCount?: number;
    }) => {
      if (data.extensionId !== extensionId) return;
      const jobCount = data.patchedJobCount ?? data.resultsCount;
      if (typeof jobCount === 'number') {
        setCurrentOrder((cur) =>
          cur?.orderId === data.orderId
            ? { ...cur, output: { ...cur.output, patchedJobCount: jobCount } }
            : cur
        );
      }
    };

    socketService.on('action:order_sent', onSent);
    socketService.on('action:result', onResult);
    socketService.on('action:job_result', onJobResult);

    return () => {
      socketService.off('action:order_sent', onSent);
      socketService.off('action:result', onResult);
      socketService.off('action:job_result', onJobResult);
    };
  }, [isConnected, extensionId, appendLog, loadCurrentOrder]);

  const currentOrderView = useMemo((): CurrentOrderView | null => {
    if (!currentOrder) return null;
    return {
      orderId: currentOrder.orderId,
      extensionId: currentOrder.extensionId,
      sitename: currentOrder.sitename,
      message: orderGrokMessage(currentOrder),
      status: currentOrder.status,
      patchedJobCount: jobCountFromOrder(currentOrder),
      error: currentOrder.error,
    };
  }, [currentOrder]);

  const orderBusy = !isConnected || loadingOrder;
  const isStopped = currentOrder?.status === 'stopped';
  const extensionOnline = Boolean(extension && extension.isOnline !== false);
  const activityLabel = extension ? getExtensionActivityLabel(extension) : null;
  const activityTone = extension ? getExtensionActivityTone(extension) : 'idle';

  const stopCurrentOrder = () => {
    if (!extensionId || !activeOrderId || !socketService.getConnectionStatus()) return;
    socketService.stopOrder(extensionId, activeOrderId);
    appendLog(makeLog('info', 'Pause requested'));
  };

  const resumeCurrentOrder = () => {
    if (!extensionId || !activeOrderId || !isStopped || !socketService.getConnectionStatus()) return;
    socketService.resumeOrder(extensionId, activeOrderId);
    appendLog(makeLog('info', 'Resume requested'));
  };

  const cancelCurrentOrder = () => {
    if (!extensionId || !activeOrderId || !socketService.getConnectionStatus()) return;
    socketService.cancelOrder(extensionId, activeOrderId);
    appendLog(makeLog('info', 'Cancel requested'));
  };

  const runOrder = () => {
    setError(null);
    if (!extensionId) return;
    if (!socketService.getConnectionStatus()) {
      setError('Dashboard is not connected to the server.');
      return;
    }
    if (!extensionOnline) {
      setError('This extension is offline. Open the browser extension and try again.');
      return;
    }
    socketService.sendIndeedOrder(extensionId, { query, location, sort, fromage });
    appendLog(makeLog('info', `Sending scrape: ${query} · ${location}`));
  };

  const runGrokOrder = () => {
    setGrokError(null);
    if (!extensionId) return;
    const text = grokMessage.trim();
    if (!text) {
      setGrokError('Enter a message to send to Grok.');
      return;
    }
    if (!socketService.getConnectionStatus()) {
      setGrokError('Dashboard is not connected to the server.');
      return;
    }
    if (!extensionOnline) {
      setGrokError('This extension is offline. Open the browser extension and try again.');
      return;
    }
    socketService.sendGrokOrder(extensionId, text);
    appendLog(makeLog('info', 'Grok order queued', text.length > 120 ? `${text.slice(0, 120)}…` : text));
  };

  if (!extensionId) {
    return (
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-12 text-center">
        <p className="text-slate-600">Invalid extension.</p>
        <Link to="/extensions" className="text-primary-600 text-sm mt-3 inline-block hover:underline">
          Back to extensions
        </Link>
      </main>
    );
  }

  const shortId = formatExtensionId(extensionId);
  const tabUrl = extension?.currentUrl?.trim();

  return (
    <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <Link
        to="/extensions"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition"
      >
        ← Extensions
      </Link>

      <header className="mt-4 pb-6 border-b border-slate-200">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight font-mono" title={extensionId}>
              {shortId}
            </h1>
            {extension && (
              <p className="text-xs text-slate-400 mt-1">
                Last seen {formatRelativeTime(extension.lastSeen)}
                {extension.version ? ` · v${extension.version}` : ''}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                extensionOnline
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                  : 'bg-slate-100 text-slate-500 ring-slate-500/20'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${extensionOnline ? 'bg-emerald-500' : 'bg-slate-300'}`}
              />
              {extensionOnline ? 'Online' : 'Offline'}
            </span>
            {activityLabel && (
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${activityToneClass[activityTone]}`}
              >
                {activityLabel}
              </span>
            )}
          </div>
        </div>

        {tabUrl ? (
          <p className="mt-4 text-sm text-slate-600">
            <span className="text-slate-400">Current tab · </span>
            <a
              href={tabUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline break-all"
            >
              {truncateUrl(tabUrl, 72)}
            </a>
          </p>
        ) : (
          <p className="mt-4 text-sm text-slate-400">No tab URL reported</p>
        )}
      </header>

      {!isConnected && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Dashboard disconnected from server. Reconnect to send orders.
        </div>
      )}

      <div className="mt-6 space-y-5">
        <CurrentOrderCard
          order={currentOrderView}
          disabled={orderBusy}
          onStop={stopCurrentOrder}
          onResume={isStopped ? resumeCurrentOrder : undefined}
          onCancel={cancelCurrentOrder}
        />

        <div className="flex rounded-lg border border-slate-200 bg-slate-50/80 p-1 gap-1">
          <button
            type="button"
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
              orderSection === 'grok'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setOrderSection('grok')}
          >
            Grok order
          </button>
          <button
            type="button"
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
              orderSection === 'indeed'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setOrderSection('indeed')}
          >
            Indeed scrape
          </button>
        </div>

        {orderSection === 'grok' ? (
          <GrokOrderPanel
            message={grokMessage}
            onMessageChange={setGrokMessage}
            onRun={runGrokOrder}
            disabled={!isConnected || !extensionOnline}
            busy={Boolean(currentOrder && ACTIVE_STATUSES.has(currentOrder.status))}
            error={grokError}
          />
        ) : (
          <IndeedScrapePanel
            query={query}
            location={location}
            sort={sort}
            fromage={fromage}
            onQueryChange={setQuery}
            onLocationChange={setLocation}
            onSortChange={setSort}
            onFromageChange={setFromage}
            onRun={runOrder}
            disabled={!isConnected || !extensionOnline}
            busy={Boolean(currentOrder && ACTIVE_STATUSES.has(currentOrder.status))}
            error={error}
          />
        )}

        <OrderLiveLog entries={logs} />
      </div>
    </main>
  );
};

export default ExtensionDetailPage;
