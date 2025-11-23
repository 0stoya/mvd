'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Job } from '@/lib/api/jobs';

interface JobsTableClientProps {
  jobs: Job[];
}

type JobStatus = Job['status'];

function statusClass(status: JobStatus): string {
  switch (status) {
    case 'FAILED':
      return 'inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800';
    case 'DONE':
      return 'inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800';
    case 'RUNNING':
      return 'inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800';
    case 'RETRY':
      return 'inline-flex rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800';
    default:
      return 'inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800';
  }
}

function formatDate(value: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function extractOrderId(job: Job): number | null {
  if (!job.payload) return null;
  if (typeof job.payload === 'string') {
    try {
      const parsed = JSON.parse(job.payload);
      return parsed.order_id ?? null;
    } catch {
      return null;
    }
  }
  return job.payload.order_id ?? null;
}

interface RetryModalProps {
  job: Job | null;
  open: boolean;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

function RetryJobModal({
  job,
  open,
  loading,
  error,
  onClose,
  onConfirm,
}: RetryModalProps) {
  if (!open || !job) return null;

  const modalContent = (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold">Retry job #{job.id}?</h2>
        <p className="mt-2 text-sm text-gray-700">
          Type:{' '}
          <span className="font-mono text-xs bg-gray-50 px-1 py-0.5 rounded">
            {job.type}
          </span>
          <br />
          Current status:{' '}
          <span className="font-semibold">{job.status}</span>
        </p>
        {job.last_error && (
          <p className="mt-2 text-xs text-red-600 whitespace-pre-wrap max-h-32 overflow-auto border border-red-100 rounded p-2 bg-red-50">
            {job.last_error}
          </p>
        )}

        {error && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-900 disabled:opacity-60"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Retrying…' : 'Retry job'}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return modalContent;
  return createPortal(modalContent, document.body);
}

type ToastState =
  | { type: 'success'; message: string }
  | { type: 'error'; message: string }
  | null;

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  if (!toast) return null;

  const baseClasses =
    'fixed bottom-4 right-4 z-50 max-w-sm rounded-md px-3 py-2 text-xs shadow-lg flex items-start gap-2';
  const colorClasses =
    toast.type === 'success'
      ? 'bg-green-50 text-green-800 border border-green-200'
      : 'bg-red-50 text-red-800 border border-red-200';

  const label = toast.type === 'success' ? 'Success' : 'Error';

  return (
    <div className={`${baseClasses} ${colorClasses}`}>
      <div className="font-semibold">{label}</div>
      <div className="flex-1">{toast.message}</div>
      <button
        type="button"
        onClick={onClose}
        className="ml-2 text-[10px] uppercase tracking-wide"
      >
        ×
      </button>
    </div>
  );
}

export function JobsTableClient({ jobs }: JobsTableClientProps) {
  // local copy for optimistic updates
  const [rows, setRows] = useState<Job[]>(jobs);
  const [retryJobTarget, setRetryJobTarget] = useState<Job | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [retryLoading, setRetryLoading] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const handleRetryClick = (job: Job) => {
    setRetryJobTarget(job);
    setRetryError(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (retryLoading) return;
    setModalOpen(false);
    setRetryJobTarget(null);
    setRetryError(null);
  };

  const scheduleToastClear = () => {
    // simple auto-hide after 3s
    window.setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleConfirmRetry = async () => {
    if (!retryJobTarget) return;

    setRetryLoading(true);
    setRetryError(null);

    try {
      const base =
        process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:4000';

      const res = await fetch(`${base}/jobs/${retryJobTarget.id}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(
          text || `Failed to retry job (status ${res.status.toString()})`
        );
      }

      // Optimistic update: mark job as PENDING (or RETRY depending on your backend semantics)
      setRows((prev) =>
        prev.map((row) =>
          row.id === retryJobTarget.id
            ? {
                ...row,
                status: 'PENDING', // 👈 adjust if your API sets something else
                last_error: null,
                attempts: row.attempts + 1, // optional
              }
            : row
        )
      );

      setToast({
        type: 'success',
        message: `Job #${retryJobTarget.id} queued for retry.`,
      });
      scheduleToastClear();

      setModalOpen(false);
      setRetryJobTarget(null);
    } catch (err: any) {
      const message = err?.message ?? 'Failed to retry job';
      setRetryError(message);
      setToast({ type: 'error', message });
      scheduleToastClear();
    } finally {
      setRetryLoading(false);
    }
  };

  return (
    <>
      <tbody className="divide-y divide-gray-100 bg-white">
        {rows.length === 0 && (
          <tr>
            <td
              colSpan={8}
              className="px-3 py-6 text-center text-sm text-gray-500"
            >
              No jobs found.
            </td>
          </tr>
        )}

        {rows.map((job) => {
          const orderId = extractOrderId(job);

          return (
            <tr key={job.id}>
              <td className="px-3 py-2 whitespace-nowrap">{job.id}</td>
              <td className="px-3 py-2 whitespace-nowrap font-mono text-xs">
                {job.type}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <span className={statusClass(job.status)}>{job.status}</span>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {job.attempts}/{job.max_attempts}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {orderId ? (
                  <a
                    href={`/orders/${orderId}`}
                    className="text-blue-600 hover:underline"
                  >
                    #{orderId}
                  </a>
                ) : (
                  <span className="text-gray-400">–</span>
                )}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {formatDate(job.updated_at)}
              </td>
              <td className="px-3 py-2 max-w-xs">
                {job.last_error ? (
                  <span className="line-clamp-2 text-xs text-red-600">
                    {job.last_error}
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">–</span>
                )}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-right">
                {job.status === 'FAILED' ? (
                  <button
                    type="button"
                    onClick={() => handleRetryClick(job)}
                    className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Retry
                  </button>
                ) : (
                  <span className="text-gray-300 text-xs">—</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>

      <RetryJobModal
        job={retryJobTarget}
        open={modalOpen}
        loading={retryLoading}
        error={retryError}
        onClose={handleCloseModal}
        onConfirm={handleConfirmRetry}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
