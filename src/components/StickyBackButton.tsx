import { ArrowLeft } from "lucide-react";

interface StickyBackButtonProps {
  onBack: () => void;
  label?: string;
}

export default function StickyBackButton({ onBack, label }: StickyBackButtonProps) {
  return (
    <button
      onClick={onBack}
      className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/90 dark:hover:bg-blue-950/50 hover:shadow-blue-500/10 hover:scale-105 active:scale-95 cursor-pointer transition-all duration-200"
      aria-label={label || "Go back"}
    >
      <ArrowLeft className="h-4 w-4" />
      {label && <span className="text-[11px] font-semibold">{label}</span>}
    </button>
  );
}
