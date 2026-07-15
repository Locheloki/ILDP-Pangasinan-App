import React, { useEffect, useRef } from "react";
import { AlertCircle, CheckCircle, X } from "lucide-react";

interface SaveConfirmDialogProps {
  isOpen: boolean;
  onConfirm: (dontAskAgain: boolean) => void;
  onCancel: () => void;
}

export default function SaveConfirmDialog({ isOpen, onConfirm, onCancel }: SaveConfirmDialogProps) {
  const [dontAskAgain, setDontAskAgain] = React.useState(false);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Keyboard navigation listeners: Escape to Cancel, Enter to Confirm
  useEffect(() => {
    if (!isOpen) return;

    // Focus the save confirm button automatically
    if (confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-100 transition-colors duration-200"
        role="dialog"
        aria-modal="true"
      >
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-100 cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex gap-4 items-start">
          <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-full text-blue-600 dark:text-blue-400 border dark:border-blue-900/40 shrink-0">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight font-display">
              Save this record?
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Are you sure you want to save this employee and all entered learning needs? This will update the system instantly.
            </p>
          </div>
        </div>

        <div className="mt-5 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl flex items-center gap-2 border dark:border-slate-800 transition-colors duration-200">
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

        <div className="mt-6 flex justify-end gap-3">
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
        </div>
      </div>
    </div>
  );
}
