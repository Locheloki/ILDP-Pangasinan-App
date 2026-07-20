import React, { useState, useEffect, useRef } from "react";
import { 
  Calendar, 
  Users, 
  Search, 
  ArrowUpDown, 
  ChevronRight, 
  ArrowLeft, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertTriangle,
  Info,
  X,
  User,
  Plus,
  Trash2,
  ListFilter
} from "lucide-react";
import { Seminar, Employee, LearningNeed } from "../types";
import StickyBackButton from "./StickyBackButton";

interface SeminarsProps {
  year: number | null;
  quarter: "Q1" | "Q2" | "Q3" | "Q4" | null;
  onSelectEmployee: (empId: number) => void;
  currentUser: any;
  onSeminarChange?: () => void;
}

interface SeminarFormModalProps {
  title: string;
  submitLabel: string;
  titleValue: string;
  yearValue: number;
  quarterValue: "Q1" | "Q2" | "Q3" | "Q4";
  dateValue: string;
  locationValue: string;
  speakerValue: string;
  remarksValue: string;
  onTitleChange: (v: string) => void;
  onYearChange: (v: number) => void;
  onQuarterChange: (v: "Q1" | "Q2" | "Q3" | "Q4") => void;
  onDateChange: (v: string) => void;
  onLocationChange: (v: string) => void;
  onSpeakerChange: (v: string) => void;
  onRemarksChange: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

function SeminarFormModal({ title, submitLabel, titleValue, yearValue, quarterValue, dateValue, locationValue, speakerValue, remarksValue, onTitleChange, onYearChange, onQuarterChange, onDateChange, onLocationChange, onSpeakerChange, onRemarksChange, onSubmit, onClose }: SeminarFormModalProps) {
  const titleRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submitRef.current?.click();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-label={title}>
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl animate-scale-up relative z-50 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-6 pt-5 pb-3 shrink-0">
          <h3 className="text-base font-bold text-slate-800 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-all duration-100 cursor-pointer" aria-label="Close dialog">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 pb-5 space-y-4 text-left overflow-y-auto flex-1 min-h-0">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Seminar Name / Title</label>
            <input ref={titleRef} type="text" placeholder="e.g. Leadership Development Seminar" value={titleValue} onChange={(e) => onTitleChange(e.target.value)} className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 dark:text-white font-semibold transition-colors duration-200" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Year</label>
              <input type="number" value={yearValue} onChange={(e) => onYearChange(Number(e.target.value))} className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 dark:text-white font-semibold transition-colors duration-200" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Quarter</label>
              <select value={quarterValue} onChange={(e) => onQuarterChange(e.target.value as any)} className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 dark:text-white font-semibold transition-colors duration-200">
                <option value="Q1">Q1</option>
                <option value="Q2">Q2</option>
                <option value="Q3">Q3</option>
                <option value="Q4">Q4</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Date</label>
              <input type="date" value={dateValue} onChange={(e) => onDateChange(e.target.value)} className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 dark:text-white font-semibold transition-colors duration-200" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Venue / Location</label>
              <input type="text" placeholder="e.g. Training Center" value={locationValue} onChange={(e) => onLocationChange(e.target.value)} className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 dark:text-white font-semibold transition-colors duration-200" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Facilitator / Speaker</label>
            <input type="text" placeholder="e.g. John Doe, HR Expert" value={speakerValue} onChange={(e) => onSpeakerChange(e.target.value)} className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 dark:text-white font-semibold transition-colors duration-200" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Description / Remarks</label>
            <textarea placeholder="e.g. Attendance is mandatory for all department heads" value={remarksValue} onChange={(e) => onRemarksChange(e.target.value)} rows={2} className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 dark:text-white font-semibold transition-colors duration-200 resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button onClick={onClose} className="btn-glass text-xs py-2 px-4 cursor-pointer font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform duration-100">
            Cancel <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal ml-1">Esc</span>
          </button>
          <button ref={submitRef} onClick={onSubmit} className="btn-glass bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 text-xs py-2 px-5 cursor-pointer font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-blue-500/5 transition-transform duration-100">
            {submitLabel} <span className="text-[10px] text-blue-400 dark:text-blue-300 font-normal ml-1">Ctrl+Enter</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Seminars({ year, quarter, onSelectEmployee, currentUser, onSeminarChange }: SeminarsProps) {
  // Navigation State
  const [view, setView] = useState<"list" | "details" | "import">("list");
  
  // Data State
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [selectedSeminar, setSelectedSeminar] = useState<Seminar | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Manual Seminar Creation & Editing States
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualYear, setManualYear] = useState<number>(2026);
  const [manualQuarter, setManualQuarter] = useState<"Q1" | "Q2" | "Q3" | "Q4">("Q2");
  const [manualDate, setManualDate] = useState("");
  const [manualLocation, setManualLocation] = useState("");
  const [manualSpeaker, setManualSpeaker] = useState("");
  const [manualRemarks, setManualRemarks] = useState("");

  const [editTitle, setEditTitle] = useState("");
  const [editYear, setEditYear] = useState<number>(2026);
  const [editQuarter, setEditQuarter] = useState<"Q1" | "Q2" | "Q3" | "Q4">("Q2");
  const [editDate, setEditDate] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editSpeaker, setEditSpeaker] = useState("");
  const [editRemarks, setEditRemarks] = useState("");

