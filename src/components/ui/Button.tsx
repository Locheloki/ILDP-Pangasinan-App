import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md";
  icon?: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 shadow-md shadow-blue-500/5",
  secondary: "bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60",
  danger: "bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/30 shadow-md shadow-red-500/5",
  ghost: "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60 border border-transparent",
};

const sizeClasses = {
  sm: "text-[10px] py-1.5 px-2.5",
  md: "text-xs py-2 px-4",
};

export default function Button({
  variant = "secondary",
  size = "md",
  icon,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-xl font-bold cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-100 inline-flex items-center justify-center gap-1.5 select-none ${variantClasses[variant]} ${sizeClasses[size]} ${disabled ? "opacity-50 pointer-events-none" : ""} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
