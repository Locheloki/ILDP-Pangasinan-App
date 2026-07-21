import { useState, useEffect, useCallback } from "react";
import { Search, Filter, ChevronDown, ChevronUp, Clock, User as UserIcon, FileText, Calendar, X, Loader2, AlertCircle, History } from "lucide-react";
import { AuditLog, User } from "../types";

const MODULES = ["Employee Management", "Seminar Module", "Seminar Import", "Employee Import"];

const ACTION_ICONS: Record<string, string> = {
  "Employee Created": "🟢",
  "Employee Updated": "🟠",
  "Employee Deleted": "🔴",
  "Excel Imported": "📥",
  "Import Completed": "📋",
  "Seminar Created": "🆕",
  "Seminar Edited": "✏️",
  "Seminar Deleted": "🗑️",
  "Year Created": "📅",
  "Year Deleted": "🗓️",
  "Attendee Added": "👤",
  "Attendee Removed": "🚫",
  "Imported Attendee Edited": "⚙️",
  "Employee Marked as External Participant": "🚪",
};

const ACTION_COLORS: Record<string, string> = {
  "Employee Created": "text-emerald-600 dark:text-emerald-400",
  "Employee Updated": "text-amber-600 dark:text-amber-400",
  "Employee Deleted": "text-red-600 dark:text-red-400",
  "Excel Imported": "text-blue-600 dark:text-blue-400",
  "Import Completed": "text-indigo-600 dark:text-indigo-400",
};

function formatTimestamp(ts: string) {
  const d = new Date(ts);
  const dateStr = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return { dateStr, timeStr };
}

function DiffValue({ label, before, after }: { label: string; before?: string; after?: string }) {
  if (!before && !after) return null;
  return (
    <div className="bg-slate-50 dark:bg-slate-950/40 rounded-xl p-3 border border-slate-200/50 dark:border-slate-800/50">
      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500 block mb-1.5">{label}</span>
      {before !== undefined && (
        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <span className="text-red-500 font-medium">Before:</span>
          <span className="line-through">{before || "(empty)"}</span>
        </div>
      )}
      {after !== undefined && (
        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">After:</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">{after || "(empty)"}</span>
        </div>
      )}
    </div>
  );
}

