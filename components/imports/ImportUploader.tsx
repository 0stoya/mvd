// components/imports/ImportUploader.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  uploadImport,
  previewImportUpload,
  ImportPreviewResult,
  UploadImportResult
} from '../../lib/api/imports';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/* ─────────────────────────────────────────────────────────────────────────────
   1. ICONS (Zero-dependency SVGs)
   ───────────────────────────────────────────────────────────────────────────── */
const Icons = {
  Upload: () => (
    <svg
      className="h-8 w-8 text-slate-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
      />
    </svg>
  ),
  File: () => (
    <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
        clipRule="evenodd"
      />
    </svg>
  ),
  Check: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  Alert: () => (
    <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  ),
  XCircle: () => (
    <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
        clipRule="evenodd"
      />
    </svg>
  ),
  Refresh: () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  ),
  Download: () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  )
};

/* ─────────────────────────────────────────────────────────────────────────────
   2. SUB-COMPONENTS (Left Panel & Utilities)
   ───────────────────────────────────────────────────────────────────────────── */

function TemplateDownloadCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-blue-50 text-blue-600">
        <Icons.Download />
      </div>
      <div>
        <div className="text-xs font-semibold text-slate-900">{title}</div>
        <div className="text-[10px] text-slate-500">{subtitle}</div>
      </div>
    </button>
  );
}

