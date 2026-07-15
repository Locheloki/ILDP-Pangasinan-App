import React, { useState, useEffect, useRef } from "react";
import { Search, Filter, Edit, Trash2, ArrowUpDown, ChevronLeft, ChevronRight, X, Printer, FileSpreadsheet, Eye, AlertTriangle } from "lucide-react";
import { Employee, LearningNeed } from "../types";
import { OFFICES, LEARNING_NEEDS } from "../constants";
import SearchableSelect from "./SearchableSelect";

interface JoinedRecord {
  LearningNeedID: number;
  EmployeeID: number;
  FirstName: string;
  MiddleInitial?: string;
  LastName: string;
  Office: string;
  Position: string;
  EmploymentType?: string;
  EmploymentStatus?: string;
  StatusChangedAt?: string;
  LearningNeed: string;
  Basis: string;
  Methodology: string;
  TargetSchedule: string;
  CreatedAt: string;
  UpdatedAt: string;
  CreatedBy: string;
  UpdatedBy: string;
  EmployeeCreatedBy?: string;
  EmployeeCreatedAt?: string;
}

interface RecordsTableProps {
  onEditEmployee: (employeeId: number) => void;
  onRefreshStats: () => void;
  customOptionsVersion?: number;
  onCustomOptionsChange?: () => void;
}

