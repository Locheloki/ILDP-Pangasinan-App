import type { ReactNode } from "react";

type BadgeVariant = "default" | "primary" | "success" | "danger" | "warning";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60",
  primary: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200/40 dark:border-blue-900/30",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-900/30",
  danger: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200/40 dark:border-red-900/30",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/40 dark:border-amber-900/30",
};

export default function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center text-[9.5px] font-bold px-2 py-0.5 rounded-full ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
