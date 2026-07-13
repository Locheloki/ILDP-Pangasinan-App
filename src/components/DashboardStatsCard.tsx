import React from "react";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon: LucideIcon;
  theme: "blue" | "green" | "amber" | "indigo";
}

export default function DashboardStatsCard({ title, value, description, icon: Icon, theme }: StatsCardProps) {
  const themeMap = {
    blue: {
      bg: "bg-blue-50 text-blue-600 border-blue-100",
      hover: "hover:bg-blue-600 hover:text-white",
    },
    green: {
      bg: "bg-emerald-50 text-emerald-600 border-emerald-100",
      hover: "hover:bg-emerald-600 hover:text-white",
    },
    amber: {
      bg: "bg-amber-50 text-amber-600 border-amber-100",
      hover: "hover:bg-amber-500 hover:text-white",
    },
    indigo: {
      bg: "bg-indigo-50 text-indigo-600 border-indigo-100",
      hover: "hover:bg-indigo-600 hover:text-white",
    },
  };

  const selectedTheme = themeMap[theme];

  return (
    <div className={`group bg-white p-5 rounded-xl border border-slate-200/60 shadow-xs flex items-center ${selectedTheme.hover} transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1 cursor-pointer`}>
      <div className={`w-12 h-12 rounded-xl ${selectedTheme.bg} group-hover:bg-white/20 group-hover:border-white/20 flex items-center justify-center mr-4 border shrink-0 transition-all duration-300`}>
        <Icon className="h-5 w-5 group-hover:text-white transition-colors duration-300" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-500 group-hover:text-white/90 font-bold uppercase tracking-wider truncate transition-colors duration-300">
          {title}
        </p>
        <p className="text-2xl font-bold text-slate-800 group-hover:text-white tracking-tight font-display mt-0.5 transition-colors duration-300">
          {value}
        </p>
        {description && (
          <p className="text-[10px] text-slate-400 group-hover:text-white/70 mt-0.5 truncate transition-colors duration-300">{description}</p>
        )}
      </div>
    </div>
  );
}
