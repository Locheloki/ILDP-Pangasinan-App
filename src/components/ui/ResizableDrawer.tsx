import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";


interface ResizableDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialWidth?: number;
  minWidth?: number;
  maxWidthRatio?: number;
  children: React.ReactNode;
  sessionKey?: string;
}

export default function ResizableDrawer({
  isOpen,
  onClose,
  initialWidth = 650,
  minWidth = 420,
  maxWidthRatio = 0.7,
  children,
  sessionKey,
}: ResizableDrawerProps) {
  const computeMax = useCallback(() => Math.floor(window.innerWidth * maxWidthRatio), [maxWidthRatio]);
  const [width, setWidth] = useState(() => {
    const stored = sessionKey ? sessionStorage.getItem(sessionKey) : null;
    if (stored) return Math.min(Math.max(Number(stored), minWidth), computeMax());
    return initialWidth;
  });
  const [isResizing, setIsResizing] = useState(false);
  const hasResizedOnce = useRef(false);
  const openEvent = useRef<{ scrollY: number; focusEl: Element | null } | null>(null);

  useEffect(() => {
    if (isOpen && !openEvent.current) {
      openEvent.current = { scrollY: window.scrollY, focusEl: document.activeElement };
    } else if (!isOpen && openEvent.current) {
      const { scrollY, focusEl } = openEvent.current;
      window.scrollTo({ top: scrollY, behavior: "instant" });
      if (focusEl instanceof HTMLElement) focusEl.focus({ preventScroll: true });
      openEvent.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const max = computeMax();
    setWidth((w) => Math.min(w, max));
  }, [isOpen, computeMax]);

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      const max = computeMax();
      const clamped = Math.min(Math.max(newWidth, minWidth), Math.max(max, minWidth));
      setWidth(clamped);
      hasResizedOnce.current = true;
    };
    const handleMouseUp = () => setIsResizing(false);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, minWidth, computeMax]);

  useEffect(() => {
    if (hasResizedOnce.current && sessionKey) {
      sessionStorage.setItem(sessionKey, String(width));
    }
  }, [width, sessionKey]);

  const panel = (
    <motion.div
      initial={false}
      animate={{ x: isOpen ? 0 : "100%" }}
      transition={{ type: "spring", stiffness: 350, damping: 30, mass: 0.8 }}
      className="fixed top-0 right-0 h-full z-[100] bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-700 flex flex-col"
      style={{ width: isOpen ? width : 0 }}
    >
      <div
        onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}
        className="absolute left-0 top-0 bottom-0 w-[5px] cursor-col-resize hover:bg-blue-400/60 active:bg-blue-500 transition-colors z-10 group"
      >
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-blue-300/0 group-hover:bg-blue-400/40 active:bg-blue-500/60 transition-colors" />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden pt-2">
        {children}
      </div>
    </motion.div>
  );

  return createPortal(
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[99] bg-black/10" onClick={onClose} />
      )}
      {panel}
    </>,
    document.body
  );
}
