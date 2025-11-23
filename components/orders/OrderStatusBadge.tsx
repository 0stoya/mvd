'use client';

import { OrderRow } from '../../lib/types/order';

function deriveWorkflowStatus(order: OrderRow): { label: string; tone: string } {
  if (order.status === 'FAILED') {
    return { label: 'Failed', tone: 'bg-red-100 text-red-700' };
  }

  if (!order.magento_order_id) {
    return { label: 'Pending sync', tone: 'bg-amber-100 text-amber-700' };
  }

  if (order.magento_order_id && !order.invoiced_at) {
    return { label: 'Synced', tone: 'bg-blue-100 text-blue-700' };
  }

  if (order.invoiced_at && !order.shipped_at) {
    return { label: 'Invoiced', tone: 'bg-indigo-100 text-indigo-700' };
  }

  if (order.shipped_at) {
    return { label: 'Shipped', tone: 'bg-emerald-100 text-emerald-700' };
  }

  return { label: order.status, tone: 'bg-slate-100 text-slate-700' };
}

export default function OrderStatusBadge({ order }: { order: OrderRow }) {
  const { label, tone } = deriveWorkflowStatus(order);
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tone}`}
    >
      {label}
    </span>
  );
}