export default function RecordsTable({ 
  onEditEmployee, 
  onRefreshStats,
  customOptionsVersion,
  onCustomOptionsChange
}: RecordsTableProps) {
  const [records, setJoinedRecords] = useState<JoinedRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchQuery] = useState("");
  const [officeFilter, setOfficeFilter] = useState("");
  const [needFilter, setNeedFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Custom Options State
  const [officeOptions, setOfficeOptions] = useState<string[]>(OFFICES);
  const [learningNeedOptions, setLearningNeedOptions] = useState<string[]>(LEARNING_NEEDS);

  useEffect(() => {
    fetch("/api/options/office")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setOfficeOptions(data);
        }
      });

    fetch("/api/options/learningNeed")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLearningNeedOptions(data);
        }
      });
  }, [customOptionsVersion]);

  const handleDeleteCustomOption = (type: "office" | "learningNeed", value: string) => {
    fetch(`/api/options/${type}/${encodeURIComponent(value)}`, { method: "DELETE" })
      .then(res => res.json())
      .then(() => {
        const filterFn = (v: string) => v.toLowerCase().trim() !== value.toLowerCase().trim();
        if (type === "office") {
          setOfficeOptions(prev => prev.filter(filterFn));
          if (officeFilter.toLowerCase().trim() === value.toLowerCase().trim()) {
            setOfficeFilter("");
          }
        } else if (type === "learningNeed") {
          setLearningNeedOptions(prev => prev.filter(filterFn));
          if (needFilter.toLowerCase().trim() === value.toLowerCase().trim()) {
            setNeedFilter("");
          }
        }
        
        if (onCustomOptionsChange) {
          onCustomOptionsChange();
        }
      })
      .catch(err => console.error(err));
  };

  // Sort state
  const [sortBy, setSortBy] = useState("LastName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const isFirstMount = useRef(true);

  // Scroll smoothly to directory cards block on page changes
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    cardsContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentPage]);

  // Detail Modal overlay state
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<Employee | null>(null);
  const [selectedEmployeeNeeds, setSelectedEmployeeNeeds] = useState<LearningNeed[]>([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Delete confirm state
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteEmployeeConfirmId, setDeleteEmployeeConfirmId] = useState<number | null>(null);

  // Fetch Joined Records on filter changes
  useEffect(() => {
    fetchRecords();
  }, [searchTerm, officeFilter, needFilter, sortBy, sortOrder]);

  const fetchRecords = () => {
    setLoading(true);
    let url = `/api/learning-needs?search=${searchTerm}&office=${officeFilter}&learningNeed=${needFilter}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        // Additional date range filter on client-side
        let filtered = data;
        if (startDate) {
          const sDate = new Date(startDate);
          filtered = filtered.filter((r: any) => new Date(r.CreatedAt) >= sDate);
        }
        if (endDate) {
          const eDate = new Date(endDate);
          eDate.setHours(23, 59, 59, 999);
          filtered = filtered.filter((r: any) => new Date(r.CreatedAt) <= eDate);
        }
        setJoinedRecords(filtered);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching records:", err);
        setLoading(false);
      });
  };

  // Trigger Excel Export Download
  const handleExportExcel = () => {
    let url = `/api/export/excel?`;
    if (officeFilter) url += `office=${officeFilter}&`;
    if (startDate) url += `startDate=${startDate}&`;
    if (endDate) url += `endDate=${endDate}&`;
    
    // Download File
    window.open(url, "_blank");
  };

  // Show details of specific employee
  const handleViewDetails = (employeeId: number) => {
    fetch(`/api/employees/${employeeId}`)
      .then((res) => res.json())
      .then((data) => {
        setSelectedEmployeeDetail(data);
        setSelectedEmployeeNeeds(data.needs || []);
        setDetailModalOpen(true);
      });
  };

  // Handle Delete Confirmation
  const handleDeleteNeed = (id: number) => {
    setDeleteConfirmId(id);
  };

  const executeDeleteNeed = () => {
    if (!deleteConfirmId) return;

    fetch(`/api/learning-needs/${deleteConfirmId}`, { method: "DELETE" })
      .then((res) => res.json())
      .then(() => {
        setDeleteConfirmId(null);
        fetchRecords();
        onRefreshStats();
      })
      .catch((err) => console.error("Error deleting need:", err));
  };

  const handleDeleteEmployee = (id: number) => {
    setDeleteEmployeeConfirmId(id);
  };

  const executeDeleteEmployee = () => {
    if (!deleteEmployeeConfirmId) return;

    fetch(`/api/employees/${deleteEmployeeConfirmId}`, { method: "DELETE" })
      .then((res) => res.json())
      .then(() => {
        setDeleteEmployeeConfirmId(null);
        fetchRecords();
        onRefreshStats();
      })
      .catch((err) => console.error("Error deleting employee:", err));
  };

  // Toggle Sorting column
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  // Group flat records to eliminate employee redundancy in the UI table
  const groupRecordsByEmployee = (flatRecords: JoinedRecord[]) => {
    const map = new Map<number, {
      EmployeeID: number;
      FirstName: string;
      MiddleInitial?: string;
      LastName: string;
      Office: string;
      Position: string;
      EmploymentType?: string;
      EmploymentStatus?: string;
      StatusChangedAt?: string;
      Needs: Array<{
        LearningNeedID: number;
        LearningNeed: string;
        Basis: string;
        Methodology: string;
        TargetSchedule: string;
        CreatedAt: string;
        UpdatedAt: string;
        CreatedBy: string;
        UpdatedBy: string;
      }>;
      CreatedAt: string;
      CreatedBy: string;
      EmployeeCreatedAt: string;
    }>();
    
    flatRecords.forEach((rec) => {
      if (!map.has(rec.EmployeeID)) {
        map.set(rec.EmployeeID, {
          EmployeeID: rec.EmployeeID,
          FirstName: rec.FirstName,
          MiddleInitial: rec.MiddleInitial,
          LastName: rec.LastName,
          Office: rec.Office,
          Position: rec.Position,
          EmploymentType: rec.EmploymentType,
          EmploymentStatus: rec.EmploymentStatus,
          StatusChangedAt: rec.StatusChangedAt,
          Needs: [],
          CreatedAt: rec.CreatedAt,
          CreatedBy: rec.EmployeeCreatedBy || rec.CreatedBy,
          EmployeeCreatedAt: rec.EmployeeCreatedAt || rec.CreatedAt
        });
      }
      
      const emp = map.get(rec.EmployeeID)!;
      if (!emp.Needs.some(n => n.LearningNeedID === rec.LearningNeedID)) {
        emp.Needs.push({
          LearningNeedID: rec.LearningNeedID,
          LearningNeed: rec.LearningNeed,
          Basis: rec.Basis,
          Methodology: rec.Methodology,
          TargetSchedule: rec.TargetSchedule,
          CreatedAt: rec.CreatedAt,
          UpdatedAt: rec.UpdatedAt,
          CreatedBy: rec.CreatedBy,
          UpdatedBy: rec.UpdatedBy
        });
      }
    });
    
    return Array.from(map.values());
  };

  const groupedRecords = groupRecordsByEmployee(records);

  // Pagination calculation
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRecords = groupedRecords.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(groupedRecords.length / itemsPerPage);

  const formatShortDate = (isoString: string) => {
    if (!isoString) return "N/A";
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const getStatusAlert = (rec: { EmploymentStatus?: string; StatusChangedAt?: string }) => {
    const status = rec.EmploymentStatus || "Unidentified (Pending Review)";
    const changedAt = rec.StatusChangedAt;
    if (!changedAt) return null;

    const changedDate = new Date(changedAt);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    if (changedDate <= oneYearAgo) {
      if (status === "Newly Hired" || status === "Re-employed") {
        return "Employee has not yet been declared as Casual (1+ year in status)";
      }
      if (status === "Casual") {
        return "Employee has not yet been declared as Permanent (1+ year in status)";
      }
    }
    return null;
  };

  const isRecentEntry = (createdAtStr: string) => {
    if (!createdAtStr) return false;
    const date = new Date(createdAtStr);
    const cutoff = new Date("2026-07-14T05:00:00.000Z");
    return date >= cutoff;
  };

  return (
    <div className="space-y-6">
      {/* Filtering Header Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-xs p-6 space-y-4 transition-colors duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 tracking-tight font-display">Filter & Search Directory</h3>
          </div>
          
          <button
            onClick={handleExportExcel}
            className="btn-glass text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-200/50 dark:border-emerald-900/30 text-xs py-2 px-4 cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export Search to Excel</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search Term */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Employee or Position
            </label>
            <div className="relative">
              <Search className="absolute inset-y-0 left-3 h-4 w-4 text-slate-400 my-auto" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search name, role..."
                className="w-full pl-9 pr-3.5 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
              />
            </div>
          </div>

          {/* Filter by Office */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Office / Department
            </label>
            <SearchableSelect
              value={officeFilter || "All Offices"}
              onChange={(val) => { setOfficeFilter(val === "All Offices" ? "" : val); setCurrentPage(1); }}
              options={["All Offices", ...officeOptions]}
              placeholder="All Offices"
              allowCustom={false}
              onDeleteCustom={(val) => handleDeleteCustomOption("office", val)}
              isCustom={(val) => val !== "All Offices"}
            />
          </div>

          {/* Filter by Learning Need */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Learning Need
            </label>
            <SearchableSelect
              value={needFilter || "All Competencies"}
              onChange={(val) => { setNeedFilter(val === "All Competencies" ? "" : val); setCurrentPage(1); }}
              options={["All Competencies", ...learningNeedOptions]}
              placeholder="All Competencies"
              allowCustom={false}
              onDeleteCustom={(val) => handleDeleteCustomOption("learningNeed", val)}
              isCustom={(val) => val !== "All Competencies"}
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Start Record Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              className="w-full px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              End Record Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              className="w-full px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            />
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div ref={cardsContainerRef} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-xs overflow-hidden transition-colors duration-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-950/80 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold text-[10px] transition-colors duration-200">
                <th className="py-4 px-6">
                  <button 
                    onClick={() => handleSort("LastName")}
                    className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition font-bold cursor-pointer"
                  >
                    <span>Employee Name</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="py-4 px-6">
                  <button 
                    onClick={() => handleSort("Office")}
                    className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition font-bold cursor-pointer"
                  >
                    <span>Office / Department</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="py-4 px-6">
                  <button 
                    onClick={() => handleSort("Position")}
                    className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition font-bold cursor-pointer"
                  >
                    <span>Position</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="py-4 px-6">Employment Type</th>
                <th className="py-4 px-6">Employment Status</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            
            {loading ? (
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-slate-400 font-medium text-xs">Loading records...</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            ) : currentRecords.length === 0 ? (
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No records found matching current filter query.
                  </td>
                </tr>
              </tbody>
            ) : (
              currentRecords.map((rec) => {
                const alertText = getStatusAlert(rec);
                return (
                  <tbody 
                    key={rec.EmployeeID} 
                    className="group border-b border-slate-200/80 last:border-b-0 divide-y divide-slate-100/40 dark:border-slate-800/80 dark:divide-slate-800/60"
                  >
                    {/* Primary Meta Row */}
                    <tr className="group-hover:bg-slate-50/40 dark:group-hover:bg-slate-950/40 transition-colors duration-100">
                      <td className="py-3 px-6 align-middle">
                        <div 
                          onClick={() => handleViewDetails(rec.EmployeeID)}
                          className="font-extrabold text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 text-[14.5px] leading-snug tracking-tight hover:underline cursor-pointer transition-colors duration-100"
                        >
                          {rec.LastName}, {rec.FirstName}{rec.MiddleInitial ? ` ${rec.MiddleInitial}.` : ""}
                        </div>
                        {isRecentEntry(rec.EmployeeCreatedAt) && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            Encoded by: <span className="font-semibold text-slate-500 dark:text-slate-400">{rec.CreatedBy || "system"}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-6 text-slate-600 dark:text-slate-200 align-middle text-[12px] font-medium">
                        {rec.Office}
                      </td>
                      <td className="py-3 px-6 text-slate-600 dark:text-slate-200 align-middle text-[12px] font-medium">
                        {rec.Position}
                      </td>
                      <td className="py-3 px-6 text-slate-600 dark:text-slate-200 align-middle text-[12px] font-medium">
                        {rec.EmploymentType || "Unidentified (Pending Review)"}
                      </td>
                      <td className="py-3 px-6 text-slate-600 dark:text-slate-200 align-middle text-[12px] font-medium">
                        <div className="flex items-center gap-1.5">
                          <span>{rec.EmploymentStatus || "Unidentified (Pending Review)"}</span>
                          {alertText && (
                            <span className="inline-flex items-center text-amber-600 dark:text-amber-400 cursor-help" title={alertText}>
                              <AlertTriangle className="h-4 w-4 shrink-0 animate-pulse" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-6 text-center align-middle">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Edit Records */}
                          <button
                            onClick={() => onEditEmployee(rec.EmployeeID)}
                            className="btn-glass bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30 p-2 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-all duration-100"
                            title="Edit Full Profile"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          {/* Delete Employee */}
                          <button
                            onClick={() => handleDeleteEmployee(rec.EmployeeID)}
                            className="btn-glass bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border-red-200/50 dark:border-red-900/30 p-2 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-all duration-100"
                            title="Delete Employee"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Secondary Full-Width Row: Horizontally Stacked Target Learning Needs */}
                    <tr className="bg-slate-100/85 dark:bg-slate-950/40 group-hover:bg-slate-100 dark:group-hover:bg-slate-950/85 border-t border-b border-slate-200/60 dark:border-slate-800 transition-colors duration-100">
                      <td colSpan={6} className="px-6 pb-4.5 pt-3.5">
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[9.5px] font-extrabold text-slate-600 dark:text-slate-400 bg-slate-200/80 dark:bg-slate-900 border border-slate-300/40 dark:border-slate-800 px-2 py-0.5 rounded-md uppercase tracking-wider">
                            Target Learning Needs
                          </span>
                          <div className="h-[1px] bg-slate-300/50 dark:bg-slate-800/80 flex-1"></div>
                          {rec.Needs.length > 0 && (
                            <span className="text-[9.5px] font-extrabold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-300/30 dark:border-slate-800/60 shadow-2xs">
                              {rec.Needs.length} {rec.Needs.length === 1 ? "need" : "needs"}
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 w-full">
                          {rec.Needs.map((need) => (
                            <div 
                              key={need.LearningNeedID} 
                              className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-3 relative group/need space-y-1.5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-100"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <span className="font-bold text-slate-800 dark:text-slate-100 text-[11.5px] leading-tight pr-6">
                                  {need.LearningNeed}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400">
                                <span className="bg-amber-50/40 dark:bg-amber-950/25 px-1.5 py-0.5 rounded border border-amber-100/60 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 font-medium transition-colors">
                                  <strong className="text-amber-800 dark:text-amber-300 font-semibold">Target:</strong> {need.TargetSchedule}
                                </span>
                                <span className="bg-blue-50/40 dark:bg-blue-950/25 px-1.5 py-0.5 rounded border border-blue-100/60 dark:border-blue-900/30 text-blue-700 dark:text-blue-400 font-medium transition-colors">
                                  <strong className="text-blue-800 dark:text-blue-300 font-semibold">Basis:</strong> {need.Basis}
                                </span>
                                <span className="bg-blue-50/40 dark:bg-blue-950/25 px-1.5 py-0.5 rounded border border-blue-100/60 dark:border-blue-900/30 text-blue-700 dark:text-blue-400 font-medium transition-colors">
                                  <strong className="text-blue-800 dark:text-blue-300 font-semibold">Method:</strong> {need.Methodology}
                                </span>
                              </div>
                              {/* Delete single need button inside the item */}
                              <button
                                onClick={() => handleDeleteNeed(need.LearningNeedID)}
                                className="absolute top-1 right-1 opacity-0 group-hover/need:opacity-100 transition p-1 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 rounded-md cursor-pointer hover:scale-105 active:scale-95"
                                title="Delete this learning need"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                          {rec.Needs.length === 0 && (
                            <div className="col-span-full py-1 text-slate-400 italic text-[11px] flex items-center gap-1.5">
                              <span>No target learning needs registered for this employee yet.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              )})
            )}
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && groupedRecords.length > 0 && (
          <div className="bg-slate-50/50 dark:bg-slate-950/60 px-6 py-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-medium transition-colors duration-200">
            <span>
              Showing <strong className="font-semibold text-slate-800 dark:text-slate-200">{indexOfFirstItem + 1}</strong> to{" "}
              <strong className="font-semibold text-slate-800 dark:text-slate-200">
                {indexOfLastItem > groupedRecords.length ? groupedRecords.length : indexOfLastItem}
              </strong>{" "}
              of <strong className="font-semibold text-slate-800 dark:text-slate-200">{groupedRecords.length}</strong> employees
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="btn-glass p-2 disabled:opacity-50 transition cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <span className="text-slate-700 dark:text-slate-200">
                Page <strong className="font-semibold text-slate-900 dark:text-slate-200">{currentPage}</strong> of{" "}
                <strong className="font-semibold text-slate-900 dark:text-slate-200">{totalPages || 1}</strong>
              </span>

              <button
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="btn-glass p-2 disabled:opacity-50 transition cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal Overlay */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-2xl p-6 w-full max-w-sm relative animate-in zoom-in-95 duration-100 transition-colors duration-200">
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">Delete Learning Need?</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              This will permanently delete this specific learning need entry from the database. This action is irreversible.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="btn-glass text-xs py-2 px-4 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteNeed}
                className="btn-glass bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border-red-200/50 dark:border-red-900/30 text-xs py-2 px-4 cursor-pointer font-bold shadow-md shadow-red-500/5"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Employee Confirmation Modal Overlay */}
      {deleteEmployeeConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-2xl p-6 w-full max-w-sm relative animate-in zoom-in-95 duration-100 transition-colors duration-200">
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">Delete Employee?</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              This will permanently delete this employee and all associated learning needs from the database. This action is irreversible.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeleteEmployeeConfirmId(null)}
                className="btn-glass text-xs py-2 px-4 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteEmployee}
                className="btn-glass bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border-red-200/50 dark:border-red-900/30 text-xs py-2 px-4 cursor-pointer font-bold shadow-md shadow-red-500/5"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Employee Detail Drawer Overlay */}
      {detailModalOpen && selectedEmployeeDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-100">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col relative animate-in slide-in-from-right duration-200 transition-colors duration-200">
            {/* Topbar */}
            <div className="border-b border-slate-100 dark:border-slate-800 p-6 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 transition-colors duration-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">Employee Profile Card</h3>
                <p className="text-xs text-slate-400 dark:text-slate-550 font-medium">View registered metadata & training requirements</p>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all duration-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Alert Banner if status review required */}
              {getStatusAlert(selectedEmployeeDetail) && (
                <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-4 flex items-start gap-3 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold uppercase tracking-wider">Declaration Review Required</h5>
                    <p className="text-xs font-medium leading-relaxed">
                      {getStatusAlert(selectedEmployeeDetail)}
                    </p>
                  </div>
                </div>
              )}

              {/* Demographics Card */}
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-800 p-5 space-y-4 transition-colors duration-200">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Demographics Name</span>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-display">
                    {selectedEmployeeDetail.LastName}, {selectedEmployeeDetail.FirstName} {selectedEmployeeDetail.MiddleInitial || ""}
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-200/60 dark:border-slate-800 pt-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Office</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{selectedEmployeeDetail.Office}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Position</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{selectedEmployeeDetail.Position}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-200/60 dark:border-slate-800 pt-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Employment Type</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {selectedEmployeeDetail.EmploymentType || "Unidentified (Pending Review)"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Employment Status</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {selectedEmployeeDetail.EmploymentStatus || "Unidentified (Pending Review)"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-200/60 dark:border-slate-800 pt-4 text-[11px] text-slate-400">
                  <div className={isRecentEntry(selectedEmployeeDetail.CreatedAt) ? "" : "col-span-2"}>
                    <span className="block">Recorded:</span>
                    <span>{formatShortDate(selectedEmployeeDetail.CreatedAt)}</span>
                  </div>
                  {isRecentEntry(selectedEmployeeDetail.CreatedAt) && (
                    <div>
                      <span className="block">Encoder Log:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedEmployeeDetail.CreatedBy}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Training plans */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Learning Needs ({selectedEmployeeNeeds.length})</h4>
                
                {selectedEmployeeNeeds.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No learning needs currently logged on this profile.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedEmployeeNeeds.map((need, idx) => (
                      <div key={idx} className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-950 shadow-sm space-y-2.5 transition-colors duration-200">
                        <div className="flex items-start justify-between">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                            {need.LearningNeed}
                          </span>
                          <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold px-2 py-0.5 rounded text-[10px] whitespace-nowrap border dark:border-blue-900/40">
                            {need.TargetSchedule}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-50 dark:border-slate-800 pt-2">
                          <div>
                            <strong className="text-slate-400 font-normal">Basis:</strong> {need.Basis}
                          </div>
                          <div>
                            <strong className="text-slate-400 font-normal">Methodology:</strong> {need.Methodology}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-950/40 transition-colors duration-200">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="btn-glass text-xs py-2 px-4 cursor-pointer"
              >
                Close Profile
              </button>
              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  onEditEmployee(selectedEmployeeDetail.EmployeeID);
                }}
                className="btn-glass bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30 hover:scale-[1.02] active:scale-[0.98] text-xs py-2 px-4 cursor-pointer font-bold shadow-md shadow-blue-500/5"
              >
                Modify Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
