// lib/api/jobs.ts
export type JobStatus = 'PENDING' | 'RUNNING' | 'RETRY' | 'FAILED' | 'DONE';

export interface Job {
  id: number;
  type: string;
  status: JobStatus;
  attempts: number;
  max_attempts: number;
  next_run_at: string | null;
  last_error: string | null;
  payload: any;
  created_at: string;
  updated_at: string;
}

export interface JobsResponse {
  data: Job[];
  pagination: {
    limit: number;
    offset: number;
    count: number;
  };
}

interface FetchJobsParams {
  status?: string;
  type?: string;
  orderId?: number;
  limit?: number;
  offset?: number;
}

const API_BASE =
  process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:4000';

export async function fetchJobs(
  params: FetchJobsParams = {}
): Promise<JobsResponse> {
  const url = new URL('/jobs', API_BASE);

  if (params.status) url.searchParams.set('status', params.status);
  if (params.type) url.searchParams.set('type', params.type);
  if (params.orderId) url.searchParams.set('orderId', String(params.orderId));
  if (params.limit) url.searchParams.set('limit', String(params.limit));
  if (params.offset) url.searchParams.set('offset', String(params.offset));

  const res = await fetch(url.toString(), { cache: 'no-store' });

  if (!res.ok) {
    throw new Error(`Failed to fetch jobs: ${res.status}`);
  }

  const json = await res.json();

  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SAFETY: guarantee correct shape
  //━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const data: Job[] = Array.isArray(json.data) ? json.data : [];
  const pagination = {
    limit: Number(json.pagination?.limit ?? params.limit ?? 50),
    offset: Number(json.pagination?.offset ?? params.offset ?? 0),
    count: Number(json.pagination?.count ?? data.length)
  };

  return { data, pagination };
}
