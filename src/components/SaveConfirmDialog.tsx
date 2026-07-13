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
        className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-100"
        role="dialog"
        aria-modal="true"
      >
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-100 cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex gap-4 items-start">
          <div className="bg-blue-50 p-3 rounded-full text-blue-600 shrink-0">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight font-display">
              Save this record?
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Are you sure you want to save this employee and all entered learning needs? This will update the system instantly.
            </p>
          </div>
        </div>

        <div className="mt-5 bg-slate-50 p-3 rounded-xl flex items-center gap-2">
          <input
            type="checkbox"
            id="dont-ask-again"
            checked={dontAskAgain}
            onChange={(e) => setDontAskAgain(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor="dont-ask-again" className="text-xs font-medium text-slate-600 cursor-pointer select-none">
            Don't ask again (remember for current session)
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-slate-200 hover:scale-[1.02] active:scale-[0.98] rounded-xl text-slate-600 hover:bg-slate-50 text-sm font-medium transition-all duration-100 cursor-pointer"
          >
            Cancel <span className="text-[10px] text-slate-400 font-normal ml-1">Esc</span>
          </button>
          
          <button
            type="button"
            ref={confirmButtonRef}
            onClick={() => onConfirm(dontAskAgain)}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] text-white rounded-xl text-sm font-medium transition-all duration-100 shadow-md shadow-blue-500/10 flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Save Record</span>
            <span className="text-[10px] text-blue-200 font-normal ml-1">Enter</span>
          </button>
        </div>
      </div>
    </div>
  );
}