function RecentActivityMock() {
  const recents: { id: number; status: 'DONE' | 'FAILED'; time: string }[] = [
    { id: 104, status: 'DONE', time: '10m ago' },
    { id: 103, status: 'FAILED', time: '2h ago' },
    { id: 102, status: 'DONE', time: 'Yesterday' }
  ];
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        Recent Activity MOCKup
      </h3>
      <div className="space-y-3">
        {recents.map((r) => (
          <div key={r.id} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  r.status === 'DONE' ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              />
              <span className="font-medium text-slate-700">Import #{r.id}</span>
            </div>
            <div className="text-slate-400">{r.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface FileDropzoneProps {
  label: string;
  file: File | null;
  isActive: boolean;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onClick: () => void;
  isValidated?: boolean;
  busy?: boolean;
}

const FileDropzone: React.FC<FileDropzoneProps> = ({
  label,
  file,
  isActive,
  onDrop,
  onDragEnter,
  onDragLeave,
  onClick,
  isValidated,
  busy
}) => {
  if (file) {
    return (
      <div className="relative flex h-32 flex-col justify-between rounded-xl border border-blue-100 bg-blue-50/50 p-4 transition-all">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-blue-100">
            <Icons.File />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{file.name}</p>
            <p className="text-xs text-slate-500">
              {(file.size / 1024).toFixed(1)} KB • {label}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onClick}
            disabled={busy}
            className="text-[11px] font-medium text-blue-600 hover:underline disabled:opacity-50"
          >
            Replace file
          </button>
          {isValidated && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
              <Icons.Check /> Valid
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={onDrop}
      onClick={onClick}
      className={`group flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200
        ${
          isActive
            ? 'border-blue-400 bg-blue-50 ring-4 ring-blue-100'
            : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'
        }`}
    >
      <Icons.Upload />
      <p className="mt-2 text-xs font-medium text-slate-600 group-hover:text-slate-900">
        Click or drop <span className="font-bold">{label}</span>
      </p>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   3. MAIN COMPONENT
   ───────────────────────────────────────────────────────────────────────────── */

type ImportStep = 'idle' | 'previewing' | 'previewed' | 'importing' | 'done';

export default function ImportUploader() {
  const { data: session } = useSession();
  const router = useRouter();

  // ── State ──
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  const [itemsFile, setItemsFile] = useState<File | null>(null);
  const [importedBy, setImportedBy] = useState<string>('');

  const [headerDragActive, setHeaderDragActive] = useState(false);
  const [itemsDragActive, setItemsDragActive] = useState(false);

  const [step, setStep] = useState<ImportStep>('idle');
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [result, setResult] = useState<UploadImportResult | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [forceRun, setForceRun] = useState(false);

  const busy = step === 'previewing' || step === 'importing';
  const canPreview = !!headerFile && !!itemsFile;

  // ── Effects ──
  useEffect(() => {
    if (session?.user?.email && !importedBy) {
      setImportedBy(session.user.email);
    }
  }, [session, importedBy]);

  // ── Helpers ──
  const resetStateOnNewFile = () => {
    setPreview(null);
    setResult(null);
    setStep('idle');
    setError(null);
    setForceRun(false);
  };

  const resetAll = () => {
    setHeaderFile(null);
    setItemsFile(null);
    setImportedBy(session?.user?.email || '');
    resetStateOnNewFile();
  };

  // ── Handlers ──
  const handleFileChange = (type: 'header' | 'items', file: File | null) => {
    if (type === 'header') setHeaderFile(file);
    else setItemsFile(file);
    resetStateOnNewFile();
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    type: 'header' | 'items'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === 'header') setHeaderDragActive(false);
    else setItemsDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange(type, file);
  };

  const extractErrorMessage = (e: unknown, fallback: string): string => {
    if (e instanceof Error && e.message) return e.message;
    if (typeof e === 'string') return e;
    // If your API error shape has something like e.response.data.error, you can extend this here.
    return fallback;
  };

  const handlePreview = async () => {
    if (!headerFile || !itemsFile) return;
    setError(null);
    setPreview(null);
    setResult(null);
    setStep('previewing');

    try {
      const previewResult = await previewImportUpload({
        headerFile,
        itemsFile,
        importedBy: importedBy || 'Dashboard'
      });
      setPreview(previewResult);
      setStep('previewed');
    } catch (e: unknown) {
      console.error('Preview failed', e);
      setError(extractErrorMessage(e, 'Preview failed'));
      setStep('idle');
    }
  };

  const handleRunImport = async () => {
    if (!headerFile || !itemsFile || !preview) return;

    if (!preview.validationOk && !forceRun) {
      setError(
        'Preview found issues. Enable "Run anyway" if you really want to force the import.'
      );
      return;
    }

    setError(null);
    setStep('importing');

    try {
      const importResult = await uploadImport({
        headerFile,
        itemsFile,
        importedBy: importedBy || 'Dashboard'
      });
      setResult(importResult);
      setStep('done');
      router.refresh();
    } catch (e: unknown) {
      console.error('Import failed', e);
      setError(extractErrorMessage(e, 'Import failed'));
      setStep('previewed');
    }
  };

  /* ─────────────────────────────────────────────────────────────────────────────
     RENDER
     ───────────────────────────────────────────────────────────────────────────── */
  return (
    <div className="grid min-h-[600px] grid-cols-1 gap-8 lg:grid-cols-12">
      {/* ── LEFT PANEL: Context & Tools (Span 4) ── */}
      <div className="space-y-6 lg:col-span-4 lg:pr-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Import Data</h1>
          <p className="mt-2 text-sm text-slate-500">
            Upload CSV files to sync orders. Ensure your files match the required schema.
          </p>
        </div>

        {/* Templates */}
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase text-slate-400">Templates</div>
          <TemplateDownloadCard title="Header Template" subtitle="headers_v2.csv" />
          <TemplateDownloadCard title="Items Template" subtitle="items_v2.csv" />
        </div>

        {/* Requirements */}
        <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-800">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            Constraints
          </div>
          <ul className="mt-2 space-y-1.5 pl-1 text-[11px] text-blue-700/80">
            <li>• Max file size: 50MB per file</li>
            <li>• Dates must be ISO 8601 format</li>
            <li>• SKUs must exist in Magento catalog</li>
          </ul>
        </div>

        <RecentActivityMock />
      </div>

      {/* ── RIGHT PANEL: Workspace (Span 8) ── */}
      <div className="lg:col-span-8">
        <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40">
          {/* Header */}
          <div className="border-b border-slate-100 px-8 py-6">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-slate-900">
                {step === 'done' ? 'Import Complete' : 'New Run Configuration'}
              </span>
              {/* Stepper Pill */}
              <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                <span className={step === 'idle' ? 'text-blue-600 font-bold' : ''}>
                  1. Upload
                </span>
                <span className="text-slate-300">/</span>
                <span
                  className={
                    step === 'previewing' || step === 'previewed'
                      ? 'text-blue-600 font-bold'
                      : ''
                  }
                >
                  2. Validate
                </span>
                <span className="text-slate-300">/</span>
                <span
                  className={
                    step === 'importing' || step === 'done'
                      ? 'text-blue-600 font-bold'
                      : ''
                  }
                >
                  3. Run
                </span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 p-8">
            {/* SUCCESS STATE */}
            {result && (
              <div className="animate-in fade-in slide-in-from-top-4 rounded-xl border border-emerald-100 bg-emerald-50 p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-emerald-100 p-2 text-emerald-600">
                    <Icons.Check />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-emerald-900">Import Successful</h3>
                    <div className="mt-1 text-xs text-emerald-800">
                      Import <strong>#{result.importId}</strong> created.
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4 border-t border-emerald-200/60 pt-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-emerald-900">
                          {result.summary.totalOrders}
                        </div>
                        <div className="text-[10px] uppercase text-emerald-700">Total</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-emerald-900">
                          {result.summary.processedOrders}
                        </div>
                        <div className="text-[10px] uppercase text-emerald-700">Processed</div>
                      </div>
                      <div>
                        <div
                          className={`text-lg font-bold ${
                            result.summary.failedOrders > 0
                              ? 'text-red-600'
                              : 'text-emerald-900'
                          }`}
                        >
                          {result.summary.failedOrders}
                        </div>
                        <div className="text-[10px] uppercase text-emerald-700">Failed</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* WORKSPACE (If not done) */}
            {!result && (
              <div className="flex flex-col gap-6">
                {/* Dropzones */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <input
                      id="header-file"
                      type="file"
                      accept=".csv"
                      onChange={(e) =>
                        handleFileChange('header', e.target.files?.[0] ?? null)
                      }
                      disabled={busy}
                      className="hidden"
                    />
                    <FileDropzone
                      label="Header CSV"
                      file={headerFile}
                      isActive={headerDragActive}
                      onDragEnter={() => setHeaderDragActive(true)}
                      onDragLeave={() => setHeaderDragActive(false)}
                      onDrop={(e) => handleDrop(e, 'header')}
                      onClick={() =>
                        document.getElementById('header-file')?.click()
                      }
                      isValidated={preview?.validationOk}
                      busy={busy}
                    />
                  </div>
                  <div>
                    <input
                      id="items-file"
                      type="file"
                      accept=".csv"
                      onChange={(e) =>
                        handleFileChange('items', e.target.files?.[0] ?? null)
                      }
                      disabled={busy}
                      className="hidden"
                    />
                    <FileDropzone
                      label="Items CSV"
                      file={itemsFile}
                      isActive={itemsDragActive}
                      onDragEnter={() => setItemsDragActive(true)}
                      onDragLeave={() => setItemsDragActive(false)}
                      onDrop={(e) => handleDrop(e, 'items')}
                      onClick={() =>
                        document.getElementById('items-file')?.click()
                      }
                      isValidated={preview?.validationOk}
                      busy={busy}
                    />
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-900">
                    <Icons.XCircle />
                    <p className="font-medium">{error}</p>
                  </div>
                )}

                {/* Validation Console */}
                {preview && (
                  <div className="animate-in slide-in-from-bottom-2 rounded-xl border border-slate-200 bg-slate-50">
                    <div
                      className={`flex items-center justify-between rounded-t-xl border-b px-4 py-3 ${
                        preview.validationOk
                          ? 'bg-emerald-50 border-emerald-100'
                          : 'bg-amber-50 border-amber-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {preview.validationOk ? (
                          <div className="text-emerald-500">
                            <Icons.Check />
                          </div>
                        ) : (
                          <Icons.Alert />
                        )}
                        <span
                          className={`text-sm font-semibold ${
                            preview.validationOk
                              ? 'text-emerald-900'
                              : 'text-amber-900'
                          }`}
                        >
                          {preview.validationOk
                            ? 'Validation Passed'
                            : 'Validation Issues Found'}
                        </span>
                      </div>
                      <div className="text-xs opacity-70">
                        {preview.totalOrders} orders · {preview.totalItemRows} items
                      </div>
                    </div>

                    <div className="p-4">
                      {preview.issues.length > 0 ? (
                        <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
                          <ul className="space-y-1">
                            {preview.issues.map((issue, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-3 rounded p-2 hover:bg-slate-50"
                              >
                                <span className="mt-0.5 inline-flex h-5 items-center rounded bg-slate-800 px-1.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                  {issue.type}
                                </span>
                                <div className="text-xs text-slate-600">
                                  <span className="mr-1 font-mono font-medium text-slate-900">
                                    {issue.rowIndex != null
                                      ? `Row ${issue.rowIndex}`
                                      : 'General'}
                                    {issue.sku && ` [${issue.sku}]`}
                                  </span>
                                  {issue.message}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-center text-xs italic text-slate-500">
                          No errors or warnings detected.
                        </p>
                      )}
                    </div>

                    {/* Force Run Toggle */}
                    {!preview.validationOk && (
                      <div className="rounded-b-xl border-t border-amber-200 bg-amber-50/50 px-4 py-3">
                        <label className="flex cursor-pointer select-none items-start gap-3">
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                            checked={forceRun}
                            onChange={(e) => setForceRun(e.target.checked)}
                            disabled={busy}
                          />
                          <div>
                            <span className="block text-xs font-bold text-amber-800">
                              Force Import Run
                            </span>
                            <span className="block text-[11px] text-amber-700">
                              Ignore validation errors and attempt to process valid rows
                              anyway.
                            </span>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="rounded-b-2xl border-t border-slate-100 bg-slate-50 px-8 py-5">
            {!result ? (
              <div className="flex flex-col-reverse items-center justify-between gap-4 sm:flex-row">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-500">
                    {importedBy ? importedBy.charAt(0).toUpperCase() : '?'}
                  </span>
                  <span>
                    Importing as{' '}
                    <span className="font-medium text-slate-700">
                      {importedBy || 'Unknown'}
                    </span>
                  </span>
                </div>

                <div className="flex gap-3">
                  {step !== 'idle' && (
                    <button
                      type="button"
                      onClick={resetAll}
                      disabled={busy}
                      className="px-3 text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-50"
                    >
                      Cancel / Reset
                    </button>
                  )}

                  {step === 'idle' && (
                    <button
                      type="button"
                      onClick={handlePreview}
                      disabled={!canPreview || busy}
                      className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {busy ? 'Validating...' : 'Validate Files'}
                    </button>
                  )}

                  {(step === 'previewed' || step === 'importing') && (
                    <button
                      type="button"
                      onClick={handleRunImport}
                      disabled={busy || (!preview?.validationOk && !forceRun)}
                      className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                    >
                      {step === 'importing' ? 'Running...' : 'Run Import'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={resetAll}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  <Icons.Refresh /> Start New Run
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
