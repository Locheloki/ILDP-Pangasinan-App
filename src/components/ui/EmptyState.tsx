import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import Button from "./Button";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`text-center py-12 space-y-3 ${className}`}>
      {icon || (
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
          <Inbox className="h-6 w-6" />
        </div>
      )}
      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{title}</p>
      {description && <p className="text-xs text-slate-400">{description}</p>}
      {action && (
        <Button variant="primary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
