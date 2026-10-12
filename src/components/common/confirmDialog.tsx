"use client";

import { useId } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Потвърди",
  cancelLabel = "Откажи",
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  const titleId = useId();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onCancel(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-sm rounded-xl border border-stroke bg-surface p-5 shadow-lg"
      >
        <h2 id={titleId} className="mb-2 text-base font-semibold text-fg">{title}</h2>
        {description && (
          <p className="mb-5 text-sm leading-relaxed text-fg-2">{description}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-stroke px-4 py-2 text-xs font-medium text-fg-2 transition-colors hover:bg-muted hover:text-fg disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-danger px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Изтриване…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
