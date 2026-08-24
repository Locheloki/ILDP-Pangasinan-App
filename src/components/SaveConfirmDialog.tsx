import React, { useEffect, useRef } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
import Modal from "./Modal";

interface SaveConfirmDialogProps {
  isOpen: boolean;
  onConfirm: (dontAskAgain: boolean) => void;
  onCancel: () => void;
}

export default function SaveConfirmDialog({ isOpen, onConfirm, onCancel }: SaveConfirmDialogProps) {
  const [dontAskAgain, setDontAskAgain] = React.useState(false);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      maxWidth="max-w-md"
      ariaLabel="Save this record?"
      hideCloseButton
      bodyClassName="pt-6 space-y-5"
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            className="btn-glass bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border-red-200/50 dark:border-red-900/30 hover:scale-[1.02] active:scale-[0.98] text-xs py-2 px-4 cursor-pointer"
          >
            Cancel <span className="text-[10px] text-red-400 dark:text-red-300 font-normal ml-1">Esc</span>
          </button>
          <button
            type="button"
            ref={confirmButtonRef}
            onClick={() => onConfirm(dontAskAgain)}
            className="btn-glass bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30 hover:scale-[1.02] active:scale-[0.98] text-xs py-2 px-4 cursor-pointer font-bold shadow-md shadow-blue-500/5"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Save Record</span>
            <span className="text-[10px] text-blue-400 dark:text-blue-300 font-normal ml-1">Enter</span>
          </button>
        </>
      }
    >
      <div className="flex gap-4 items-start px-1">
        <div className="bg-blue-50 dark:bg-blue-950/40 p-2.5 rounded-full text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 shrink-0">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Save this record?
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Are you sure you want to save this employee and all entered learning needs? This will update the system instantly.
          </p>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl flex items-center gap-2.5 border border-slate-200/60 dark:border-slate-800 transition-colors duration-200 mt-4">
        <input
          type="checkbox"
          id="dont-ask-again"
          checked={dontAskAgain}
          onChange={(e) => setDontAskAgain(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 dark:bg-slate-900 focus:ring-blue-500 cursor-pointer"
        />
        <label htmlFor="dont-ask-again" className="text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none">
          Don't ask again (remember for current session)
        </label>
      </div>
    </Modal>
  );
}
