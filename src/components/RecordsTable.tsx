import React, { useState, useEffect, useRef } from "react";
import { Search, Filter, Edit, Trash2, Archive, ArchiveRestore, ArrowUpDown, ChevronLeft, ChevronRight, Printer, FileSpreadsheet, Eye, AlertTriangle, ArrowLeft, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Employee, LearningNeed, formatEmployeeName } from "../types";
import { OFFICES, LEARNING_NEEDS } from "../constants";
import { can, PERMISSIONS } from "../permissions";
import SearchableSelect from "./SearchableSelect";
import EmployeeProfileDrawer from "./EmployeeProfileDrawer";
import Modal from "./Modal";

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
  EmployeeUpdatedBy?: string;
  Gender?: string;
  DateOfAssumption?: string;
  NewlyHired?: string;
}

const renderPendingText = (text: string | null | undefined) => {
  const str = text || "Undefined (Pending Review)";
  if (str === "Undefined (Pending Review)") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/30">
        Undefined (Pending Review)
      </span>
    );
  }
  return str;
};

interface RecordsTableProps {
  onEditEmployee: (employeeId: number) => void;
  onRefreshStats: () => void;
  customOptionsVersion?: number;
  onCustomOptionsChange?: () => void;
  initialFilters?: {
    employmentStatus?: string;
    newlyHired?: string;
    office?: string;
    learningNeed?: string;
  } | null;
  initialSearch?: string;
  onConsumeFilters?: () => void;
  currentUser?: any;
  onToast?: (msg: string, type?: "success" | "error") => void;
}

