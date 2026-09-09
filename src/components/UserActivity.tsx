import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, ArrowUpDown, BarChart3 } from "lucide-react";
import { User } from "../types";

interface UserActivityProps {
  currentUser: User | null;
}

interface UserStat {
  user: string;
  employeesAdded: number;
  employeesEdited: number;
  learningNeedsAdded: number;
  totalActions: number;
}

interface ActivityEntry {
  timestamp: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  entity_name?: string;
  description?: string;
  performed_by?: string;
}

interface ActivityResponse {
  users: UserStat[];
  summary: { employeesAdded: number; employeesEdited: number; learningNeedsAdded: number; totalActions: number };
  distinctUsers: string[];
  distinctActions: string[];
  recentActivity: ActivityEntry[];
}

const DATE_PRESETS = [
  { label: "All Time", value: "all" },
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "This Year", value: "year" },
];

function getDateRange(preset: string): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split("T")[0];
  let from: string;
  switch (preset) {
    case "today": from = to; break;
    case "week": {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay());
      from = d.toISOString().split("T")[0];
      break;
    }
    case "month": from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`; break;
    case "year": from = `${now.getFullYear()}-01-01`; break;
    default: from = ""; break;
  }
  return { from, to: preset === "all" ? "" : to };
}

export default function UserActivity({ currentUser }: UserActivityProps) {
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [datePreset, setDatePreset] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [sortKey, setSortKey] = useState<"user" | "employeesAdded" | "employeesEdited" | "learningNeedsAdded" | "totalActions">("totalActions");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (retryCount = 0) => {
    setLoading(true);
    setError(null);
    try {
      const { from, to } = getDateRange(datePreset);
      const params = new URLSearchParams();
      if (from) params.set("date_from", from);
      if (to) params.set("date_to", to);
      if (userFilter !== "all") params.set("user_filter", userFilter);
      if (actionFilter !== "all") params.set("action_filter", actionFilter);
      const res = await fetch(`/api/admin/user-activity?${params.toString()}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setError(null);
      } else {
        const errMsg = `Server returned ${res.status}: ${res.statusText}`;
        console.error("[UserActivity]", errMsg);
        if (retryCount < 1) {
          setTimeout(() => fetchData(retryCount + 1), 1500);
          return;
        }
        setError(errMsg);
      }
    } catch (err) {
      console.error("[UserActivity] Failed to load user activity:", err);
      if (retryCount < 1) {
        setTimeout(() => fetchData(retryCount + 1), 1500);
        return;
      }
      setError("Network error — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [datePreset, userFilter, actionFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => { setCurrentPage(1); }, [datePreset, userFilter, actionFilter]);

  const userRecentActions = React.useMemo(() => {
    if (!data) return new Map<string, ActivityEntry[]>();
    const map = new Map<string, ActivityEntry[]>();
    for (const entry of data.recentActivity) {
      const user = entry.performed_by;
      if (!user) continue;
      if (!map.has(user)) map.set(user, []);
      const list = map.get(user)!;
      if (list.length < 3) list.push(entry);
    }
    return map;
  }, [data]);

  const sortedUsers = React.useMemo(() => {
    if (!data) return [];
    const sorted = [...data.users].sort((a, b) => {
      const mul = sortOrder === "asc" ? 1 : -1;
      if (sortKey === "user") return mul * a.user.localeCompare(b.user);
      return mul * (a[sortKey] - b[sortKey]);
    });
    return sorted;
  }, [data, sortKey, sortOrder]);

  const itemsPerPage = 15;
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const paginatedUsers = sortedUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortOrder(o => o === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortOrder("desc"); }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-xs p-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Date Range</label>
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DATE_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">User</label>
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Users</option>
            {data?.distinctUsers.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Action</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Actions</option>
            {data?.distinctActions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Employees Added", value: data.summary.employeesAdded, color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Employees Edited", value: data.summary.employeesEdited, color: "text-blue-600 dark:text-blue-400" },
            { label: "Learning Needs Added", value: data.summary.learningNeedsAdded, color: "text-violet-600 dark:text-violet-400" },
            { label: "Total Actions", value: data.summary.totalActions, color: "text-slate-800 dark:text-slate-100" },
          ].map(card => (
            <div key={card.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-xs p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{card.label}</p>
              <p className={`text-2xl font-bold tabular-nums ${card.color}`}>{card.value.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {/* User Activity Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">User Activity</h3>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-xs text-slate-400 dark:text-slate-500">Loading...</div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-2">
                <BarChart3 className="h-4 w-4 text-red-400" />
              </div>
              <p className="text-xs text-red-500 dark:text-red-400 font-medium mb-2">{error}</p>
              <button
                onClick={() => fetchData()}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          ) : paginatedUsers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2">
                <BarChart3 className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No activity found for the selected filters.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-950/80 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                  {([
                    ["user", "User"],
                    ["employeesAdded", "Employees Added"],
                    ["employeesEdited", "Employees Edited"],
                    ["learningNeedsAdded", "Learning Needs Added"],
                    ["totalActions", "Total Actions"],
                  ] as const).map(([key, label]) => (
                    <th key={key} className="py-3 px-6">
                      <button
                        onClick={() => toggleSort(key)}
                        className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition font-bold cursor-pointer"
                      >
                        <span>{label}</span>
                        {sortKey === key && <ArrowUpDown className="h-3 w-3" />}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map(u => {
                  const isExpanded = expandedUser === u.user;
                  const actions = userRecentActions.get(u.user) || [];
                  return (
                    <React.Fragment key={u.user}>
                      <tr
                        onClick={() => setExpandedUser(isExpanded ? null : u.user)}
                        className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                      >
                        <td className="py-2.5 px-6 text-[11px] font-semibold text-slate-800 dark:text-slate-100">
                          <div className="flex items-center gap-2">
                            <ChevronRight className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                            {u.user}
                          </div>
                        </td>
                        <td className="py-2.5 px-6 text-[11px] text-slate-600 dark:text-slate-300 tabular-nums">{u.employeesAdded}</td>
                        <td className="py-2.5 px-6 text-[11px] text-slate-600 dark:text-slate-300 tabular-nums">{u.employeesEdited}</td>
                        <td className="py-2.5 px-6 text-[11px] text-slate-600 dark:text-slate-300 tabular-nums">{u.learningNeedsAdded}</td>
                        <td className="py-2.5 px-6 text-[11px] font-semibold text-slate-800 dark:text-slate-100 tabular-nums">{u.totalActions}</td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50/50 dark:bg-slate-950/40">
                          <td colSpan={5} className="px-6 py-3">
                            {actions.length === 0 ? (
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">No recent activity found.</p>
                            ) : (
                              <div className="flex flex-col gap-1.5">
                                {actions.map((a, i) => {
                                  const colors: Record<string, string> = {
                                    "Employee Created": "bg-emerald-500",
                                    "Employee Updated": "bg-blue-500",
                                    "Learning Need Created": "bg-violet-500",
                                    "Profile Picture Updated": "bg-amber-500",
                                    "CREATE": "bg-rose-500",
                                  };
                                  const dotColor = colors[a.action] || "bg-slate-400";
                                  return (
                                    <div key={i} className="flex items-center gap-2 text-[11px]">
                                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                                      <span className="font-medium text-slate-700 dark:text-slate-200">{a.action}</span>
                                      {a.entity_name && (
                                        <span className="text-slate-500 dark:text-slate-400">— {a.entity_name}</span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && sortedUsers.length > 0 && (
          <div className="bg-slate-50/50 dark:bg-slate-950/60 px-6 py-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>
              Showing <strong className="font-semibold text-slate-800 dark:text-slate-200">{(currentPage - 1) * itemsPerPage + 1}</strong> to{" "}
              <strong className="font-semibold text-slate-800 dark:text-slate-200">{Math.min(currentPage * itemsPerPage, sortedUsers.length)}</strong>{" "}
              of <strong className="font-semibold text-slate-800 dark:text-slate-200">{sortedUsers.length}</strong> users
            </span>
            <div className="flex items-center gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="btn-glass p-2 disabled:opacity-50 transition cursor-pointer">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-slate-700 dark:text-slate-200">
                Page <strong className="font-semibold text-slate-900 dark:text-slate-200">{currentPage}</strong> of{" "}
                <strong className="font-semibold text-slate-900 dark:text-slate-200">{totalPages || 1}</strong>
              </span>
              <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="btn-glass p-2 disabled:opacity-50 transition cursor-pointer">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