  // Interactive Attendee Picker states
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerEmployees, setPickerEmployees] = useState<Employee[]>([]);
  const [selectedPickerIds, setSelectedPickerIds] = useState<number[]>([]);

  // Employee Profile Quick View (read-only)
  const [profileEmployee, setProfileEmployee] = useState<Employee | null>(null);
  const [profileNeeds, setProfileNeeds] = useState<LearningNeed[]>([]);
  const [profileSeminars, setProfileSeminars] = useState<any[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Import Wizard State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<{
    title: string;
    year: number;
    quarter: "Q1" | "Q2" | "Q3" | "Q4";
    date: string;
    location: string;
    remarks: string;
    matched: any[];
    unmatched: any[];
  } | null>(null);
  
  const [matchingSearch, setMatchingSearch] = useState("");
  const [matchingResults, setMatchingResults] = useState<Employee[]>([]);
  const [activeUnmatchedIndex, setActiveUnmatchedIndex] = useState<number | null>(null);
  const [importSummary, setImportSummary] = useState<{
    success: boolean;
    added: number;
    skipped: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch seminars for the chosen year/quarter
  useEffect(() => {
    fetchSeminars();
    setView("list");
  }, [year, quarter]);

  useEffect(() => {
    const handleOpenSeminar = (e: any) => {
      if (e.detail?.seminarId) {
        handleSelectSeminar(e.detail.seminarId);
      }
    };
    window.addEventListener("openSeminarDetails", handleOpenSeminar);
    return () => window.removeEventListener("openSeminarDetails", handleOpenSeminar);
  }, []);

  const fetchSeminars = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/seminars");
      if (res.ok) {
        const data = await res.json();
        let filtered = data;
        if (year) {
          filtered = filtered.filter((s: Seminar) => s.year === year);
        }
        if (quarter) {
          filtered = filtered.filter((s: Seminar) => s.quarter === quarter);
        }
        setSeminars(filtered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSeminar = async (semId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/seminars/${semId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedSeminar(data);
        setView("details");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSeminar = async (semId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this seminar and all attendee associations?")) return;
    try {
      const res = await fetch(`/api/seminars/${semId}`, { method: "DELETE" });
      if (res.ok) {
        fetchSeminars();
        if (onSeminarChange) onSeminarChange();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Drag and Drop files handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUploadPreview(file);
  };

  const handleUploadPreview = async (file: File) => {
    setUploadFile(file);
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/seminars/import-preview", {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewData({
          title: data.title || "",
          year: data.year || year || 2026,
          quarter: data.quarter || quarter || "Q2",
          date: data.date || "",
          location: "",
          remarks: "",
          matched: data.matched || [],
          unmatched: data.unmatched || []
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Search DB for manual linking
  useEffect(() => {
    if (matchingSearch.trim().length > 1) {
      const delay = setTimeout(async () => {
        try {
          const res = await fetch(`/api/employees?search=${encodeURIComponent(matchingSearch)}`);
          if (res.ok) {
            const data = await res.json();
            setMatchingResults(data.employees || []);
          }
        } catch (err) {
          console.error(err);
        }
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setMatchingResults([]);
    }
  }, [matchingSearch]);

  const handleLinkEmployee = (emp: Employee) => {
    if (activeUnmatchedIndex === null || !previewData) return;
    const target = previewData.unmatched[activeUnmatchedIndex];
    
    // Move from unmatched to matched
    const newMatched = [...previewData.matched, {
      rawName: target.rawName,
      office: target.office,
      EmployeeID: emp.EmployeeID,
      FirstName: emp.FirstName,
      LastName: emp.LastName,
      MiddleInitial: emp.MiddleInitial,
      Office: emp.Office,
      Position: emp.Position
    }];

    const newUnmatched = previewData.unmatched.filter((_, idx) => idx !== activeUnmatchedIndex);

    setPreviewData({
      ...previewData,
      matched: newMatched,
      unmatched: newUnmatched
    });

    setActiveUnmatchedIndex(null);
    setMatchingSearch("");
    setMatchingResults([]);
  };

  const handleExecuteImport = async () => {
    if (!previewData) return;
    setLoading(true);
    try {
      const res = await fetch("/api/seminars/import-execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(previewData)
      });
      if (res.ok) {
        const data = await res.json();
        setImportSummary({
          success: true,
          added: data.attendeesAdded,
          skipped: data.duplicatesSkipped
        });
        fetchSeminars();
        if (onSeminarChange) onSeminarChange();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetImport = () => {
    setUploadFile(null);
    setPreviewData(null);
    setImportSummary(null);
    setActiveUnmatchedIndex(null);
    setView("list");
  };

  // 1. Manual Create Seminar
  const handleCreateSeminar = async () => {
    if (!manualTitle || !manualYear || !manualQuarter) {
      alert("Title, Year, and Quarter are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/seminars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: manualTitle,
          year: Number(manualYear),
          quarter: manualQuarter,
          date: manualDate,
          location: manualLocation,
          speaker: manualSpeaker,
          remarks: manualRemarks
        })
      });
      if (res.ok) {
        setIsManualModalOpen(false);
        setManualTitle("");
        setManualDate("");
        setManualLocation("");
        setManualSpeaker("");
        setManualRemarks("");
        fetchSeminars();
        if (onSeminarChange) onSeminarChange();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Open Edit Form
  const triggerOpenEdit = () => {
    if (!selectedSeminar) return;
    setEditTitle(selectedSeminar.title);
    setEditYear(selectedSeminar.year);
    setEditQuarter(selectedSeminar.quarter);
    setEditDate(selectedSeminar.date || "");
    setEditLocation(selectedSeminar.location || "");
    setEditSpeaker(selectedSeminar.speaker || "");
    setEditRemarks(selectedSeminar.remarks || "");
    setIsEditModalOpen(true);
  };

  // 3. Update Seminar Metadata
  const handleUpdateSeminar = async () => {
    if (!selectedSeminar) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/seminars/${selectedSeminar.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          year: Number(editYear),
          quarter: editQuarter,
          date: editDate,
          location: editLocation,
          speaker: editSpeaker,
          remarks: editRemarks
        })
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        // Refresh details
        handleSelectSeminar(selectedSeminar.id);
        fetchSeminars();
        if (onSeminarChange) onSeminarChange();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 4. Attendee Picker search effect
  useEffect(() => {
    if (!isPickerOpen) return;
    if (pickerSearch.trim().length > 1) {
      const delay = setTimeout(async () => {
        try {
          const res = await fetch(`/api/employees?search=${encodeURIComponent(pickerSearch)}`);
          if (res.ok) {
            const data = await res.json();
            // Filter out employees who are already registered as attendees in the current seminar
            const currentAttendeeIds = (selectedSeminar?.attendees || []).map(a => a.EmployeeID);
            const filtered = (data.employees || []).filter(
              (emp: Employee) => !currentAttendeeIds.includes(emp.EmployeeID)
            );
            setPickerEmployees(filtered);
          }
        } catch (err) {
          console.error(err);
        }
      }, 250);
      return () => clearTimeout(delay);
    } else {
      // Load all employees by default if empty search
      fetch("/api/employees")
        .then(res => res.json())
        .then(data => {
          const currentAttendeeIds = (selectedSeminar?.attendees || []).map(a => a.EmployeeID);
          const filtered = (data.employees || []).filter(
            (emp: Employee) => !currentAttendeeIds.includes(emp.EmployeeID)
          );
          setPickerEmployees(filtered);
        })
        .catch(err => console.error(err));
    }
  }, [pickerSearch, isPickerOpen, selectedSeminar]);

  // 5. Submit Picker Attendees
  const handleAddAttendees = async () => {
    if (!selectedSeminar || selectedPickerIds.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/seminars/${selectedSeminar.id}/attendees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeIds: selectedPickerIds })
      });
      if (res.ok) {
        setIsPickerOpen(false);
        setSelectedPickerIds([]);
        setPickerSearch("");
        handleSelectSeminar(selectedSeminar.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 5b. Open Employee Profile Quick View (read-only)
  const handleViewProfile = async (employeeId: number) => {
    try {
      const res = await fetch(`/api/employees/${employeeId}`);
      const data = await res.json();
      setProfileEmployee(data);
      setProfileNeeds(data.needs || []);
      setProfileSeminars(data.seminars || []);
      setIsProfileOpen(true);
    } catch (err) {
      console.error("Error loading profile:", err);
    }
  };

  // 6. Delete Attendee Link
  const handleRemoveAttendee = async (employeeId: number) => {
    if (!selectedSeminar) return;
    if (!confirm("Are you sure you want to remove this employee from the attendees list?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/seminars/${selectedSeminar.id}/attendees/${employeeId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        handleSelectSeminar(selectedSeminar.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filtering / Sorting logic
  const filteredAttendees = (selectedSeminar?.attendees || []).filter(a => {
    const term = searchTerm.toLowerCase();
    return (
      a.FirstName.toLowerCase().includes(term) ||
      a.LastName.toLowerCase().includes(term) ||
      a.Office.toLowerCase().includes(term) ||
      a.Position.toLowerCase().includes(term)
    );
  });

  const sortedAttendees = [...filteredAttendees].sort((a, b) => {
    const nameA = `${a.LastName}, ${a.FirstName}`.toLowerCase();
    const nameB = `${b.LastName}, ${b.FirstName}`.toLowerCase();
    return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
  });

  return (
    <div className="space-y-6">
      {/* HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {view === "list" && `Seminars Catalog — ${year || "All"} ${quarter || "All Quarters"}`}
            {view === "details" && selectedSeminar?.title}
            {view === "import" && "Import Seminar Attendances"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {view === "list" && `Browse and import training attendance spreadsheets for dynamic directories.`}
            {view === "details" && `${selectedSeminar?.attendees?.length || 0} attendees registered under year ${selectedSeminar?.year} (${selectedSeminar?.quarter})`}
            {view === "import" && "Map and synchronize custom spreadsheet attendances with your employee database."}
          </p>
        </div>

        {view === "list" && (currentUser?.role === "Administrator" || currentUser?.role === "System developer") && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsManualModalOpen(true)}
              className="btn-glass bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30 text-xs py-2 px-4 rounded-xl flex items-center gap-2 cursor-pointer font-bold transition hover:scale-102"
            >
              <Plus className="h-4 w-4" />
              <span>New Seminar</span>
            </button>
            <button
              onClick={() => setView("import")}
              className="btn-glass bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 text-xs py-2 px-4 rounded-xl flex items-center gap-2 cursor-pointer font-bold transition hover:scale-102"
            >
              <Upload className="h-4 w-4" />
              <span>Import Seminar Attendance</span>
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Processing request...</span>
        </div>
      )}

      {/* 1. SEMINARS LIST VIEW */}
      {!loading && view === "list" && (
        <>
          {seminars.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="p-4 bg-slate-50 dark:bg-slate-850/60 text-slate-400 rounded-full">
                <Calendar className="h-8 w-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">No seminars logged for {year} ({quarter || "All Quarters"})</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                No attendance sheets have been imported yet. Use the import button above to ingest your first XLSX file.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {seminars.map((sem) => (
                <div
                  key={sem.id}
                  onClick={() => handleSelectSeminar(sem.id)}
                  className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/10 rounded-2xl p-5 hover:border-blue-500/50 dark:hover:border-blue-500/30 shadow-xs hover:shadow-md transition duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-slate-100 dark:bg-slate-800/80 text-slate-650 dark:text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-md border border-slate-200/40 dark:border-white/5">
                          {sem.year}
                        </span>
                        <span className="bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-[10px] font-bold px-2.5 py-1 rounded-md">
                          {sem.quarter}
                        </span>
                      </div>
                      {(currentUser?.role === "Administrator" || currentUser?.role === "System developer") && (
                        <button
                          onClick={(e) => handleDeleteSeminar(sem.id, e)}
                          className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer"
                          title="Delete Seminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-blue-500 transition duration-150">
                        {sem.title}
                      </h4>
                      <div className="flex flex-col gap-0.5 mt-1">
                        {sem.date && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            Date: {new Date(sem.date).toLocaleDateString(undefined, { dateStyle: "medium" })}
                          </span>
                        )}
                        {sem.location && (
                          <span className="text-[10px] text-slate-450 dark:text-slate-400 font-medium">
                            Venue: {sem.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-150 dark:border-slate-800/80">
                    <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                      <Users className="h-4 w-4 text-slate-400" />
                      {sem.attendees?.length || 0} Registered Attendees
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition duration-150" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 2. SEMINAR DETAILS VIEW */}
      {!loading && view === "details" && selectedSeminar && (
        <div className="space-y-6">
          <button
            onClick={() => setView("list")}
            data-sticky-anchor
            className="btn-glass hover:bg-slate-100 dark:hover:bg-slate-800 text-xs py-2 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer font-semibold transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Seminars</span>
          </button>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-450 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                  {selectedSeminar.year} Seminar
                </span>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-1.5">{selectedSeminar.title}</h3>
                <div className="flex flex-col gap-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {selectedSeminar.date && (
                    <p>
                      Conducted on: <strong>{new Date(selectedSeminar.date).toLocaleDateString(undefined, { dateStyle: "long" })}</strong>
                    </p>
                  )}
                  {selectedSeminar.speaker && (
                    <p>
                      Facilitator / Speaker: <strong className="text-blue-500 dark:text-blue-400">{selectedSeminar.speaker}</strong>
                    </p>
                  )}
                  {selectedSeminar.location && (
                    <p>
                      Venue: <strong>{selectedSeminar.location}</strong>
                    </p>
                  )}
                  {selectedSeminar.remarks && (
                    <p className="italic">
                      Remarks: "{selectedSeminar.remarks}"
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {(currentUser?.role === "Administrator" || currentUser?.role === "System developer") && (
                  <button
                    onClick={triggerOpenEdit}
                    className="btn-glass bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 text-xs py-2.5 px-4 rounded-xl font-bold cursor-pointer transition"
                  >
                    Edit Seminar
                  </button>
                )}
                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-white/5 rounded-xl p-4 flex items-center gap-3 shrink-0 shadow-2xs">
                  <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Attendee Count</span>
                    <span className="text-lg font-bold text-slate-850 dark:text-white leading-none">{selectedSeminar.attendees?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SEARCH & SORT TABLE CONTROLS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search attendees by name, office, or position..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs text-slate-885 dark:text-slate-100 transition-colors"
                />
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                  className="btn-glass text-xs py-2 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer font-semibold"
                >
                  <ArrowUpDown className="h-4 w-4 text-slate-400" />
                  <span>Sort Alphabetical ({sortOrder === "asc" ? "A-Z" : "Z-A"})</span>
                </button>

                {(currentUser?.role === "Administrator" || currentUser?.role === "System developer") && (
                  <button
                    onClick={() => setIsPickerOpen(true)}
                    className="btn-glass bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 text-xs py-2 px-4 rounded-xl flex items-center gap-2 cursor-pointer font-bold transition hover:scale-102"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Attendees</span>
                  </button>
                )}
              </div>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl shadow-3xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                    <th className="p-3.5">Name</th>
                    <th className="p-3.5">Office / Hospital</th>
                    <th className="p-3.5">Position</th>
                    <th className="p-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                  {sortedAttendees.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400 font-medium">
                        No attendees match your search query.
                      </td>
                    </tr>
                  ) : (
                    sortedAttendees.map((a) => (
                      <tr 
                        key={a.id} 
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition duration-100 group"
                      >
                        <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">
                          {a.LastName}, {a.FirstName} {a.MiddleInitial || ""}
                        </td>
                        <td className="p-3.5 text-slate-500 dark:text-slate-400">{a.Office}</td>
                        <td className="p-3.5 text-slate-500 dark:text-slate-400">{a.Position}</td>
                        <td className="p-3.5 text-center flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleViewProfile(a.EmployeeID)}
                            className="text-blue-500 hover:text-blue-600 font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>Profile</span>
                            <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition duration-150" />
                          </button>
                          {(currentUser?.role === "Administrator" || currentUser?.role === "System developer") && (
                            <button
                              onClick={() => handleRemoveAttendee(a.EmployeeID)}
                              className="text-slate-400 hover:text-red-500 p-1 rounded transition cursor-pointer"
                              title="Remove Attendee"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. EXCEL IMPORT WIZARD */}
      {!loading && view === "import" && (
        <div className="space-y-6">
          <button
            onClick={resetImport}
            data-sticky-anchor
            className="btn-glass hover:bg-slate-100 dark:hover:bg-slate-800 text-xs py-2 px-3.5 rounded-xl flex items-center gap-2 cursor-pointer font-semibold transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Cancel Import</span>
          </button>

          {!previewData && !importSummary && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center space-y-4">
              <div className="p-5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-full">
                <FileSpreadsheet className="h-10 w-10" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Upload Seminar Excel File</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Drag and drop your spreadsheet here or click below to browse files. Accepts .xlsx formats.
                </p>
              </div>
              
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-glass bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 text-xs py-3 px-6 rounded-xl font-bold transition cursor-pointer"
              >
                Select Spreadsheet File
              </button>
            </div>
          )}

          {/* 3.2 PREVIEW DATA VIEW */}
          {previewData && !importSummary && (
            <div className="space-y-6">
              {/* Seminar Config Panel */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Configure Seminar Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Seminar Name / Title
                    </label>
                    <input
                      type="text"
                      value={previewData.title}
                      onChange={(e) => setPreviewData({ ...previewData, title: e.target.value })}
                      className="block w-full px-3.5 py-2 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-850 dark:text-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Year
                    </label>
                    <input
                      type="number"
                      value={previewData.year}
                      onChange={(e) => setPreviewData({ ...previewData, year: Number(e.target.value) })}
                      className="block w-full px-3.5 py-2 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-850 dark:text-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Quarter
                    </label>
                    <select
                      value={previewData.quarter}
                      onChange={(e) => setPreviewData({ ...previewData, quarter: e.target.value as any })}
                      className="block w-full px-3.5 py-2 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-850 dark:text-white font-semibold"
                    >
                      <option value="Q1">Q1 (Jan - Mar)</option>
                      <option value="Q2">Q2 (Apr - Jun)</option>
                      <option value="Q3">Q3 (Jul - Sep)</option>
                      <option value="Q4">Q4 (Oct - Dec)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Seminar Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={previewData.date}
                      onChange={(e) => setPreviewData({ ...previewData, date: e.target.value })}
                      className="block w-full px-3.5 py-2 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-850 dark:text-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Location (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Provincial Training Center"
                      value={previewData.location}
                      onChange={(e) => setPreviewData({ ...previewData, location: e.target.value })}
                      className="block w-full px-3.5 py-2 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-850 dark:text-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Remarks
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Conducted by CEEOD trainers"
                      value={previewData.remarks}
                      onChange={(e) => setPreviewData({ ...previewData, remarks: e.target.value })}
                      className="block w-full px-3.5 py-2 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-850 dark:text-white font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Metrics Alerts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
                  <div className="p-2 bg-emerald-500/25 text-emerald-700 dark:text-emerald-400 rounded-lg">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 block uppercase tracking-wider">Matched Employees</span>
                    <span className="text-lg font-bold text-slate-800 dark:text-white leading-none">{previewData.matched.length} mapped automatically</span>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
                  <div className="p-2 bg-amber-500/25 text-amber-700 dark:text-amber-400 rounded-lg">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-400 block uppercase tracking-wider">Unmatched Staging Records</span>
                    <span className="text-lg font-bold text-slate-800 dark:text-white leading-none">{previewData.unmatched.length} require manual validation</span>
                  </div>
                </div>
              </div>

              {/* Staging & Mapping View */}
              {previewData.unmatched.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/10 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <Info className="h-4.5 w-4.5 text-blue-500" />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">Unmatched Employees Validation</h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    The following names from the sheet were not matched with employees in the database. Link them manually to resolve them or import them.
                  </p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Unmatched list */}
                    <div className="border border-slate-150 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto shadow-inner bg-slate-50/50 dark:bg-slate-950/20">
                      {previewData.unmatched.map((un, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setActiveUnmatchedIndex(idx);
                            setMatchingSearch(un.rawName.split(",")[0].trim()); // Pre-fill with surname
                          }}
                          className={`p-3 text-xs flex items-center justify-between cursor-pointer transition duration-150 ${
                            activeUnmatchedIndex === idx 
                              ? "bg-blue-500/10 border-l-2 border-blue-500 text-blue-700 dark:text-blue-400" 
                              : "hover:bg-slate-100/60 dark:hover:bg-slate-900/60 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <div>
                            <span className="font-bold block">{un.rawName}</span>
                            <span className="text-[10px] text-slate-400 block">Office: {un.office || "Unknown"}</span>
                          </div>
                          <span className="text-[10px] bg-slate-200 dark:bg-slate-850 text-slate-500 py-0.5 px-2 rounded-md font-semibold shrink-0">
                            Click to Match
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Manual Linker search console */}
                    <div className="bg-slate-50 dark:bg-slate-950/30 border border-slate-200/65 dark:border-white/5 rounded-xl p-4 flex flex-col justify-between min-h-[300px]">
                      {activeUnmatchedIndex === null ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                          <User className="h-8 w-8 text-slate-300" />
                          <span className="text-xs font-semibold">Select an unmatched employee to link</span>
                        </div>
                      ) : (
                        <div className="space-y-4 flex-1 flex flex-col">
                          <div>
                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block">Staged Name</span>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">
                              {previewData.unmatched[activeUnmatchedIndex].rawName}
                            </h4>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                              Search Database
                            </label>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Search employees by name or surname..."
                                value={matchingSearch}
                                onChange={(e) => setMatchingSearch(e.target.value)}
                                className="block w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-855 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 dark:text-slate-100 transition-colors"
                              />
                            </div>
                          </div>

                          {/* Search Results */}
                          <div className="flex-1 overflow-y-auto max-h-48 border border-slate-200/50 dark:border-slate-850 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 shadow-3xs">
                            {matchingResults.length === 0 ? (
                              <div className="p-4 text-center text-xs text-slate-400">
                                {matchingSearch.trim().length > 1 ? "No matching employees found" : "Type to start searching"}
                              </div>
                            ) : (
                              matchingResults.slice(0, 10).map((emp) => (
                                <div
                                  key={emp.EmployeeID}
                                  onClick={() => handleLinkEmployee(emp)}
                                  className="p-2.5 hover:bg-blue-500/5 dark:hover:bg-blue-500/10 cursor-pointer flex items-center justify-between text-xs"
                                >
                                  <div>
                                    <span className="font-bold text-slate-800 dark:text-white block">
                                      {emp.LastName}, {emp.FirstName} {emp.MiddleInitial || ""}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block">{emp.Office} · {emp.Position}</span>
                                  </div>
                                  <span className="text-[10px] text-blue-500 font-bold uppercase hover:underline">
                                    Link & Map
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetImport}
                  className="btn-glass text-xs py-2.5 px-5 cursor-pointer font-bold rounded-xl"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  className="btn-glass bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 text-xs py-2.5 px-6 font-extrabold cursor-pointer rounded-xl transition hover:scale-102"
                >
                  Confirm & Sync Attendance List
                </button>
              </div>
            </div>
          )}

          {/* 3.3 IMPORT SUMMARY DASHBOARD */}
          {importSummary && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/10 rounded-2xl p-8 max-w-md mx-auto text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-xs border border-emerald-500/20">
                <CheckCircle className="h-8 w-8 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Seminar Attendance Synchronized!</h3>
                <p className="text-xs text-slate-500">
                  Spreadsheet records parsed and mapped with database employee files successfully.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/45 border border-slate-150 dark:border-white/5 rounded-2xl p-4 text-xs space-y-2.5 text-left shadow-inner">
                <div className="flex justify-between">
                  <span className="text-slate-500">New attendees linked:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{importSummary.added} records</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Duplicate entries skipped:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{importSummary.skipped} entries</span>
                </div>
                <div className="flex justify-between border-t border-slate-250 dark:border-slate-800/80 pt-2.5">
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">Total seminar strength:</span>
                  <span className="font-bold text-blue-500">{importSummary.added + importSummary.skipped} attendees</span>
                </div>
              </div>

              <button
                onClick={resetImport}
                className="btn-glass bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 text-xs py-2.5 w-full font-bold rounded-xl cursor-pointer"
              >
                Close & Return
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. MANUAL SEMINAR CREATION DIALOG MODAL */}
      {isManualModalOpen && (
        <SeminarFormModal
          title="Create New Seminar Manually"
          submitLabel="Save Seminar"
          titleValue={manualTitle}
          yearValue={manualYear}
          quarterValue={manualQuarter}
          dateValue={manualDate}
          locationValue={manualLocation}
          speakerValue={manualSpeaker}
          remarksValue={manualRemarks}
          onTitleChange={setManualTitle}
          onYearChange={setManualYear}
          onQuarterChange={setManualQuarter}
          onDateChange={setManualDate}
          onLocationChange={setManualLocation}
          onSpeakerChange={setManualSpeaker}
          onRemarksChange={setManualRemarks}
          onSubmit={handleCreateSeminar}
          onClose={() => setIsManualModalOpen(false)}
        />
      )}
      {/* 5. EDIT SEMINAR DETAILS DIALOG MODAL */}
      {isEditModalOpen && (
        <SeminarFormModal
          title="Modify Seminar Properties"
          submitLabel="Update Info"
          titleValue={editTitle}
          yearValue={editYear}
          quarterValue={editQuarter}
          dateValue={editDate}
          locationValue={editLocation}
          speakerValue={editSpeaker}
          remarksValue={editRemarks}
          onTitleChange={setEditTitle}
          onYearChange={setEditYear}
          onQuarterChange={setEditQuarter}
          onDateChange={setEditDate}
          onLocationChange={setEditLocation}
          onSpeakerChange={setEditSpeaker}
          onRemarksChange={setEditRemarks}
          onSubmit={handleUpdateSeminar}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

      {/* 6. INTERACTIVE ATTENDEE PICKER DIALOG MODAL */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scale-up flex flex-col max-h-[90vh] relative z-50">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Batch Add Attendees</h3>
              <button onClick={() => { setIsPickerOpen(false); setSelectedPickerIds([]); }} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-all duration-100 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Search Input inside Picker */}
            <div className="relative shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search employees by name, office, or ID..."
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                className="block w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-850 dark:text-white font-semibold"
              />
            </div>

            {/* List employee results with Checkboxes */}
            <div className="flex-1 overflow-y-auto min-h-60 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/20 dark:bg-slate-950/20 divide-y divide-slate-100 dark:divide-slate-800 shadow-inner">
              {pickerEmployees.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400 font-medium">
                  No matchable employees available.
                </div>
              ) : (
                pickerEmployees.map((emp) => {
                  const isChecked = selectedPickerIds.includes(emp.EmployeeID);
                  return (
                    <label
                      key={emp.EmployeeID}
                      className="flex items-center gap-3 p-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-850/10 cursor-pointer transition select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setSelectedPickerIds(prev => prev.filter(id => id !== emp.EmployeeID));
                          } else {
                            setSelectedPickerIds(prev => [...prev, emp.EmployeeID]);
                          }
                        }}
                        className="h-4 w-4 text-blue-500 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-xs text-slate-850 dark:text-white block truncate">
                          {emp.LastName}, {emp.FirstName} {emp.MiddleInitial || ""}
                        </span>
                        <span className="text-[10px] text-slate-450 dark:text-slate-400 block truncate">
                          ID: {emp.EmployeeID} · {emp.Office} · {emp.Position}
                        </span>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                {selectedPickerIds.length} employee(s) selected
              </span>
              <div className="flex gap-2">
                <button onClick={() => { setIsPickerOpen(false); setSelectedPickerIds([]); }} className="btn-glass text-xs py-2 px-4 cursor-pointer font-bold rounded-xl">
                  Cancel
                </button>
                <button
                  onClick={handleAddAttendees}
                  disabled={selectedPickerIds.length === 0}
                  className="btn-glass bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 text-xs py-2 px-5 font-bold cursor-pointer rounded-xl disabled:opacity-50 disabled:pointer-events-none transition"
                >
                  Add Selected
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. EMPLOYEE PROFILE QUICK VIEW DRAWER (read-only) */}
      {isProfileOpen && profileEmployee && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsProfileOpen(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-slide-in-right transition-colors duration-200">
            {/* Sticky Topbar */}
            <div className="shrink-0 border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center gap-3 bg-slate-50/80 dark:bg-slate-950/60 backdrop-blur-sm sticky top-0 z-10">
              <button
                onClick={() => setIsProfileOpen(false)}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60 p-1.5 rounded-lg transition-all duration-100 cursor-pointer"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white font-display truncate">
                  {profileEmployee.LastName}, {profileEmployee.FirstName} {profileEmployee.MiddleInitial || ""}
                </h3>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest">
                  Profile View
                </span>
              </div>
              <button
                onClick={() => { setIsProfileOpen(false); onSelectEmployee(profileEmployee.EmployeeID); }}
                className="btn-glass bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 text-[11px] font-bold py-1.5 px-3 rounded-lg cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-100 shrink-0"
              >
                Edit
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Profile Overview */}
              <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                <div className="w-14 h-14 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl uppercase tracking-wider shrink-0">
                  {profileEmployee.LastName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug font-display">
                    {profileEmployee.LastName}, {profileEmployee.FirstName} {profileEmployee.MiddleInitial || ""}
                  </h2>
                  <p className="text-xs text-slate-550 dark:text-slate-400 font-medium mt-0.5">{profileEmployee.Position}</p>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wide mt-0.5">{profileEmployee.Office}</p>
                </div>
              </div>

              {/* Meta details */}
              <div className="grid grid-cols-3 gap-4 bg-slate-50/40 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Status</span>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-350 capitalize mt-0.5">{profileEmployee.EmploymentStatus || "N/A"}</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Gender</span>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-350 capitalize mt-0.5">{profileEmployee.Gender || "N/A"}</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Assumption</span>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-350 mt-0.5">{profileEmployee.DateOfAssumption || "N/A"}</p>
                </div>
              </div>

              {/* Learning Needs */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Learning Needs ({profileNeeds.length})
                </h4>
                {profileNeeds.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No learning needs registered.</p>
                ) : (
                  <div className="space-y-2">
                    {profileNeeds.map((need: any, i: number) => (
                      <div key={i} className="bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/50 dark:border-slate-800 rounded-xl p-3">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{need.LearningNeed || need.learningNeed || "N/A"}</p>
                        <div className="flex gap-3 mt-1 text-[10px] text-slate-400">
                          <span>Methodology: {need.Methodology || need.methodology || "N/A"}</span>
                          <span>Schedule: {need.Schedule || need.schedule || "N/A"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Seminars */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Training & Seminars ({profileSeminars.length})
                </h4>
                {profileSeminars.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No seminar attendances registered.</p>
                ) : (
                  <div className="space-y-2">
                    {profileSeminars.map((sem: any, i: number) => (
                      <div key={i} className="bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200/50 dark:border-slate-800 rounded-xl p-3">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{sem.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{sem.year} {sem.quarter}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 backdrop-blur-sm">
              <button
                onClick={() => { setIsProfileOpen(false); onSelectEmployee(profileEmployee.EmployeeID); }}
                className="w-full btn-glass bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 hover:scale-[1.02] active:scale-[0.98] text-xs py-2.5 px-4 cursor-pointer font-bold rounded-xl shadow-md shadow-blue-500/5 transition-all duration-100"
              >
                Modify Records
              </button>
            </div>
          </div>
        </div>
      )}

      {view === "details" && (
        <StickyBackButton onBack={() => setView("list")} label="Back" />
      )}
      {view === "import" && (
        <StickyBackButton onBack={resetImport} label="Cancel" />
      )}
    </div>
  );
}
