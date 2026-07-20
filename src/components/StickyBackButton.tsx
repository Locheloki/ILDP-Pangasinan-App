import { useState, useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";

interface StickyBackButtonProps {
  onBack: () => void;
  label?: string;
}

export default function StickyBackButton({ onBack, label }: StickyBackButtonProps) {
  const [visible, setVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const anchorRef = useRef<Element | null>(null);

  useEffect(() => {
    const observe = () => {
      const anchor = document.querySelector("[data-sticky-anchor]");
      if (!anchor) {
        setVisible(false);
        return;
      }

      if (anchorRef.current === anchor) return;

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      anchorRef.current = anchor;

      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          setVisible(!entry.isIntersecting);
        },
        { threshold: 0, rootMargin: "-8px 0px 0px 0px" }
      );

      observerRef.current.observe(anchor);
    };

    observe();

    const interval = setInterval(observe, 500);

    return () => {
      clearInterval(interval);
      observerRef.current?.disconnect();
    };
  }, []);

  return (
    <button
      onClick={onBack}
      className={`fixed bottom-6 left-6 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-xl shadow-lg border border-slate-200/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/90 dark:hover:bg-blue-950/50 hover:shadow-blue-500/10 cursor-pointer transition-all duration-300 ease-out font-semibold text-xs ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-3 pointer-events-none"
      }`}
      aria-label={label || "Go back"}
    >
      <ArrowLeft className="h-4 w-4" />
      {label && <span>{label}</span>}
    </button>
  );
}
