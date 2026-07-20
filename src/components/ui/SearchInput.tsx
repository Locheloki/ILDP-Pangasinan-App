import { Search } from "lucide-react";
import Spinner from "./Spinner";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  className?: string;
}

export default function SearchInput({ value, onChange, placeholder = "Search...", loading, className = "" }: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full pl-9 pr-9 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 dark:text-white font-semibold transition-colors"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Spinner size={14} />
        </div>
      )}
    </div>
  );
}
