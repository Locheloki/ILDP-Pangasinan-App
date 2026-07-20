import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  /** Tailwind max-w class, e.g. "max-w-sm", "max-w-lg", "max-w-2xl" */
  maxWidth?: string;
  /** Enable backdrop click-to-close (default true) */
  closeOnBackdrop?: boolean;
  children: ReactNode;
  /** Footer actions rendered in the bottom bar */
  footer?: ReactNode;
  /** Replace the default header entirely */
  header?: ReactNode;
  /** Hide the default X close button */
  hideCloseButton?: boolean;
  /** Accessible label for the dialog */
  ariaLabel?: string;
  /** Additional class for the scrollable body area */
  bodyClassName?: string;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  maxWidth = "max-w-lg",
  closeOnBackdrop = true,
  children,
  footer,
  header,
  hideCloseButton = false,
  ariaLabel,
  bodyClassName = "",
}: ModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      onMouseDown={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || title}
    >
      <div
        ref={cardRef}
        className={`bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/10 rounded-2xl ${maxWidth} w-full shadow-2xl flex flex-col max-h-[90vh] animate-zoom-in transition-colors duration-200`}
      >
        {/* Header */}
        {header ? (
          header
        ) : title || !hideCloseButton ? (
          <div className="flex justify-between items-center px-6 pt-5 pb-3 shrink-0">
            {title && (
              <h3 className="text-base font-bold text-slate-800 dark:text-white">{title}</h3>
            )}
            {!hideCloseButton && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-all duration-100 cursor-pointer ml-auto"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : null}

        {/* Scrollable body */}
        <div className={`px-6 pb-5 overflow-y-auto flex-1 min-h-0 ${bodyClassName}`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
