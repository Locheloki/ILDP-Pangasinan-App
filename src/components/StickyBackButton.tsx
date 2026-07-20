import { ArrowLeft } from "lucide-react";

interface StickyBackButtonProps {
  onBack: () => void;
}

export default function StickyBackButton({ onBack }: StickyBackButtonProps) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="sticky top-0 z-40 btn-glass bg-slate-500/10 hover:bg-blue-500/15 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 py-2 px-2.5 rounded-full inline-flex items-center cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 shadow-md backdrop-blur-lg mb-4"
      aria-label="Go back"
    >
      <ArrowLeft className="h-4 w-4" />
    </button>
  );
}
