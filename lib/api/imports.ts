// /lib/api/imports.ts
import { ImportRow } from '../types/import';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export interface ImportsResponse {
  data: ImportRow[];
  pagination: {
    limit: number;
    offset: number;
    count: number;
  };
}

export interface FetchImportsParams {
  jobId?: number;
  limit?: number;
  offset?: number;
}

// Fetch imports with optional jobId + pagination
export async function fetchImports(
  params: FetchImportsParams = {}
): Promise<ImportsResponse> {
  const url = new URL('/imports', API_BASE_URL);

  if (params.jobId) url.searchParams.set('jobId', String(params.jobId));
  if (params.limit) url.searchParams.set('limit', String(params.limit));
  if (params.offset) url.searchParams.set('offset', String(params.offset));

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch imports: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();

  const data = Array.isArray(json.data) ? (json.data as ImportRow[]) : [];
  const pagination = {
    limit: Number(json.pagination?.limit ?? params.limit ?? 50),
    offset: Number(json.pagination?.offset ?? params.offset ?? 0),
    count: Number(json.pagination?.count ?? data.length)
  };

  return { data, pagination };
}

export interface UploadImportResult {
  importId: number | null;
  jobId: number | null;
  summary: {
    totalOrders: number;
    processedOrders: number;
    skippedOrders: number;
    failedOrders: number;
  };
  failures: any[];
}

export interface ImportedOrder {
  id: number;
  order_number: string;
  file_order_id?: string;
  status: string;
  import_job_id: number | null;
  created_at: string;
  magento_order_id?: number | null;
  magento_increment_id?: string | null;
  magento_status?: string | null;
  order_status?: string | null;
}

export interface ImportDetailResponse {
  import: ImportRow;
  orders: ImportedOrder[];
}

export async function fetchImportDetail(
  id: number
): Promise<ImportDetailResponse> {
  const res = await fetch(`${API_BASE_URL}/imports/${id}`, {
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error(
      `Failed to fetch import detail: ${res.status} ${res.statusText}`
    );
  }

  return (await res.json()) as ImportDetailResponse;
}

// Optional helper if/when you need to group imported orders by job
export function groupOrdersByJob(orders: ImportedOrder[]) {
  return orders.reduce<Record<string, ImportedOrder[]>>((acc, order) => {
    const key = order.import_job_id ? String(order.import_job_id) : 'no-job';
    if (!acc[key]) acc[key] = [];
    acc[key].push(order);
    return acc;
  }, {});
}

/* ─────────────────────────────────────────────────────────────
 * PREVIEW + UPLOAD via Next.js API (SSO-aware)
 * ──────────────────────────────────────────────────────────── */

export interface ImportPreviewIssue {
  type: string; // 'SKU_NOT_FOUND' | 'NOT_ENOUGH_STOCK' | 'INVALID_QTY' | ...
  sku: string;
  rowIndex: number | null;
  message: string;
}

export interface ImportPreviewResult {
  headerFilename: string;
  itemsFilename: string;
  totalOrders: number;
  totalItemRows: number;
  validationOk: boolean;
  issues: ImportPreviewIssue[];
}

export async function uploadImport(params: {
  headerFile: File;
  itemsFile: File;
  importedBy: string;
}): Promise<UploadImportResult> {
  const form = new FormData();
  // keep field names as your backend expects
  form.append('header', params.headerFile);
  form.append('items', params.itemsFile);
  // still send importedBy, but server will override from SSO
  form.append('importedBy', params.importedBy);

  // 🔁 Now goes through Next.js API (SSO + secret + proxy)
  const res = await fetch('/api/imports', {
    method: 'POST',
    body: form
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `Import failed: ${res.status} ${res.statusText} ${text || ''}`
    );
  }

  return (await res.json()) as UploadImportResult;
}

/**
 * Upload header + items CSV for preview only.
 * Backend should:
 *  - read the CSVs
 *  - validate SKUs + stock
 *  - return summary + issues
 * It must NOT create orders, jobs or import records.
 */
export async function previewImportUpload(params: {
  headerFile: File;
  itemsFile: File;
  importedBy: string;
}): Promise<ImportPreviewResult> {
  const form = new FormData();
  form.append('header', params.headerFile);
  form.append('items', params.itemsFile);
  form.append('importedBy', params.importedBy);

  const res = await fetch('/api/imports/preview', {
    method: 'POST',
    body: form
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `Import preview failed: ${res.status} ${res.statusText} ${text || ''}`
    );
  }

  return (await res.json()) as ImportPreviewResult;
}
