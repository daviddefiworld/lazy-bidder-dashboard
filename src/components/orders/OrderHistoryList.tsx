import React from 'react';
import type { ActionOrder } from '../../types/actionOrder';
import { formatDate, getOrderStatusColor } from '../../utils/formatters';
import { orderGrokMessage, orderIndeedSummary, orderPatchedJobCount } from '../../utils/orderUtils';

interface OrderHistoryListProps {
  activeOrders: ActionOrder[];
  stoppedOrders?: ActionOrder[];
  pastOrders: ActionOrder[];
  loading: boolean;
  selectedOrderId?: string | null;
  onSelectOrder?: (orderId: string) => void;
}

const OrderRow: React.FC<{
  order: ActionOrder;
  highlight?: boolean;
  onClick?: () => void;
}> = ({ order, highlight, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full text-left py-2.5 px-2 rounded-lg transition ${
      highlight ? 'bg-primary-50 ring-1 ring-primary-200' : 'hover:bg-slate-50'
    }`}
  >
    <div className="flex items-center justify-between gap-2">
      <span className="font-mono text-xs text-slate-800">{order.orderId.slice(0, 10)}…</span>
      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ring-1 ring-inset ${getOrderStatusColor(order.status)}`}>
        {order.status}
      </span>
    </div>
    <p className="text-[11px] text-slate-500 mt-1">
      {order.sitename === 'grok' ? (
        <>
          {(orderGrokMessage(order) ?? '—').slice(0, 48)}
          {(orderGrokMessage(order)?.length ?? 0) > 48 ? '…' : ''}
        </>
      ) : (
        <>
          {orderPatchedJobCount(order)} jobs · {orderIndeedSummary(order)}
        </>
      )}{' '}
      · {order.createdAt ? formatDate(order.createdAt) : '—'}
    </p>
    {order.error && <p className="text-[11px] text-red-600 mt-1 line-clamp-2">{order.error}</p>}
  </button>
);

const OrderHistoryList: React.FC<OrderHistoryListProps> = ({
  activeOrders,
  stoppedOrders = [],
  pastOrders,
  loading,
  selectedOrderId,
  onSelectOrder,
}) => {
  if (loading) {
    return <p className="text-sm text-slate-400 py-4 text-center">Loading…</p>;
  }

  return (
    <div className="space-y-4 max-h-[420px] overflow-y-auto log-scroll pr-1">
      {activeOrders.length > 0 && (
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-blue-600 mb-2">Running now</h3>
          <ul className="space-y-1">
            {activeOrders.map((order) => (
              <li key={order.orderId}>
                <OrderRow
                  order={order}
                  highlight={selectedOrderId === order.orderId}
                  onClick={() => onSelectOrder?.(order.orderId)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {stoppedOrders.length > 0 && (
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wide text-orange-600 mb-2">
            Stopped
          </h3>
          <ul className="space-y-1">
            {stoppedOrders.map((order) => (
              <li key={order.orderId}>
                <OrderRow
                  order={order}
                  highlight={selectedOrderId === order.orderId}
                  onClick={() => onSelectOrder?.(order.orderId)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">
          History ({pastOrders.length})
        </h3>
        {pastOrders.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-2">No past orders</p>
        ) : (
          <ul className="space-y-1">
            {pastOrders.map((order) => (
              <li key={order.orderId}>
                <OrderRow
                  order={order}
                  highlight={selectedOrderId === order.orderId}
                  onClick={() => onSelectOrder?.(order.orderId)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryList;
