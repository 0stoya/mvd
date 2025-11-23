'use client';

import Link from 'next/link';
import { OrderRow } from '../../lib/types/order';
import OrderStatusBadge from './OrderStatusBadge';
import { formatDateTime } from '../../lib/format';

interface Props {
  orders: OrderRow[];
}

export default function OrdersTable({ orders }: Props) {
  if (!orders.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 text-sm text-slate-600">
        No orders found yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
      <table className="min-w-full text-sm">
        <thead className="border-b bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium">ID</th>
            <th className="px-3 py-2 text-left font-medium">File Order</th>
            <th className="px-3 py-2 text-left font-medium">Channel</th>
            <th className="px-3 py-2 text-left font-medium">
              Magento Order #
            </th>
            <th className="px-3 py-2 text-left font-medium">Status</th>
            <th className="px-3 py-2 text-left font-medium">Created</th>
            <th className="px-3 py-2 text-left font-medium">Import</th>
            <th className="px-3 py-2 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr
              key={o.id}
              className="border-b last:border-b-0 hover:bg-slate-50"
            >
              <td className="px-3 py-2 text-slate-500">{o.id}</td>

              <td className="px-3 py-2">
                <Link
                  href={`/orders/${o.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {o.file_order_id}
                </Link>
              </td>

              <td className="px-3 py-2">{o.order_channel}</td>

              <td className="px-3 py-2">
                {o.magento_increment_id ||
                  o.magento_order_id?.toString() || (
                    <span className="text-slate-400">—</span>
                  )}
              </td>

              <td className="px-3 py-2">
                <OrderStatusBadge order={o} />
              </td>

              <td className="px-3 py-2 text-xs text-slate-500">
                {formatDateTime(o.created_date)}
              </td>

              {/* Import job link */}
              <td className="px-3 py-2 text-xs">
  {o.import_job_id ? (
    <Link
      href={`/imports/${o.import_job_id}`}
      className="text-blue-600 hover:underline"
    >
      Job #{o.import_job_id}
    </Link>
  ) : (
    <span className="text-slate-400">—</span>
  )}
</td>

              {/* Actions */}
              <td className="px-3 py-2 text-right text-xs space-x-2">
                <Link
                  href={`/orders/${o.id}`}
                  className="text-blue-600 hover:underline"
                >
                  View
                </Link>
                <Link
                  href={`/jobs?orderId=${o.id}&limit=25`}
                  className="text-slate-600 hover:underline"
                >
                  Jobs
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
