import { Loader2 } from "lucide-react";

interface SpinnerProps {
  size?: number;
  className?: string;
  label?: string;
}

export default function Spinner({ size = 16, className = "", label }: SpinnerProps) {
  return (
    <div className={`flex items-center justify-center gap-2 ${label ? "py-8" : ""} ${className}`}>
      <Loader2 className="text-blue-500 animate-spin" style={{ width: size, height: size }} />
      {label && <span className="text-xs text-slate-400 font-medium">{label}</span>}
    </div>
  );
}