export default function RecordsTable({ 
  onEditEmployee, 
  onRefreshStats,
  customOptionsVersion,
  onCustomOptionsChange,
  initialFilters,
  initialSearch,
  onConsumeFilters,
  currentUser,
  onToast
}: RecordsTableProps) {
  const [records, setJoinedRecords] = useState<JoinedRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchQuery] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const [officeFilter, setOfficeFilter] = useState("");
  const [needFilter, setNeedFilter] = useState<string[]>([]);
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState("");
  const [employmentStatusFilter, setEmploymentStatusFilter] = useState("");
  const [newlyHiredFilter, setNewlyHiredFilter] = useState("");
  const [hideNoNeeds, setHideNoNeeds] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [quarterFilter, setQuarterFilter] = useState<string[]>([]);
  const [quarterOptions, setQuarterOptions] = useState<{ key: string; label: string; count: number }[]>([]);
  const [quarterDraft, setQuarterDraft] = useState<string[]>([]);
  const [filterPopupOpen, setFilterPopupOpen] = useState(false);
  const [filterSubView, setFilterSubView] = useState<"main" | "learningNeeds" | "quarters">("main");
  const [needFilterSearch, setNeedFilterSearch] = useState("");
  const [needDraft, setNeedDraft] = useState<string[]>([]);

  const activeFilterCount = [...needFilter, officeFilter, employmentStatusFilter, newlyHiredFilter, startDate, endDate, ...quarterFilter].filter(Boolean).length;

  // Apply initial filters/search from parent dashboard
  useEffect(() => {
    if (initialFilters || initialSearch !== undefined) {
      if (initialFilters) {
        setEmploymentStatusFilter("");
        setNewlyHiredFilter("");
        setOfficeFilter("");
        setNeedFilter([]);
        setSearchQuery("");
        setDebouncedSearchTerm("");
        if (initialFilters.employmentStatus !== undefined) setEmploymentStatusFilter(initialFilters.employmentStatus);
        if (initialFilters.newlyHired !== undefined) setNewlyHiredFilter(initialFilters.newlyHired);
        if (initialFilters.office !== undefined) setOfficeFilter(initialFilters.office);
        if (initialFilters.learningNeed !== undefined) {
          const val = initialFilters.learningNeed;
          setNeedFilter(val ? [val] : []);
        }
      }
      if (initialSearch !== undefined) {
        setSearchQuery(initialSearch);
        setDebouncedSearchTerm(initialSearch);
      }
      if (onConsumeFilters) {
        onConsumeFilters();
      }
    }
  }, [initialFilters, initialSearch, onConsumeFilters]);

  // Custom Options State
  const [officeOptions, setOfficeOptions] = useState<string[]>(OFFICES);
  const [learningNeedOptions, setLearningNeedOptions] = useState<string[]>(LEARNING_NEEDS);

  const sortedLearningNeedOptions = React.useMemo(() => {
    if (needDraft.length === 0) return learningNeedOptions;
    const selected = learningNeedOptions.filter(ln => needDraft.includes(ln));
    const unselected = learningNeedOptions.filter(ln => !needDraft.includes(ln));
    return [...selected, ...unselected];
  }, [learningNeedOptions, needDraft]);

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

    fetch("/api/learning-needs/quarters", { cache: "no-store" })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setQuarterOptions(data);
        }
      })
      .catch(err => {
        console.error("[RecordsTable] Failed to load quarters:", err);
        setTimeout(() => {
          fetch("/api/learning-needs/quarters", { cache: "no-store" })
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setQuarterOptions(data); })
            .catch(retryErr => console.error("[RecordsTable] Retry failed:", retryErr));
        }, 1000);
      });
  }, [customOptionsVersion]);

  // Open Employee Details drawer from global events (e.g. Dashboard)
  useEffect(() => {
    const handleOpenDetails = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.employeeId) {
        handleViewDetails(customEvent.detail.employeeId);
      }
    };
    window.addEventListener("openEmployeeDetails", handleOpenDetails);
    return () => {
      window.removeEventListener("openEmployeeDetails", handleOpenDetails);
    };
  }, []);

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
          setNeedFilter(prev => prev.filter(k => k.toLowerCase().trim() !== value.toLowerCase().trim()));
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
  const [selectedEmployeeSeminars, setSelectedEmployeeSeminars] = useState<any[]>([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Delete confirm state
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteEmployeeConfirmId, setDeleteEmployeeConfirmId] = useState<number | null>(null);

  // Archived employees view state
  const [isArchivedView, setIsArchivedView] = useState(false);
  const [archivedEmployees, setArchivedEmployees] = useState<any[]>([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [archivedSearch, setArchivedSearch] = useState("");
  const [restoreConfirmId, setRestoreConfirmId] = useState<number | null>(null);

  // Fetch Joined Records on filter changes
  useEffect(() => {
    fetchRecords();
  }, [debouncedSearchTerm, officeFilter, needFilter.join("|"), employmentTypeFilter, employmentStatusFilter, newlyHiredFilter, hideNoNeeds, sortBy, sortOrder, isArchivedView, quarterFilter.join(",")]);

  const fetchRecords = () => {
    setLoading(true);
    let url = `/api/learning-needs?search=${encodeURIComponent(debouncedSearchTerm)}&office=${officeFilter}&learningNeed=${encodeURIComponent(needFilter.join("|"))}&employmentType=${employmentTypeFilter}&employmentStatus=${employmentStatusFilter}&newlyHired=${newlyHiredFilter}&hasNeeds=${hideNoNeeds ? "true" : ""}&archived=${isArchivedView ? "true" : ""}&sortBy=${sortBy}&sortOrder=${sortOrder}&targetSchedule=${encodeURIComponent(quarterFilter.join(","))}`;
    
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

  const handleRestoreEmployee = async (employeeId: number) => {
    try {
      await fetch(`/api/employees/${employeeId}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ performed_by: currentUser?.name || currentUser?.username || "Admin" }),
      });
      setRestoreConfirmId(null);
      fetchRecords();
      onRefreshStats?.();
    } catch (err) {
      console.error("Error restoring employee:", err);
    }
  };

  // Trigger Excel Export Download (pure client-side HTML-to-Excel)
  const handleExportExcel = () => {
    const dateStr = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const totalNeeds = groupedRecords.reduce((sum, emp) => sum + emp.Needs.length, 0);

    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8">
<style>
  table { border-collapse: collapse; font-family: Arial, sans-serif; }
  .title { background: #1E3A8A; color: white; font-size: 14pt; font-weight: bold; text-align: center; padding: 12px; }
  .subtitle { background: #F1F5F9; color: #64748B; font-size: 10pt; font-style: italic; text-align: center; padding: 6px; }
  th { background: #3B82F6; color: white; font-size: 10pt; font-weight: bold; text-align: left; padding: 8px; border: 1px solid #CBD5E1; }
  td { font-size: 10pt; padding: 6px 8px; border: 1px solid #E2E8F0; }
  tr:nth-child(even) td { background: #F8FAFC; }
</style></head><body>
<table>
<tr><td class="title" colspan="12">INDIVIDUAL LEARNING AND DEVELOPMENT PLAN (ILDP) RECORDS</td></tr>
<tr><td class="subtitle" colspan="12">Exported on: ${dateStr} | Employees: ${groupedRecords.length} | Total Learning Needs: ${totalNeeds}</td></tr>
<tr><td colspan="12" style="height:8px; border:none;"></td></tr>
<tr>
  <th>No.</th><th>Employee Name</th><th>Office/Department</th><th>Position</th>
  <th>Employment Type</th><th>Employment Status</th><th>Gender</th><th>Date of Assumption</th>
  <th>Learning Need</th><th>Basis</th><th>Methodology</th><th>Target Schedule</th>
</tr>`;

    let rowNum = 0;
    groupedRecords.forEach((emp) => {
      const fullName = formatEmployeeName(emp);
      const needs = emp.Needs.length > 0 ? emp.Needs : [null];
      needs.forEach((need) => {
        rowNum++;
        html += `<tr>
          <td style="text-align:center;">${rowNum}</td>
          <td>${fullName}</td>
          <td>${emp.Office || ""}</td>
          <td>${emp.Position || ""}</td>
          <td>${emp.EmploymentType || ""}</td>
          <td>${emp.EmploymentStatus || ""}</td>
          <td>${emp.Gender || ""}</td>
          <td>${emp.DateOfAssumption || ""}</td>
          <td>${need?.LearningNeed || ""}</td>
          <td>${need?.Basis || ""}</td>
          <td>${need?.Methodology || ""}</td>
          <td>${need?.TargetSchedule || ""}</td>
        </tr>`;
      });
    });

    html += `</table></body></html>`;

    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ILDP_Export_${new Date().toISOString().slice(0, 10)}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Show details of specific employee
  const handleViewDetails = (employeeId: number) => {
    fetch(`/api/employees/${employeeId}`)
      .then((res) => res.json())
      .then((data) => {
        setSelectedEmployeeDetail(data);
        setSelectedEmployeeNeeds(data.needs || []);
        setSelectedEmployeeSeminars(data.seminars || []);
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

    if (currentUser?.role === "Encoder") {
      const empName = records.find((r) => r.EmployeeID === deleteEmployeeConfirmId);
      const displayName = empName ? formatEmployeeName(empName) : String(deleteEmployeeConfirmId);
      fetch("/api/deletion-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": String(currentUser.id) },
        body: JSON.stringify({
          entityType: "employee",
          entityId: String(deleteEmployeeConfirmId),
          entityName: displayName,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.id) {
            setDeleteEmployeeConfirmId(null);
            onToast?.("Deletion request submitted. An admin will review it shortly.");
          } else {
            onToast?.(data.error || "Failed to submit deletion request", "error");
          }
        })
        .catch((err) => console.error("Error requesting deletion:", err));
      return;
    }

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
      Gender?: string;
      DateOfAssumption?: string;
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
      UpdatedBy?: string;
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
          Gender: rec.Gender,
          DateOfAssumption: rec.DateOfAssumption,
          Needs: [],
          CreatedAt: rec.CreatedAt,
          CreatedBy: rec.EmployeeCreatedBy || rec.CreatedBy,
          UpdatedBy: rec.EmployeeUpdatedBy || rec.UpdatedBy,
          EmployeeCreatedAt: rec.EmployeeCreatedAt || rec.CreatedAt
        });
      }
      
      const emp = map.get(rec.EmployeeID)!;
      if (rec.LearningNeedID !== null && !emp.Needs.some(n => n.LearningNeedID === rec.LearningNeedID)) {
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

  const groupedRecords = React.useMemo(() => {
    return groupRecordsByEmployee(records).filter(
      (rec) => !hideNoNeeds || rec.Needs.length > 0
    );
  }, [records, hideNoNeeds]);

  // Pagination calculation
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRecords = groupedRecords.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(groupedRecords.length / itemsPerPage);

  // Quarter-grouped data: Quarter → Learning Need → Employees
  const quarterGroupedData = React.useMemo(() => {
    if (quarterFilter.length === 0) return null;
    const selectedSet = new Set(quarterFilter);
    const quarterNeedMap = new Map<string, Map<string, { need: string; employees: { id: number; name: string; office: string; position: string }[] }>>();

    // Build a lookup of normalized quarter keys for each record
    const normQuarterKeys = (ts: string): string[] => {
      if (!ts) return [];
      const s = ts.trim();
      const keys = new Set<string>();
      const yearMatch = s.match(/(\d{4})/g);
      if (!yearMatch) return [];
      const years = [...new Set(yearMatch.map(Number))];
      const lower = s.toLowerCase().replace(/[^a-z0-9\s,\-]/g, " ").replace(/\s+/g, " ").trim();
      const qMap: Record<string, number> = { first: 1, second: 2, third: 3, fourth: 4, "1st": 1, "2nd": 2, "3rd": 3, "4th": 4 };
      const rangeMatch = lower.match(/(\d(?:st|nd|rd|th))\s*[-]\s*(\d(?:st|nd|rd|th))/);
      if (rangeMatch) {
        const start = qMap[rangeMatch[1]] || parseInt(rangeMatch[1]);
        const end = qMap[rangeMatch[2]] || parseInt(rangeMatch[2]);
        for (const y of years) for (let q = start; q <= end; q++) keys.add(`${y}-Q${q}`);
        return [...keys];
      }
      const parts = lower.split(/[,&]/);
      for (const part of parts) {
        let found = false;
        for (const [word, num] of Object.entries(qMap)) {
          if (part.includes(word)) { for (const y of years) keys.add(`${y}-Q${num}`); found = true; }
        }
        if (!found) { const dm = part.match(/\b([1-4])\b/); if (dm) for (const y of years) keys.add(`${y}-Q${dm[1]}`); }
      }
      if (keys.size > 0) return [...keys];
      for (const [word, num] of Object.entries(qMap)) {
        if (lower.includes(word)) for (const y of years) keys.add(`${y}-Q${num}`);
      }
      return [...keys];
    };

    const qLabelMap: Record<string, string> = {};
    quarterOptions.forEach(q => { qLabelMap[q.key] = q.label; });

    records.forEach((rec) => {
      if (rec.LearningNeedID === null || !rec.LearningNeed) return;
      const recKeys = normQuarterKeys(rec.TargetSchedule || "");
      for (const qKey of recKeys) {
        if (!selectedSet.has(qKey)) continue;
        if (!quarterNeedMap.has(qKey)) quarterNeedMap.set(qKey, new Map());
        const needMap = quarterNeedMap.get(qKey)!;
        const needName = rec.LearningNeed;
        if (!needMap.has(needName)) needMap.set(needName, { need: needName, employees: [] });
        const group = needMap.get(needName)!;
        if (!group.employees.some(e => e.id === rec.EmployeeID)) {
          group.employees.push({ id: rec.EmployeeID, name: formatEmployeeName(rec), office: rec.Office || "", position: rec.Position || "" });
        }
      }
    });

    return [...quarterNeedMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([qKey, needMap]) => ({
        quarter: qLabelMap[qKey] || qKey,
        needs: [...needMap.values()].sort((a, b) => a.need.localeCompare(b.need)),
      }));
  }, [records, quarterFilter, quarterOptions]);

  // Learning Need index for quarter view: flat list of unique needs with employees (including quarter per employee)
  const quarterNeedIndex = React.useMemo(() => {
    if (!quarterGroupedData) return [];
    const needMap = new Map<string, { need: string; employees: { quarter: string; id: number; name: string; office: string; position: string }[] }>();
    for (const q of quarterGroupedData) {
      for (const n of q.needs) {
        if (!needMap.has(n.need)) needMap.set(n.need, { need: n.need, employees: [] });
        const entry = needMap.get(n.need)!;
        for (const emp of n.employees) {
          if (!entry.employees.some(e => e.id === emp.id && e.quarter === q.quarter)) {
            entry.employees.push({ quarter: q.quarter, ...emp });
          }
        }
      }
    }
    return [...needMap.values()].sort((a, b) => a.need.localeCompare(b.need));
  }, [quarterGroupedData]);

  // Search within quarter Learning Need list
  const [needSearchQuery, setNeedSearchQuery] = useState("");

  const filteredQuarterNeeds = React.useMemo(() => {
    if (!needSearchQuery.trim()) return quarterNeedIndex;
    const q = needSearchQuery.toLowerCase();
    return quarterNeedIndex.filter(n => n.need.toLowerCase().includes(q));
  }, [quarterNeedIndex, needSearchQuery]);

  // Paginate by Learning Need (not employee)
  const needsPerPage = 20;
  const quarterTotalNeeds = filteredQuarterNeeds.length;
  const quarterTotalPages = Math.ceil(quarterTotalNeeds / needsPerPage);
  const quarterIndexOfLast = currentPage * needsPerPage;
  const quarterIndexOfFirst = quarterIndexOfLast - needsPerPage;
  const quarterPaginatedNeeds = filteredQuarterNeeds.slice(quarterIndexOfFirst, quarterIndexOfLast);

  // Summary counts
  const quarterTotalEmployees = React.useMemo(() => {
    const ids = new Set<number>();
    for (const n of quarterNeedIndex) for (const e of n.employees) ids.add(e.id);
    return ids.size;
  }, [quarterNeedIndex]);

  // Employee popup state
  const [needPopupOpen, setNeedPopupOpen] = useState(false);
  const [selectedNeed, setSelectedNeed] = useState<{ need: string; employees: { quarter: string; id: number; name: string; office: string; position: string }[] } | null>(null);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");

  const filteredPopupEmployees = React.useMemo(() => {
    if (!selectedNeed) return [];
    if (!employeeSearchQuery.trim()) return selectedNeed.employees;
    const q = employeeSearchQuery.toLowerCase();
    return selectedNeed.employees.filter(e => e.name.toLowerCase().includes(q) || e.office.toLowerCase().includes(q) || e.position.toLowerCase().includes(q));
  }, [selectedNeed, employeeSearchQuery]);

  const formatShortDate = (isoString: string) => {
    if (!isoString) return "N/A";
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const getStatusAlert = (rec: { EmploymentStatus?: string; StatusChangedAt?: string; DateOfAssumption?: string }) => {
    const status = rec.EmploymentStatus || "Undefined (Pending Review)";
    const baseDateStr = rec.DateOfAssumption || rec.StatusChangedAt;
    if (!baseDateStr) return null;

    const baseDate = new Date(baseDateStr);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    if (baseDate <= oneYearAgo) {
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
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setIsArchivedView(!isArchivedView); setCurrentPage(1); }}
              className={`btn-glass text-xs py-2 px-4 cursor-pointer flex items-center gap-2 ${isArchivedView ? "bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border-red-200/50 dark:border-red-900/30" : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"}`}
            >
              <Archive className="h-4 w-4" />
              <span>{isArchivedView ? "Back to Active" : "Archived"}</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="btn-glass text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-200/50 dark:border-emerald-900/30 text-xs py-2 px-4 cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Export Search to Excel</span>
            </button>
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-4 hover:border-blue-400 dark:hover:border-blue-500 transition-colors duration-200">
              <input
                type="checkbox"
                checked={hideNoNeeds}
                onChange={(e) => { setHideNoNeeds(e.target.checked); setCurrentPage(1); }}
                className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="font-semibold whitespace-nowrap">Hide No Learning Needs</span>
            </label>
          </div>
        </div>

        {isArchivedView && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 rounded-xl p-3.5 flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-2">
              <Archive className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Viewing <strong>Archived Employee Records Directory</strong>. Click an employee's name to view their full details, or click Restore to re-activate them.</span>
            </div>
            <span className="bg-amber-200/60 dark:bg-amber-900/50 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0">
              {groupedRecords.length} archived
            </span>
          </div>
        )}

        <div className="flex items-end gap-3">
          {/* Search Term */}
          <div className="w-72">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
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

          {/* Filters Button */}
          <div className="shrink-0">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              &nbsp;
            </label>
            <button
              onClick={() => setFilterPopupOpen(true)}
              className={`relative flex items-center gap-2 px-3.5 py-2 border rounded-xl text-xs font-medium transition-colors duration-200 cursor-pointer ${
                activeFilterCount > 0
                  ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 w-4.5 h-4.5 flex items-center justify-center rounded-full bg-blue-600 dark:bg-blue-500 text-white text-[9px] font-bold leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filters Modal */}
        <Modal
          isOpen={filterPopupOpen}
          onClose={() => { setFilterPopupOpen(false); setFilterSubView("main"); setNeedFilterSearch(""); }}
          title="Filters"
          maxWidth="max-w-lg"
          ariaLabel="Filters"
          hideBorders={filterSubView !== "main"}
          cardClassName="h-[470px]"
          bodyClassName="px-0"
          header={
            <div className={`flex items-center justify-between px-4 py-2.5 shrink-0 ${filterSubView !== "main" ? "" : "border-b border-slate-100 dark:border-slate-800"}`}>
              <div className="flex items-center gap-2">
                {filterSubView !== "main" && (
                  <button
                    onClick={() => { setFilterSubView("main"); setNeedFilterSearch(""); }}
                    className="p-1.5 -ml-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                  {filterSubView === "learningNeeds" ? "Learning Needs" : filterSubView === "quarters" ? "Quarters" : "Filters"}
                </h3>
              </div>
              {filterSubView === "main" && activeFilterCount > 0 && (
                <button
                  onClick={() => { setNeedFilter([]); setOfficeFilter(""); setEmploymentStatusFilter(""); setNewlyHiredFilter(""); setStartDate(""); setEndDate(""); setQuarterFilter([]); setCurrentPage(1); }}
                  className="text-[11px] font-semibold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 cursor-pointer"
                >
                  Clear All
                </button>
              )}
              {filterSubView === "learningNeeds" && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => { const filtered = learningNeedOptions.filter(ln => !needFilterSearch || ln.toLowerCase().includes(needFilterSearch.toLowerCase())); setNeedDraft([...filtered]); }}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <button
                    onClick={() => setNeedDraft([])}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              )}
              {filterSubView === "quarters" && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setQuarterDraft(quarterOptions.map(q => q.key))}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <button
                    onClick={() => setQuarterDraft([])}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          }
          footer={
            filterSubView === "learningNeeds" ? (
              <>
                <button
                  onClick={() => { setFilterSubView("main"); setNeedFilterSearch(""); }}
                  className="btn-glass text-[11px] py-1 px-2.5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setNeedFilter([...needDraft]); setFilterSubView("main"); setNeedFilterSearch(""); setCurrentPage(1); }}
                  className="btn-glass bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30 text-[11px] py-1 px-2.5 cursor-pointer font-semibold"
                >
                  Apply
                </button>
              </>
            ) : filterSubView === "quarters" ? (
              <>
                <button
                  onClick={() => setFilterSubView("main")}
                  className="btn-glass text-[11px] py-1 px-2.5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setQuarterFilter([...quarterDraft]); setFilterSubView("main"); setCurrentPage(1); }}
                  className="btn-glass bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30 text-[11px] py-1 px-2.5 cursor-pointer font-semibold"
                >
                  Apply
                </button>
              </>
            ) : (
              <button
                onClick={() => { setFilterPopupOpen(false); setFilterSubView("main"); }}
                className="btn-glass bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30 text-[11px] py-1 px-2.5 cursor-pointer font-semibold"
              >
                Done
              </button>
            )
          }
        >
          <div className="relative h-full">
            <AnimatePresence mode="wait" initial={false}>
              {filterSubView === "main" ? (
                <motion.div
                  key="main"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="absolute inset-0 overflow-y-auto space-y-4 pt-2 px-5"
                >
                  {/* Learning Need */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 px-0.5">Learning Need</label>
                    <button
                      onClick={() => { setNeedDraft([...needFilter]); setFilterSubView("learningNeeds"); }}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-xs text-left text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 truncate"
                    >
                      {needFilter.length === 0
                        ? "All Learning Needs"
                        : needFilter.length <= 2
                          ? needFilter.join(", ")
                          : `${needFilter.slice(0, 2).join(", ")} +${needFilter.length - 2} more`}
                    </button>
                  </div>

                  {/* Office */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 px-0.5">Office / Department</label>
                    <SearchableSelect
                      value={officeFilter || "All Offices"}
                      onChange={(val) => { setOfficeFilter(val === "All Offices" ? "" : val); setCurrentPage(1); }}
                      options={["All Offices", "Undefined (Pending Review)", ...officeOptions]}
                      placeholder="All Offices"
                      allowCustom={false}
                      onDeleteCustom={(val) => handleDeleteCustomOption("office", val)}
                      isCustom={(val) => val !== "All Offices" && val !== "Undefined (Pending Review)"}
                    />
                  </div>

                  {/* Employment Status */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 px-0.5">Employment Status</label>
                    <SearchableSelect
                      value={employmentStatusFilter || "All Statuses"}
                      onChange={(val) => { setEmploymentStatusFilter(val === "All Statuses" ? "" : val); setCurrentPage(1); }}
                      options={["All Statuses", "Undefined (Pending Review)", "Permanent", "Casual", "Coterminous", "Elective Official", "Job Order", "Consultant"]}
                      placeholder="All Statuses"
                      allowCustom={false}
                    />
                  </div>

                  {/* Newly Hired */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 px-0.5">New Employee</label>
                    <SearchableSelect
                      value={newlyHiredFilter || "All Hired Types"}
                      onChange={(val) => { setNewlyHiredFilter(val === "All Hired Types" ? "" : val); setCurrentPage(1); }}
                      options={["All Hired Types", "Newly Hired", "N/A"]}
                      placeholder="All Hired Types"
                      allowCustom={false}
                    />
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 px-0.5">Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 px-0.5">End Date</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200"
                      />
                    </div>
                  </div>

                  {/* Quarter */}
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Quarter</label>
                    <button
                      onClick={() => { setQuarterDraft([...quarterFilter]); setFilterSubView("quarters"); }}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl text-xs text-left text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 truncate"
                    >
                      {quarterFilter.length === 0
                        ? "All Quarters"
                        : quarterFilter.length <= 2
                          ? quarterFilter.map(k => quarterOptions.find(q => q.key === k)?.label || k).join(", ")
                          : `${quarterFilter.map(k => quarterOptions.find(q => q.key === k)?.label || k).slice(0, 2).join(", ")} +${quarterFilter.length - 2} more`}
                    </button>
                  </div>
                </motion.div>
              ) : filterSubView === "learningNeeds" ? (
                <motion.div
                  key="learningNeeds"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="absolute inset-0 flex flex-col px-5"
                >
                  {/* Search */}
                  <div className="shrink-0 mb-2">
                    <div className="relative">
                      <Search className="absolute inset-y-0 left-3 h-3.5 w-3.5 text-slate-400 my-auto" />
                      <input
                        type="text"
                        value={needFilterSearch}
                        onChange={(e) => setNeedFilterSearch(e.target.value)}
                        placeholder="Search learning needs..."
                        className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200"
                      />
                    </div>
                  </div>

                  {/* List */}
                  <div className="flex-1 min-h-0 overflow-y-auto space-y-0.5">
                    {sortedLearningNeedOptions.filter(ln => !needFilterSearch || ln.toLowerCase().includes(needFilterSearch.toLowerCase())).map((ln) => (
                      <label
                        key={ln}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                          needDraft.includes(ln)
                            ? "bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={needDraft.includes(ln)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNeedDraft(prev => [...prev, ln]);
                            } else {
                              setNeedDraft(prev => prev.filter(k => k !== ln));
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300 flex-1 truncate">{ln}</span>
                      </label>
                    ))}
                    {sortedLearningNeedOptions.filter(ln => !needFilterSearch || ln.toLowerCase().includes(needFilterSearch.toLowerCase())).length === 0 && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">{needFilterSearch ? "No Learning Needs match your search." : "No learning need options available."}</p>
                    )}
                  </div>
                </motion.div>
              ) : filterSubView === "quarters" ? (
                <motion.div
                  key="quarters"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="absolute inset-0 overflow-y-auto space-y-0.5 px-5 pt-1"
                >
                    {quarterOptions.map((q) => (
                      <label
                        key={q.key}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                          quarterDraft.includes(q.key)
                            ? "bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={quarterDraft.includes(q.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setQuarterDraft(prev => [...prev, q.key]);
                            } else {
                              setQuarterDraft(prev => prev.filter(k => k !== q.key));
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">{q.label}</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">{q.count}</span>
                      </label>
                    ))}
                    {quarterOptions.length === 0 && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">No quarter options available.</p>
                    )}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </Modal>
      </div>
      {quarterFilter.length > 0 && quarterGroupedData ? (
        <>
          <div ref={cardsContainerRef} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-xs overflow-hidden transition-colors duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">
                  {quarterTotalNeeds} Learning Need{quarterTotalNeeds !== 1 ? "s" : ""}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">·</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {quarterTotalEmployees} Employee{quarterTotalEmployees !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={needSearchQuery}
                  onChange={(e) => { setNeedSearchQuery(e.target.value); setCurrentPage(1); }}
                  placeholder="Search Learning Needs..."
                  className="w-full pl-8 pr-3 py-1.5 text-[11px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="text-center py-12 text-xs text-slate-400 dark:text-slate-500">Loading...</div>
              ) : quarterPaginatedNeeds.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2">
                    <Filter className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {needSearchQuery ? "No Learning Needs match your search." : `No Learning Needs found for the selected quarter${quarterFilter.length !== 1 ? "s" : ""}.`}
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 dark:bg-slate-950/80 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                      <th className="py-3 px-6">Learning Need</th>
                      <th className="py-3 px-6 text-right">Employees</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quarterPaginatedNeeds.map((n) => (
                      <tr
                        key={n.need}
                        onClick={() => { setSelectedNeed(n); setNeedPopupOpen(true); setEmployeeSearchQuery(""); }}
                        className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors"
                      >
                        <td className="py-2.5 px-6 text-[11px] font-semibold text-slate-800 dark:text-slate-100">{n.need}</td>
                        <td className="py-2.5 px-6 text-[11px] text-slate-500 dark:text-slate-400 text-right tabular-nums">
                          {n.employees.length} employee{n.employees.length !== 1 ? "s" : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Quarter Pagination Controls */}
            {!loading && quarterTotalNeeds > 0 && (
              <div className="bg-slate-50/50 dark:bg-slate-950/60 px-6 py-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-medium transition-colors duration-200">
                <span>
                  Showing <strong className="font-semibold text-slate-800 dark:text-slate-200">{quarterIndexOfFirst + 1}</strong> to{" "}
                  <strong className="font-semibold text-slate-800 dark:text-slate-200">
                    {quarterIndexOfLast > quarterTotalNeeds ? quarterTotalNeeds : quarterIndexOfLast}
                  </strong>{" "}
                  of <strong className="font-semibold text-slate-800 dark:text-slate-200">{quarterTotalNeeds}</strong> Learning Needs
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
                    <strong className="font-semibold text-slate-900 dark:text-slate-200">{quarterTotalPages || 1}</strong>
                  </span>
                  <button
                    disabled={currentPage === quarterTotalPages || quarterTotalPages === 0}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="btn-glass p-2 disabled:opacity-50 transition cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Learning Need Employee Popup */}
          <Modal
            isOpen={needPopupOpen}
            onClose={() => setNeedPopupOpen(false)}
            maxWidth="max-w-3xl"
            ariaLabel="Learning Need employees"
            header={
              <div className="px-6 pt-5 pb-3 shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-800 dark:text-white truncate pr-4">{selectedNeed?.need}</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
                    {filteredPopupEmployees.length} Employee{filteredPopupEmployees.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {selectedNeed && (
                  <div className="flex items-center gap-2 mt-1">
                    {[...new Set(selectedNeed.employees.map(e => e.quarter))].sort().map((q, i, arr) => (
                      <span key={q} className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                        {q}{i < arr.length - 1 ? "," : ""}
                      </span>
                    ))}
                  </div>
                )}
                <div className="relative mt-3">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={employeeSearchQuery}
                    onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                    placeholder="Search employees..."
                    className="w-full pl-8 pr-3 py-1.5 text-[11px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>
            }
          >
            {filteredPopupEmployees.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-8">No employees match your search.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold text-[10px] border-b border-slate-100 dark:border-slate-800">
                      {selectedNeed && [...new Set(selectedNeed.employees.map(e => e.quarter))].length > 1 && (
                        <th className="py-2.5 px-4">Quarter</th>
                      )}
                      <th className="py-2.5 px-4">Employee</th>
                      <th className="py-2.5 px-4">Position</th>
                      <th className="py-2.5 px-4">Office</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPopupEmployees.map((emp, i) => {
                      const showQuarter = selectedNeed && [...new Set(selectedNeed.employees.map(e => e.quarter))].length > 1;
                      return (
                        <tr key={`${emp.id}-${emp.quarter}-${i}`} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          {showQuarter && (
                            <td className="py-2 px-4 text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">{emp.quarter}</td>
                          )}
                          <td className="py-2 px-4">
                            <button
                              onClick={() => { setNeedPopupOpen(false); handleViewDetails(emp.id); }}
                              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-left"
                            >
                              {emp.name}
                            </button>
                          </td>
                          <td className="py-2 px-4 text-[11px] text-slate-600 dark:text-slate-300">{emp.position}</td>
                          <td className="py-2 px-4 text-[11px] text-slate-600 dark:text-slate-300">{emp.office}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Modal>
        </>
      ) : (
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
                <th className="py-4 px-6">Employment Status</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            
            {loading ? (
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td colSpan={5} className="py-12 text-center">
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
                  <td colSpan={5} className="py-12 text-center text-slate-400">
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
                          {formatEmployeeName(rec)}
                        </div>
                        {isRecentEntry(rec.EmployeeCreatedAt) && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            Encoded by: <span className="font-semibold text-slate-500 dark:text-slate-400">{rec.CreatedBy || "system"}</span>
                            {rec.UpdatedBy && rec.UpdatedBy !== rec.CreatedBy && (
                              <>
                                <span className="mx-1.5 text-slate-300 dark:text-slate-700">|</span>
                                Last edited by: <span className="font-semibold text-slate-500 dark:text-slate-400">{rec.UpdatedBy}</span>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-6 text-slate-600 dark:text-slate-200 align-middle text-[12px] font-medium">
                        {renderPendingText(rec.Office)}
                      </td>
                      <td className="py-3 px-6 text-slate-600 dark:text-slate-200 align-middle text-[12px] font-medium">
                        {renderPendingText(rec.Position)}
                      </td>
                      <td className="py-3 px-6 text-slate-600 dark:text-slate-200 align-middle text-[12px] font-medium">
                        <div className="flex items-center gap-1.5">
                          <span>{renderPendingText(rec.EmploymentStatus)}</span>
                          {alertText && (
                            <span className="inline-flex items-center text-amber-600 dark:text-amber-400 cursor-help" title={alertText}>
                              <AlertTriangle className="h-4 w-4 shrink-0 animate-pulse" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-6 text-center align-middle">
                        <div className="flex items-center justify-center gap-1.5">
                          {isArchivedView ? (
                            <button
                              onClick={() => setRestoreConfirmId(rec.EmployeeID)}
                              className="btn-glass bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/30 text-xs py-1.5 px-3 cursor-pointer font-bold flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all"
                              title="Restore Employee to Active List"
                            >
                              <ArchiveRestore className="h-3.5 w-3.5" />
                              <span>Restore</span>
                            </button>
                          ) : (
                            <>
                              {/* Edit Records */}
                              <button
                                onClick={() => onEditEmployee(rec.EmployeeID)}
                                className="btn-glass bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30 p-2 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-all duration-100"
                                title="Edit Full Profile"
                              >
                                <Edit className="h-4 w-4" />
                              </button>

                              {/* Delete Employee */}
                              {(can(currentUser?.role, PERMISSIONS.EMPLOYEE_DELETE) || currentUser?.role === "Encoder") && (
                                <button
                                  onClick={() => handleDeleteEmployee(rec.EmployeeID)}
                                  className="btn-glass bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border-red-200/50 dark:border-red-900/30 p-2 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-all duration-100"
                                  title={currentUser?.role === "Encoder" ? "Request Deletion" : "Delete Employee"}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          )}
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
                            <span className="text-[9.5px] font-extrabold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-300/30 dark:border-slate-800/60 shadow-xs">
                              {rec.Needs.length} {rec.Needs.length === 1 ? "need" : "needs"}
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 w-full">
                          {rec.Needs.map((need) => (
                            <div 
                              key={need.LearningNeedID} 
                              className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-3 relative group/need space-y-1.5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-100"
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
      )}


      {/* Restore Confirmation Modal */}
      <Modal
        isOpen={!!restoreConfirmId}
        onClose={() => setRestoreConfirmId(null)}
        maxWidth="max-w-sm"
        ariaLabel="Restore Employee"
        title="Restore Employee?"
      >
        <p className="text-xs text-slate-500 dark:text-slate-400">
          This will move the employee back to the active employee list. Their learning needs and seminar history will remain intact.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={() => setRestoreConfirmId(null)}
            className="btn-glass text-xs py-2 px-4 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => restoreConfirmId && handleRestoreEmployee(restoreConfirmId)}
            className="btn-glass bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/30 text-xs py-2 px-4 cursor-pointer font-bold shadow-md shadow-emerald-500/5"
          >
            Restore Employee
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal Overlay */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        maxWidth="max-w-sm"
        ariaLabel="Delete Learning Need"
        title="Delete Learning Need?"
      >
        <p className="text-xs text-slate-500 dark:text-slate-400">
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
      </Modal>

      {/* Delete Employee Confirmation Modal Overlay */}
      <Modal
        isOpen={!!deleteEmployeeConfirmId}
        onClose={() => setDeleteEmployeeConfirmId(null)}
        maxWidth="max-w-sm"
        ariaLabel={currentUser?.role === "Encoder" ? "Request Deletion" : "Delete Employee"}
        title={currentUser?.role === "Encoder" ? "Request Deletion?" : "Delete Employee?"}
      >
        {currentUser?.role === "Encoder" ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            This will submit a deletion request to an administrator for approval. The employee will not be deleted until approved.
          </p>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            This will permanently delete this employee and all associated learning needs from the database. This action is irreversible.
          </p>
        )}
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
            {currentUser?.role === "Encoder" ? "Submit Request" : "Confirm Delete"}
          </button>
        </div>
      </Modal>

      {/* View Employee Detail Drawer */}
      <EmployeeProfileDrawer
        isOpen={detailModalOpen}
        employee={selectedEmployeeDetail}
        needs={selectedEmployeeNeeds}
        seminars={selectedEmployeeSeminars}
        onClose={() => setDetailModalOpen(false)}
        onEdit={(empId) => { setDetailModalOpen(false); onEditEmployee(empId); }}
        onNavigateToSeminar={(year, quarter, semId) => {
          if (typeof (window as any)._navigateToSeminar === "function") {
            (window as any)._navigateToSeminar(year, quarter, semId);
          }
        }}
      />
    </div>
  );
}
