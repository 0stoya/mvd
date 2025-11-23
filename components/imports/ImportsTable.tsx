'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ImportRow, ImportProgress } from '../../lib/types/import';
import { formatDateTime } from '../../lib/format';

interface Props {
  imports: ImportRow[];
}

/* ────────────────────────────────────────────── */
/* Status helpers (Logic Unchanged)              */
/* ────────────────────────────────────────────── */

type PipelineStatus = 'PROCESSING' | 'DONE' | 'FAILED';

function statusClass(status: PipelineStatus): string {
  switch (status) {
    case 'FAILED':
      return 'inline-flex items-center gap-1.5 rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10';
    case 'DONE':
      return 'inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20';
    case 'PROCESSING':
    default:
      return 'inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10';
  }
}

function StatusIcon({ status }: { status: PipelineStatus }) {
  if (status === 'FAILED') {
    return (
      <svg className="h-1.5 w-1.5 fill-current" viewBox="0 0 6 6" aria-hidden="true">
        <circle cx="3" cy="3" r="3" />
      </svg>
    );
  }
  if (status === 'DONE') {
    return (
      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    );
  }
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
    </span>
  );
}

function derivePipelineStatus(imp: ImportRow): PipelineStatus {
  const progress = imp.progress as ImportProgress | undefined;

  // Hard failure
  if (
    imp.status === 'FAILED' ||
    imp.failed_orders > 0 ||
    (progress && progress.failed > 0)
  ) {
    return 'FAILED';
  }

  const total = progress?.total ?? imp.total_orders;

  if (!progress || !total || total <= 0) {
    return 'PROCESSING';
  }

  const allSynced = progress.synced >= total;
  const allInvoiced = progress.invoiced >= total;
  const allShipped = progress.shipped >= total;

  if (allSynced && allInvoiced && allShipped) {
    return 'DONE';
  }

  return 'PROCESSING';
}

function formatPercent(part: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.round((part / total) * 100);
}

/* ────────────────────────────────────────────── */
/* UI Components                                 */
/* ────────────────────────────────────────────── */

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
    </svg>
  );
}

function ProgressBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = formatPercent(value, total);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">
          <span className="font-mono font-medium text-slate-900">{value}</span>
          <span className="text-slate-400 mx-1">/</span>
          {total}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ProgressDetails({ progress }: { progress: ImportProgress }) {
  const { total, synced, invoiced, shipped, failed } = progress;

  if (!total || total <= 0) {
    return <div className="text-xs italic text-slate-400">No orders linked to this import yet.</div>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-4">
      <div className="space-y-4 md:col-span-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Summary</div>
        <div className="space-y-1">
            <div className="text-2xl font-bold text-slate-900">{total}</div>
            <div className="text-xs text-slate-500">Total Orders</div>
        </div>
        {failed > 0 && (
             <div className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                {failed} Failed
             </div>
        )}
      </div>
      
      <div className="grid gap-4 md:col-span-3 md:grid-cols-3">
        <ProgressBar label="Synced" value={synced} total={total} color="bg-sky-500" />
        <ProgressBar label="Invoiced" value={invoiced} total={total} color="bg-emerald-500" />
        <ProgressBar label="Shipped" value={shipped} total={total} color="bg-teal-500" />
      </div>
    </div>
  );
}

