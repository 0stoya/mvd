import { apiFetch } from './client';
import { OrderRow } from '../types/order';

export async function fetchOrders(params: {
  status?: string;
  channel?: string;
} = {}): Promise<OrderRow[]> {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.channel) search.set('channel', params.channel);

  const qs = search.toString();
  const path = '/orders' + (qs ? `?${qs}` : '');

  return apiFetch<OrderRow[]>(path);
}

export async function fetchOrderDetail(id: number): Promise<{
  order: OrderRow;
  items: any[];
}> {
  return apiFetch(`/orders/${id}`);
}