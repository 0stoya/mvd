export interface ImportProgress {
  total: number;
  synced: number;
  invoiced: number;
  shipped: number;
  failed: number;
}

export interface ImportRow {
  id: number;
  header_filename: string;
  items_filename: string;
  imported_by: string;
  total_orders: number;
  processed_orders: number;
  failed_orders: number;
  skipped_orders: number;

  // DB can store RUNNING while job is in-flight
  status: 'RUNNING' | 'DONE' | 'FAILED';
  error: string | null;

  job_id: number | null;

  created_at: string;
  updated_at: string;

  // New – hydrated from backend
  progress?: ImportProgress;
}