export default function ImportsTable({ imports }: Props) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (!imports.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
        <div className="mb-3 rounded-full bg-white p-3 shadow-sm ring-1 ring-slate-200">
           <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
           </svg>
        </div>
        <p className="text-sm font-semibold text-slate-900">No imports found</p>
        <p className="mt-1 text-xs text-slate-500">Upload a CSV to start your first run.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ring-1 ring-black/5">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Import ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Orders</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Progress</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Timestamps</th>
              <th className="w-10 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {imports.map((imp) => {
              const progress = imp.progress as ImportProgress | undefined;
              const isExpandable = !!progress && progress.total > 0;
              const isExpanded = expandedId === imp.id;
              const pipelineStatus = derivePipelineStatus(imp);

              const handleRowClick = () => {
                router.push(`/imports/${imp.id}`);
              };

              const toggleExpand = (e: React.MouseEvent) => {
                e.stopPropagation();
                if (!isExpandable) return;
                setExpandedId((prev) => (prev === imp.id ? null : imp.id));
              };

              return (
                <>
                  <tr
                    key={imp.id}
                    className="group cursor-pointer transition-colors hover:bg-slate-50/80"
                    onClick={handleRowClick}
                  >
                    {/* ID & Job Context */}
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-col">
                        <span className="font-mono text-sm font-medium text-slate-900">#{imp.id}</span>
                        {imp.job_id && (
                          <Link
                            href={`/imports?jobId=${imp.job_id}`}
                            className="mt-1 inline-flex items-center text-xs text-slate-500 hover:text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Job #{imp.job_id}
                          </Link>
                        )}
                        <span className="mt-1 text-[11px] text-slate-400">by {imp.imported_by}</span>
                      </div>
                    </td>

                    {/* Orders Summary (Simplified Visuals) */}
                    <td className="px-4 py-4 align-top">
                        <div className="flex flex-col">
                            <div className="flex items-baseline gap-1">
                                <span className="text-sm font-semibold text-slate-900">{imp.processed_orders}</span>
                                <span className="text-xs text-slate-400">/</span>
                                <span className="text-sm text-slate-600">{imp.total_orders}</span>
                            </div>
                            <span className="text-[10px] uppercase tracking-wide text-slate-400">Processed</span>
                            
                            {imp.failed_orders > 0 && (
                                <span className="mt-1 text-xs font-medium text-red-600">
                                    {imp.failed_orders} Failed
                                </span>
                            )}
                        </div>
                    </td>

                    {/* Compact Stacked Progress Bar */}
                    <td className="w-1/4 px-4 py-4 align-top">
                      {progress && progress.total > 0 ? (
                        <div className="flex flex-col gap-2">
                           {/* Stacked Bar */}
                          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-900/5">
                            <div
                                className="bg-teal-500"
                                style={{ width: `${formatPercent(progress.shipped, progress.total)}%` }}
                                title={`Shipped: ${progress.shipped}`}
                            />
                            <div
                                className="bg-emerald-500"
                                style={{ width: `${formatPercent(progress.invoiced - progress.shipped, progress.total)}%` }}
                                title={`Invoiced: ${progress.invoiced}`}
                            />
                            <div
                                className="bg-sky-500"
                                style={{ width: `${formatPercent(progress.synced - progress.invoiced, progress.total)}%` }}
                                title={`Synced: ${progress.synced}`}
                            />
                          </div>
                          {/* Legend / Helper Text */}
                          <div className="flex items-center gap-3 text-[10px] font-medium text-slate-500">
                              <span className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-sky-500"></div>{formatPercent(progress.synced, progress.total)}% Sync</span>
                              <span className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>{formatPercent(progress.invoiced, progress.total)}% Inv</span>
                              <span className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-teal-500"></div>{formatPercent(progress.shipped, progress.total)}% Ship</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Pending...</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-4 align-top">
                      <span className={statusClass(pipelineStatus)}>
                        <StatusIcon status={pipelineStatus} />
                        {pipelineStatus}
                      </span>
                    </td>

                    {/* Timestamps */}
                    <td className="px-4 py-4 align-top">
                       <div className="flex flex-col gap-1 text-xs text-slate-500">
                          <div>
                            <span className="block text-[10px] uppercase text-slate-400">Created</span>
                            {formatDateTime(imp.created_at)}
                          </div>
                          {imp.updated_at !== imp.created_at && (
                             <div>
                                <span className="block text-[10px] uppercase text-slate-400">Updated</span>
                                {formatDateTime(imp.updated_at)}
                            </div>
                          )}
                       </div>
                    </td>
                    
                    {/* Explicit Expand Button */}
                    <td className="px-4 py-4 align-middle text-right">
                        {isExpandable && (
                            <button
                                onClick={toggleExpand}
                                className={`rounded-full p-1 transition-all hover:bg-slate-200 ${
                                    isExpanded ? 'rotate-180 bg-slate-100 text-slate-900' : 'text-slate-400'
                                }`}
                            >
                                <ChevronDownIcon className="h-5 w-5" />
                            </button>
                        )}
                    </td>
                  </tr>

                  {/* Expanded View */}
                  {isExpanded && progress && (
                    <tr key={`${imp.id}-expanded`}>
                      <td colSpan={6} className="bg-slate-50/50 px-4 pb-4 pt-0 shadow-inner">
                        <div className="ml-4 rounded-b-xl border-x border-b border-slate-200 bg-white p-6 shadow-sm">
                           <ProgressDetails progress={progress} />
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}