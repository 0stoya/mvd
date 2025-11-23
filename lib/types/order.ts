// lib/types/order.ts
export interface OrderRow {
  id: number;
  file_order_id: string;
  external_order_id: string | null;
  order_channel: string;
  store_code: string;
  status: string;

  magento_order_id: number | null;
  magento_increment_id: string | null;

  created_date: string; // ISO string from DB
  email: string | null;

  firstname: string | null;
  lastname: string | null;

  street: string | null;
  city: string | null;
  postcode: string | null;
  country_id: string | null;
  telephone: string | null;

  // Audit / automation
  imported_by: string | null;
  invoiced_at: string | null;
  shipped_at: string | null;
  import_job_id: number | null;
}

