import React, { useEffect, useRef } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import Modal from "./Modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (confirmButtonRef.current) confirmButtonRef.current.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  const iconBg = variant === "danger"
    ? "bg-red-50 dark:bg-red-950/50 text-red-500 dark:text-red-400 border border-red-200/60 dark:border-red-800/50"
    : "bg-amber-50 dark:bg-amber-950/50 text-amber-500 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/50";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      maxWidth="max-w-sm"
      ariaLabel={title}
      hideCloseButton
      bodyClassName="!px-0 !pb-0"
      footer={
        <div className="flex w-full gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="btn-glass flex-1 text-xs py-2.5 px-4 cursor-pointer font-semibold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            ref={confirmButtonRef}
            onClick={onConfirm}
            className={`btn-glass flex-1 text-xs py-2.5 px-4 cursor-pointer font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 ${
              variant === "danger"
                ? "bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/40 shadow-md shadow-red-500/10"
                : "bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/40 shadow-md shadow-amber-500/10"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      <div className="px-6 pt-5 pb-5">
        <div className="flex gap-4 items-start">
          <div className={`p-2.5 rounded-xl shrink-0 ${iconBg}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1.5 pt-0.5 min-w-0">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{message}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