export default function AuditLogs({ currentUser }: { currentUser: User }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Filters
  const [filterModule, setFilterModule] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "50");
      if (filterModule) params.set("module", filterModule);
      if (filterAction) params.set("action", filterAction);
      if (filterSearch) params.set("search", filterSearch);
      if (filterDateFrom) params.set("date_from", filterDateFrom);
      if (filterDateTo) params.set("date_to", filterDateTo);

      const res = await fetch(`/api/audit-logs?${params.toString()}`, {
        headers: { "x-user-id": String(currentUser.id) },
      });
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      const data = await res.json();
      setLogs(data.logs);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, filterModule, filterAction, filterSearch, filterDateFrom, filterDateTo]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const clearFilters = () => {
    setFilterModule("");
    setFilterAction("");
    setFilterSearch("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setPage(1);
  };

  const hasFilters = filterModule || filterAction || filterSearch || filterDateFrom || filterDateTo;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="sidebar-contrast-bg border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
            <History className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight font-display">Activity & Audit Logs</h2>
            <p className="text-xs text-blue-200 font-medium mt-0.5">
              {total} recorded actions
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={filterSearch}
              onChange={(e) => { setFilterSearch(e.target.value); setPage(1); }}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border cursor-pointer transition-all ${
              hasFilters
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30"
                : "bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            Filters{hasFilters ? ` (${["module", "action", "search", "date"].filter(k => k ? hasFilters : false).length})` : ""}
          </button>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-2 py-1.5 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1">Module</label>
              <select
                value={filterModule}
                onChange={(e) => { setFilterModule(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Modules</option>
                {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1">Action</label>
              <select
                value={filterAction}
                onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Actions</option>
                {Object.keys(ACTION_ICONS).map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1">From</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-1">To</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-500/10 border border-red-200/50 dark:border-red-900/30 rounded-2xl p-6 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && logs.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center">
          <History className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400">No audit logs found</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {hasFilters ? "Try adjusting your filters." : "Logs will appear here as actions are performed."}
          </p>
        </div>
      )}

      {/* Timeline */}
      {!loading && !error && logs.length > 0 && (
        <div className="space-y-2">
          {logs.map((log) => {
            const { dateStr, timeStr } = formatTimestamp(log.timestamp);
            const isExpanded = expandedId === log.id;
            const icon = ACTION_ICONS[log.action] || "📝";
            const colorClass = ACTION_COLORS[log.action] || "text-slate-600 dark:text-slate-300";

            return (
              <div
                key={log.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md"
              >
                {/* Compact row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  className="w-full flex items-start gap-3 px-4 py-3.5 text-left cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors"
                >
                  <span className="text-base leading-none mt-0.5 shrink-0">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-extrabold uppercase tracking-wider ${colorClass}`}>
                        {log.action}
                      </span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                        {log.module}
                      </span>
                    </div>
                    {log.entity_name && (
                      <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100 mt-0.5 leading-snug truncate">
                        {log.entity_name}
                      </p>
                    )}
                    {log.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed line-clamp-1">
                        {log.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {dateStr}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeStr}
                      </span>
                      <span className="flex items-center gap-1">
                        <UserIcon className="h-3 w-3" />
                        {log.performed_by}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 mt-0.5">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-4 space-y-3 bg-slate-50/30 dark:bg-slate-950/10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Entity Type</span>
                        <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-0.5 capitalize">{log.entity_type?.replace(/_/g, " ")}</p>
                      </div>
                      {log.entity_id && (
                        <div>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Entity ID</span>
                          <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{log.entity_id}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Performed By</span>
                        <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{log.performed_by}</p>
                      </div>
                    </div>

                    {log.description && (
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Description</span>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{log.description}</p>
                      </div>
                    )}

                    {/* Before/After diffs */}
                    {log.before_data && log.after_data && (
                      <div className="space-y-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <FileText className="h-3 w-3" />
                          Changes
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {log.before_data.FirstName !== log.after_data.FirstName && (
                            <DiffValue label="First Name" before={log.before_data.FirstName} after={log.after_data.FirstName} />
                          )}
                          {log.before_data.LastName !== log.after_data.LastName && (
                            <DiffValue label="Last Name" before={log.before_data.LastName} after={log.after_data.LastName} />
                          )}
                          {log.before_data.Office !== log.after_data.Office && (
                            <DiffValue label="Office" before={log.before_data.Office} after={log.after_data.Office} />
                          )}
                          {log.before_data.Position !== log.after_data.Position && (
                            <DiffValue label="Position" before={log.before_data.Position} after={log.after_data.Position} />
                          )}
                          {log.before_data.EmploymentStatus !== log.after_data.EmploymentStatus && (
                            <DiffValue label="Employment Status" before={log.before_data.EmploymentStatus} after={log.after_data.EmploymentStatus} />
                          )}
                          {log.before_data.title !== log.after_data?.title && (
                            <DiffValue label="Seminar Title" before={log.before_data.title} after={log.after_data?.title} />
                          )}
                          {log.before_data.year !== log.after_data?.year && (
                            <DiffValue label="Year" before={String(log.before_data.year)} after={String(log.after_data?.year)} />
                          )}
                          {log.before_data.quarter !== log.after_data?.quarter && (
                            <DiffValue label="Quarter" before={log.before_data.quarter} after={log.after_data?.quarter} />
                          )}
                          {log.before_data.location !== log.after_data?.location && (
                            <DiffValue label="Location" before={log.before_data.location} after={log.after_data?.location} />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Show data summary for non-diff entries */}
                    {log.after_data && !log.before_data && (
                      <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Data Summary</span>
                        <pre className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-950 p-2 rounded-xl overflow-x-auto max-h-32">
                          {JSON.stringify(log.after_data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-3 shadow-sm">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Page {page} of {totalPages} ({total} total)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-all"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
