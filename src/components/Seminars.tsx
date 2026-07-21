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
  X,
  User,
  Plus,
  Trash2,
  Loader2,
  UserPlus,
  Pencil,
  Info,
  ChevronDown
} from "lucide-react";
import { Seminar, Employee, LearningNeed } from "../types";
import StickyBackButton from "./StickyBackButton";
import EmployeeProfileDrawer from "./EmployeeProfileDrawer";
import Modal from "./Modal";
import ConfirmDialog from "./ConfirmDialog";

interface SeminarsProps {
  year: number | null;
  quarter: "Q1" | "Q2" | "Q3" | "Q4" | null;
  onSelectEmployee: (empId: number) => void;
  currentUser: any;
  onSeminarChange?: () => void;
  onAddNewRecord?: () => void;
  rematchTrigger?: number;
}



export default function Seminars({ year, quarter, onSelectEmployee, currentUser, onSeminarChange, onAddNewRecord, rematchTrigger }: SeminarsProps) {
  const authHeaders = currentUser?.id ? { "x-user-id": String(currentUser.id) } : {};
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
  const currentYear = new Date().getFullYear();
  const [manualDate, setManualDate] = useState("");
  const [manualLocation, setManualLocation] = useState("");
  const [manualSpeaker, setManualSpeaker] = useState("");
  const [manualRemarks, setManualRemarks] = useState("");

  // Edit states
  const [editSeminarId, setEditSeminarId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editYear, setEditYear] = useState<number>(currentYear);
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
  const [pickerLoading, setPickerLoading] = useState(false);

  // Employee Profile Quick View (read-only)
  const [profileEmployee, setProfileEmployee] = useState<Employee | null>(null);
  const [profileNeeds, setProfileNeeds] = useState<LearningNeed[]>([]);
  const [profileSeminars, setProfileSeminars] = useState<any[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [newSeminarId, setNewSeminarId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    variant?: "danger" | "warning";
    onConfirm: () => void;
  }>({ isOpen: false, message: "", onConfirm: () => {} });
  // Import Wizard State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [expandedDiff, setExpandedDiff] = useState<Set<number>>(new Set());
  const [rematchKey, setRematchKey] = useState(0);
  const [previewData, setPreviewData] = useState<{
    title: string;
    year: number;
    quarter: "Q1" | "Q2" | "Q3" | "Q4";
    date: string;
    location: string;
    remarks: string;
    matched: any[];
    matchedDiff: any[];
    unmatched: any[];
    externalParticipants: { _key: string; rawName: string; organization: string; role: string; remarks: string }[];
    rawEmployees: { rawName: string; office: string; position?: string; _key?: string; manualEmployeeId?: number }[];
  } | null>(null);
  
  const [importSummary, setImportSummary] = useState<{
    success: boolean;
    added: number;
    skipped: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingNameKey, setEditingNameKey] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState("");
  const [manualMatchKey, setManualMatchKey] = useState<string | null>(null);
  const [manualMatchSearch, setManualMatchSearch] = useState("");
  const [manualMatchResults, setManualMatchResults] = useState<any[]>([]);
  const [isManualMatchOpen, setIsManualMatchOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  
  // External participant form state
  const [externalFormKey, setExternalFormKey] = useState<string | null>(null);
  const [externalOrg, setExternalOrg] = useState("");
  const [externalRole, setExternalRole] = useState("");
  const [externalRemarks, setExternalRemarks] = useState("");
  const [reviewAcknowledged, setReviewAcknowledged] = useState(false);
  const [showWhyReview, setShowWhyReview] = useState(false);

  // Create Employee modal (inline, no navigation)
  const [isCreateEmployeeOpen, setIsCreateEmployeeOpen] = useState(false);
  const [createEmployeeKey, setCreateEmployeeKey] = useState<string | null>(null);
  const [ceFirstName, setCeFirstName] = useState("");
  const [ceLastName, setCeLastName] = useState("");
  const [ceMiddleInitial, setCeMiddleInitial] = useState("");
  const [ceOffice, setCeOffice] = useState("");
  const [cePosition, setCePosition] = useState("");
  const [isCreating, setIsCreating] = useState(false);

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

  // Auto-rematch when preview is open and employee records may have changed
  useEffect(() => {
    if (!previewData?.rawEmployees?.length) return;
    handleRematch();
  }, [rematchKey]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        setRematchKey((k) => k + 1);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Trigger rematch when returning from another page (e.g., after adding an employee)
  useEffect(() => {
    if (rematchTrigger && rematchTrigger > 0 && previewData?.rawEmployees?.length) {
      handleRematch();
    }
  }, [rematchTrigger]);

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

  const handleDeleteSeminar = async (semId: string, attendeeCount: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const warning = attendeeCount > 0
      ? `This seminar has ${attendeeCount} registered attendee${attendeeCount !== 1 ? "s" : ""}. Deleting it will also remove all attendee associations.`
      : "Are you sure you want to delete this seminar?";
    setConfirmDialog({
      isOpen: true,
      title: "Delete Seminar?",
      message: warning,
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`/api/seminars/${semId}`, { method: "DELETE", headers: authHeaders });
          if (res.ok) {
            fetchSeminars();
            if (onSeminarChange) onSeminarChange();
          } else {
            const err = await res.json().catch(() => ({ error: "Delete failed" }));
            alert("Delete failed: " + (err.error || res.statusText));
          }
        } catch (err) {
          alert("Network error during delete: " + (err instanceof Error ? err.message : err));
        }
      }
    });
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
          title: "",
          year: year || currentYear,
          quarter: quarter || "Q2",
          date: data.date || "",
          location: "",
          remarks: "",
          matched: data.matched || [],
          matchedDiff: data.matchedDiff || [],
          unmatched: data.unmatched || [],
          externalParticipants: [],
          rawEmployees: data.rawEmployees || []
        });
      } else {
        const err = await res.json().catch(() => ({ error: "Unknown server error" }));
        alert("Import preview failed: " + (err.error || res.statusText));
      }
    } catch (err: any) {
      alert("Network error while uploading file: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!previewData) return;
    setLoading(true);
    try {
      const res = await fetch("/api/seminars/import-execute", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
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
      } else {
        const err = await res.json().catch(() => ({ error: "Unknown server error" }));
        alert("Import failed: " + (err.error || res.statusText));
      }
    } catch (err: any) {
      alert("Network error during import: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleRematch = async (overrideRawEmployees?: any[]) => {
    const employeesToSend = overrideRawEmployees || previewData?.rawEmployees;
    if (!employeesToSend?.length) return;
    setLoading(true);
    try {
      const res = await fetch("/api/seminars/import-reprocess", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ employees: employeesToSend })
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewData((prev) => prev ? {
          ...prev,
          matched: data.matched || [],
          matchedDiff: data.matchedDiff || [],
          unmatched: data.unmatched || []
        } : prev);
        setExpandedDiff(new Set());
      } else {
        const err = await res.json().catch(() => ({ error: "Unknown server error" }));
        alert("Refresh matches failed: " + (err.error || res.statusText));
      }
    } catch (err: any) {
      alert("Network error refreshing matches: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  // Find rawEmployee index by _key
  const findRawIdxByKey = (key: string): number => {
    if (!previewData?.rawEmployees) return -1;
    return previewData.rawEmployees.findIndex((r) => r._key === key);
  };

  // Update a single rawEmployee entry
  const updateRawEmployee = (key: string, updates: Partial<{ rawName: string; manualEmployeeId: number }>) => {
    if (!previewData) return;
    const idx = findRawIdxByKey(key);
    if (idx < 0) return;
    const updated = [...previewData.rawEmployees];
    updated[idx] = { ...updated[idx], ...updates };
    setPreviewData({ ...previewData, rawEmployees: updated });
  };

  // Remove a rawEmployee entry by _key
  const removeRawEmployee = (key: string) => {
    if (!previewData) return;
    const updated = previewData.rawEmployees.filter((r) => r._key !== key);
    setPreviewData({ ...previewData, rawEmployees: updated });
  };

  const handleStartEditName = (key: string, currentName: string) => {
    setEditingNameKey(key);
    setEditingNameValue(currentName);
  };

  const handleSaveEditedName = () => {
    if (editingNameKey && editingNameValue.trim() && previewData) {
      // Compute the updated rawEmployees array directly
      const idx = findRawIdxByKey(editingNameKey);
      if (idx >= 0) {
        const updatedRawEmployees = [...previewData.rawEmployees];
        updatedRawEmployees[idx] = { ...updatedRawEmployees[idx], rawName: editingNameValue.trim() };
        
        setPreviewData({ ...previewData, rawEmployees: updatedRawEmployees });
        setEditingNameKey(null);
        setEditingNameValue("");
        
        // Pass the updated array directly to avoid stale state
        handleRematch(updatedRawEmployees);
      }
    }
  };

  const handleCancelEditName = () => {
    setEditingNameKey(null);
    setEditingNameValue("");
  };

  const handleRemoveImportAttendee = (key: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Remove Attendee?",
      message: "Remove this attendee from the import?",
      confirmLabel: "Remove",
      variant: "warning",
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        if (!previewData) return;
        const updatedRawEmployees = previewData.rawEmployees.filter((r) => r._key !== key);
        setPreviewData({ ...previewData, rawEmployees: updatedRawEmployees });
        handleRematch(updatedRawEmployees);
      }
    });
  };

  const handleOpenManualMatch = (key: string) => {
    setManualMatchKey(key);
    setIsManualMatchOpen(true);
    setManualMatchSearch("");
    setManualMatchResults([]);
  };

  const handleManualMatchSearch = async (query: string) => {
    setManualMatchSearch(query);
    if (query.trim().length < 2) {
      setManualMatchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/employees`);
      if (res.ok) {
        const all = await res.json();
        const q = query.toLowerCase();
        const filtered = all.filter((emp: any) =>
          `${emp.FirstName} ${emp.LastName} ${emp.EmployeeID}`.toLowerCase().includes(q)
        );
        setManualMatchResults(filtered.slice(0, 20));
      }
    } catch {
      setManualMatchResults([]);
    }
  };

  const handleSelectManualMatch = (employee: any) => {
    if (manualMatchKey && previewData) {
      // Compute the updated rawEmployees array directly
      const idx = findRawIdxByKey(manualMatchKey);
      if (idx >= 0) {
        const updatedRawEmployees = [...previewData.rawEmployees];
        updatedRawEmployees[idx] = { ...updatedRawEmployees[idx], manualEmployeeId: Number(employee.EmployeeID) };
        
        // Update state and trigger rematch with the updated data
        setPreviewData({ ...previewData, rawEmployees: updatedRawEmployees });
        setIsManualMatchOpen(false);
        setManualMatchKey(null);
        setManualMatchSearch("");
        setManualMatchResults([]);
        
        // Pass the updated array directly to avoid stale state
        handleRematch(updatedRawEmployees);
      }
    }
  };

  const closeManualMatch = () => {
    setIsManualMatchOpen(false);
    setManualMatchKey(null);
    setManualMatchSearch("");
    setManualMatchResults([]);
  };

  const handleClearManualMatch = (key: string) => {
    if (!previewData) return;
    
    // Compute the updated rawEmployees array directly
    const idx = findRawIdxByKey(key);
    if (idx >= 0) {
      const updatedRawEmployees = [...previewData.rawEmployees];
      updatedRawEmployees[idx] = { ...updatedRawEmployees[idx], manualEmployeeId: undefined as any };
      
      setPreviewData({ ...previewData, rawEmployees: updatedRawEmployees });
        
      // Pass the updated array directly to avoid stale state
      handleRematch(updatedRawEmployees);
    }
  };

  // Inline Create Employee
  const splitRawName = (rawName: string) => {
    const parts = rawName.trim().split(/\s+/);
    if (parts.length === 1) return { first: parts[0], last: "" };
    if (parts.length === 2) return { first: parts[0], last: parts[1] };
    return { first: parts[0], last: parts.slice(1).join(" ") };
  };

  const handleOpenCreateEmployee = (key: string) => {
    if (!previewData) return;
    const raw = previewData.rawEmployees.find((r) => r._key === key);
    if (!raw) return;
    const { first, last } = splitRawName(raw.rawName);
    setCreateEmployeeKey(key);
    setCeFirstName(first);
    setCeLastName(last);
    setCeMiddleInitial("");
    setCeOffice(raw.office || "");
    setCePosition(raw.position || "");
    setIsCreateEmployeeOpen(true);
  };

  const handleCreateEmployee = async () => {
    if (!ceFirstName.trim() || !ceLastName.trim() || !ceOffice.trim() || !cePosition.trim()) {
      alert("First name, last name, office, and position are required.");
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: ceFirstName.trim(),
          lastName: ceLastName.trim(),
          middleInitial: ceMiddleInitial.trim() || undefined,
          office: ceOffice.trim(),
          position: cePosition.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to create employee" }));
        alert("Error: " + (err.message || res.statusText));
        return;
      }
      const newEmployee = await res.json();
      if (!createEmployeeKey || !previewData) return;
      const idx = findRawIdxByKey(createEmployeeKey);
      if (idx < 0) return;
      const updatedRawEmployees = [...previewData.rawEmployees];
      updatedRawEmployees[idx] = { ...updatedRawEmployees[idx], manualEmployeeId: Number(newEmployee.EmployeeID) };
      setPreviewData({ ...previewData, rawEmployees: updatedRawEmployees });
      setIsCreateEmployeeOpen(false);
      setCreateEmployeeKey(null);
      handleRematch(updatedRawEmployees);
    } catch (err: any) {
      alert("Network error: " + (err.message || err));
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancelCreateEmployee = () => {
    setIsCreateEmployeeOpen(false);
    setCreateEmployeeKey(null);
  };

  // Bulk selection handlers
  const toggleSelectKey = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectAll = (keys: string[]) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      const allSelected = keys.every((k) => next.has(k));
      if (allSelected) {
        keys.forEach((k) => next.delete(k));
      } else {
        keys.forEach((k) => next.add(k));
      }
      return next;
    });
  };

  const getSectionState = (keys: string[]): "none" | "some" | "all" => {
    if (keys.length === 0) return "none";
    const selectedCount = keys.filter((k) => selectedKeys.has(k)).length;
    if (selectedCount === 0) return "none";
    if (selectedCount === keys.length) return "all";
    return "some";
  };

  const clearAllSelections = () => setSelectedKeys(new Set());

  const handleBulkRemove = () => {
    if (selectedKeys.size === 0 || !previewData) return;
    const count = selectedKeys.size;
    setConfirmDialog({
      isOpen: true,
      title: "Remove Attendees?",
      message: `Remove ${count} attendee${count !== 1 ? "s" : ""} from the import?`,
      confirmLabel: "Remove All",
      variant: "warning",
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        const updatedRawEmployees = previewData.rawEmployees.filter((r) => !selectedKeys.has(r._key || ""));
        setPreviewData({ ...previewData, rawEmployees: updatedRawEmployees });
        setSelectedKeys(new Set());
        handleRematch(updatedRawEmployees);
      }
    });
  };

  const handleBulkMatch = () => {
    if (selectedKeys.size === 0) return;
    const firstKey = Array.from(selectedKeys)[0];
    handleOpenManualMatch(firstKey);
  };

  // External participant handlers
  const handleOpenExternalForm = (key: string) => {
    setExternalFormKey(key);
    const raw = previewData?.rawEmployees?.find((r) => r._key === key);
    const unmatched = previewData?.unmatched?.find((u) => u._key === key);
    const position = unmatched?.position || raw?.position || "";
    setExternalOrg("");
    setExternalRole(position);
    setExternalRemarks("");
  };

  const handleMarkAsExternal = () => {
    if (!externalFormKey || !previewData) return;
    
    // Find the unmatched employee
    const unmatched = previewData.unmatched.find((u) => u._key === externalFormKey);
    if (!unmatched) return;
    
    // Add to external participants
    const newExternal = {
      _key: externalFormKey,
      rawName: unmatched.rawName,
      organization: externalOrg,
      role: externalRole,
      remarks: externalRemarks,
    };
    
    // Remove from unmatched and add to externalParticipants
    const updatedUnmatched = previewData.unmatched.filter((u) => u._key !== externalFormKey);
    setPreviewData({
      ...previewData,
      unmatched: updatedUnmatched,
      externalParticipants: [...(previewData.externalParticipants || []), newExternal],
    });
    
    // Reset form
    setExternalFormKey(null);
    setExternalOrg("");
    setExternalRole("");
    setExternalRemarks("");
  };

  const handleCancelExternalForm = () => {
    setExternalFormKey(null);
    setExternalOrg("");
    setExternalRole("");
    setExternalRemarks("");
  };

  const resetImport = () => {
    setUploadFile(null);
    setPreviewData(null);
    setImportSummary(null);
    setExpandedDiff(new Set());
    setRematchKey(0);
    setEditingNameKey(null);
    setEditingNameValue("");
    setIsManualMatchOpen(false);
    setManualMatchKey(null);
    setExternalFormKey(null);
    setExternalOrg("");
    setExternalRole("");
    setExternalRemarks("");
    setSelectedKeys(new Set());
    setReviewAcknowledged(false);
    setShowWhyReview(false);
    setView("list");
  };

  // 1. Manual Create Seminar
  const handleCreateSeminar = async () => {
    if (!manualTitle) {
      alert("Title is required.");
      return;
    }
    const effectiveYear = year || currentYear;
    const effectiveQuarter = quarter || "Q2";
    setLoading(true);
    try {
      const res = await fetch("/api/seminars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: manualTitle,
          year: effectiveYear,
          quarter: effectiveQuarter,
          date: manualDate,
          location: manualLocation,
          speaker: manualSpeaker,
          remarks: manualRemarks
        })
      });
      if (res.ok) {
        const data = await res.json();
        setIsManualModalOpen(false);
        setNewSeminarId(data.id || null);
        setManualTitle("");
        setManualDate("");
        setManualLocation("");
        setManualSpeaker("");
        setManualRemarks("");
        fetchSeminars();
        if (onSeminarChange) onSeminarChange();
        setTimeout(() => setNewSeminarId(null), 3000);
      } else {
        const err = await res.json().catch(() => ({ error: "Failed to save seminar" }));
        alert(err.error || "Failed to save seminar");
      }
    } catch (err: any) {
      alert("Network error: " + (err.message || err));
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
      } else {
        const err = await res.json().catch(() => ({ error: "Failed to update seminar" }));
        alert(err.error || "Failed to update seminar");
      }
    } catch (err: any) {
      alert("Network error: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  // 4. Attendee Picker search effect
  // Normalize API response: handle both { employees: [...] } (current) and [...] (legacy flat array)
  const normalizeEmployees = (data: any): Employee[] => {
    if (Array.isArray(data)) return data;
    return data?.employees || [];
  };

  useEffect(() => {
    if (!isPickerOpen) return;
    const currentAttendeeIds = (selectedSeminar?.attendees || []).map(a => a.EmployeeID);

    if (pickerSearch.trim().length >= 2) {
      setPickerLoading(true);
      const delay = setTimeout(async () => {
        try {
          const res = await fetch(`/api/employees?search=${encodeURIComponent(pickerSearch.trim())}&limit=50`);
          if (res.ok) {
            const data = await res.json();
            const filtered = normalizeEmployees(data).filter(
              (emp: Employee) => !currentAttendeeIds.includes(emp.EmployeeID)
            );
            setPickerEmployees(filtered);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setPickerLoading(false);
        }
      }, 250);
      return () => clearTimeout(delay);
    } else {
      setPickerEmployees([]);
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
    setConfirmDialog({
      isOpen: true,
      title: "Remove Attendee?",
      message: "Are you sure you want to remove this employee from the attendees list?",
      confirmLabel: "Remove",
      variant: "danger",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setLoading(true);
        try {
          const res = await fetch(`/api/seminars/${selectedSeminar.id}/attendees/${employeeId}`, {
            method: "DELETE",
            headers: authHeaders
          });
          if (res.ok) {
            handleSelectSeminar(selectedSeminar.id);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    });
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
    <div key={`${year}-${quarter}`} className="space-y-6 animate-fade-in-up">
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
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 text-slate-400 rounded-full">
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
                    className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 hover:border-blue-500/50 dark:hover:border-blue-500/30 shadow-xs hover:shadow-md active:scale-[0.98] active:shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden ${sem.id === newSeminarId ? "border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20 animate-[pulse_2s_ease-in-out_3]" : "border-slate-200/60 dark:border-white/10"}`}
                  >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-2.5 py-1 rounded-md border border-slate-200/40 dark:border-white/5">
                          {sem.year}
                        </span>
                        <span className="bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-[10px] font-bold px-2.5 py-1 rounded-md">
                          {sem.quarter}
                        </span>
                      </div>
                      {(currentUser?.role === "Administrator" || currentUser?.role === "System developer") && (
                        <button
                          onClick={(e) => handleDeleteSeminar(sem.id, sem.attendees?.length || 0, e)}
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
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            Venue: {sem.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-200 dark:border-slate-800/80">
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
        <div className="space-y-6 animate-fade-in-up">
          <StickyBackButton onBack={() => setView("list")} />

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
                    className="btn-glass bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs py-2.5 px-4 rounded-xl font-bold cursor-pointer transition"
                  >
                    Edit Seminar
                  </button>
                )}
                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-white/5 rounded-xl p-4 flex items-center gap-3 shrink-0 shadow-xs">
                  <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Attendee Count</span>
                    <span className="text-lg font-bold text-slate-800 dark:text-white leading-none">{selectedSeminar.attendees?.length || 0}</span>
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
                  className="block w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs text-slate-800 dark:text-slate-100 transition-colors"
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
            <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl shadow-xs">
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
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition duration-100 group"
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
        <div className="space-y-6 animate-fade-in-up">
          <StickyBackButton onBack={resetImport} />

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

          {/* IMPORT REVIEW */}
          {previewData && !importSummary && (
            <div className="space-y-6">
              {/* 1. Mandatory Review Notice */}
              <div className="bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-900/30 rounded-2xl shadow-xs overflow-hidden">
                <div className="flex items-start gap-4 p-5">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="space-y-2 flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Manual Review Required</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      This import was generated automatically to assist with encoding. Please review all attendee matches, participant types, and seminar information before submitting.
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      External participants, abbreviated names, nicknames, and formatting differences may require manual verification.
                    </p>
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                      The import cannot be considered final until it has been reviewed by the encoder.
                    </p>
                    {(!currentUser || currentUser.role === "Encoder") && (
                      <div className="flex items-start gap-2.5 pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                        <Info className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          If you are unsure whether an attendee is an employee or an external participant, or if any attendee information appears incomplete or ambiguous, please verify the information with the appropriate administrator before completing the import.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Seminar Information Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-blue-500" />
                    Seminar Information
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      Importing into <strong className="text-slate-800 dark:text-white">{year || currentYear}</strong> &bull; <strong className="text-slate-800 dark:text-white">{quarter || "Q2"}</strong>
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Seminar Title</label>
                      <input type="text" value={previewData.title} onChange={(e) => setPreviewData({ ...previewData, title: e.target.value })} placeholder="Enter seminar title" className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 dark:text-white font-semibold placeholder:text-slate-300 dark:placeholder:text-slate-600" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Date</label>
                      <input type="date" value={previewData.date} onChange={(e) => setPreviewData({ ...previewData, date: e.target.value })} className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 dark:text-white font-semibold" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Location</label>
                      <input type="text" placeholder="e.g. Provincial Training Center" value={previewData.location} onChange={(e) => setPreviewData({ ...previewData, location: e.target.value })} className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 dark:text-white font-semibold placeholder:text-slate-300 dark:placeholder:text-slate-600" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Remarks</label>
                      <input type="text" placeholder="Optional notes" value={previewData.remarks} onChange={(e) => setPreviewData({ ...previewData, remarks: e.target.value })} className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 dark:text-white font-semibold placeholder:text-slate-300 dark:placeholder:text-slate-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Import Summary + Review Progress */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md p-4 rounded-xl border border-slate-200/60 dark:border-white/10 shadow-xs flex items-center gap-3 lg:col-span-1">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider truncate">Total</div>
                    <div className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight font-display">
                      {previewData.matched.length + previewData.matchedDiff.length + previewData.unmatched.length + (previewData.externalParticipants?.length || 0)}
                    </div>
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 truncate">attendees</div>
                  </div>
                </div>
                <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-900/30 shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider truncate">Internal</div>
                    <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300 tracking-tight font-display">{previewData.matched.length}</div>
                    <div className="text-[9px] text-emerald-600/60 dark:text-emerald-400/60 truncate">employees</div>
                  </div>
                </div>
                <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md p-4 rounded-xl border border-amber-200/60 dark:border-amber-900/30 shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider truncate">Review</div>
                    <div className="text-lg font-bold text-amber-700 dark:text-amber-300 tracking-tight font-display">{previewData.matchedDiff.length}</div>
                    <div className="text-[9px] text-amber-600/60 dark:text-amber-400/60 truncate">needs review</div>
                  </div>
                </div>
                <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md p-4 rounded-xl border border-red-200/60 dark:border-red-900/30 shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                    <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider truncate">Unknown</div>
                    <div className="text-lg font-bold text-red-700 dark:text-red-300 tracking-tight font-display">{previewData.unmatched.length}</div>
                    <div className="text-[9px] text-red-600/60 dark:text-red-400/60 truncate">unresolved</div>
                  </div>
                </div>
                <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md p-4 rounded-xl border border-blue-200/60 dark:border-blue-900/30 shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider truncate">External</div>
                    <div className="text-lg font-bold text-blue-700 dark:text-blue-300 tracking-tight font-display">{previewData.externalParticipants?.length || 0}</div>
                    <div className="text-[9px] text-blue-600/60 dark:text-blue-400/60 truncate">participants</div>
                  </div>
                </div>
              </div>

              {/* Review Progress */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl shadow-xs p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Review Progress</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {previewData.matched.length + (previewData.externalParticipants?.length || 0)} / {previewData.matched.length + previewData.matchedDiff.length + previewData.unmatched.length + (previewData.externalParticipants?.length || 0)} reviewed
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, ((previewData.matched.length + (previewData.externalParticipants?.length || 0)) / Math.max(1, previewData.matched.length + previewData.matchedDiff.length + previewData.unmatched.length + (previewData.externalParticipants?.length || 0))) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    {previewData.matched.length + (previewData.externalParticipants?.length || 0)} reviewed
                  </span>
                  <span className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold">
                    {previewData.matchedDiff.length + previewData.unmatched.length} remaining
                  </span>
                </div>
              </div>

              {/* Bulk action bar — sticky when items selected */}
              {selectedKeys.size > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl shadow-xs p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span className="text-blue-600 dark:text-blue-400">{selectedKeys.size}</span> Attendee{selectedKeys.size !== 1 ? "s" : ""} Selected
                    </span>
                    <button type="button" onClick={clearAllSelections} className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer">
                      Clear Selection
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={handleBulkMatch} className="btn-glass bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 text-[10px] py-1.5 px-3 font-bold rounded-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all">
                      Match Selected
                    </button>
                    <button type="button" onClick={() => {
                      if (selectedKeys.size === 0 || !previewData) return;
                      const firstKey = Array.from(selectedKeys)[0];
                      handleOpenExternalForm(firstKey);
                    }} className="btn-glass bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-200/50 dark:border-violet-900/30 text-[10px] py-1.5 px-3 font-bold rounded-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all">
                      Mark External
                    </button>
                    <button type="button" onClick={handleBulkRemove} className="btn-glass bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/30 text-[10px] py-1.5 px-3 font-bold rounded-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all">
                      Remove Selected
                    </button>
                  </div>
                </div>
              )}

              {/* 4. Attendee Review Container */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
                {/* Internal Employees Section */}
                {previewData.matched.length > 0 && (
                  <>
                    <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Internal Employees</h4>
                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9.5px] font-bold px-2 py-0.5 rounded-full border border-emerald-200/40 dark:border-emerald-900/30">{previewData.matched.length}</span>
                        {(() => {
                          const matchedKeys = previewData.matched.map((m, i) => m._key || `matched_${i}`);
                          const state = getSectionState(matchedKeys);
                          return state === "all" ? <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">All Selected</span> : state === "some" ? <span className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold">Partially Selected</span> : null;
                        })()}
                      </div>
                      <button type="button" onClick={() => toggleSelectAll(previewData.matched.map((m, i) => m._key || `matched_${i}`))} className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all duration-100 cursor-pointer ${
                        previewData.matched.every((m, i) => selectedKeys.has(m._key || `matched_${i}`))
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/30 hover:bg-emerald-500/20"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30 hover:bg-blue-500/20"
                      }`}>
                        {previewData.matched.every((m, i) => selectedKeys.has(m._key || `matched_${i}`)) ? (
                          <><CheckCircle className="h-3 w-3" /> Deselect All</>
                        ) : (
                          <><span className="text-xs leading-none">☐</span> Select All</>
                        )}
                      </button>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-80 overflow-y-auto">
                      {previewData.matched.map((m, idx) => {
                        const key = m._key || `matched_${idx}`;
                        const isSelected = selectedKeys.has(key);
                        const hasDiff = m.differences?.length > 0;
                        return (
                          <div key={key} className={`px-5 py-2.5 ${isSelected ? "bg-blue-50/30 dark:bg-blue-950/20" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/20"}`}>
                            <div className="flex items-center gap-3">
                              <input type="checkbox" checked={isSelected} onChange={() => toggleSelectKey(key)} className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${hasDiff ? "bg-amber-500" : "bg-emerald-500"}`} />
                              {editingNameKey === key ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <input type="text" value={editingNameValue} onChange={(e) => setEditingNameValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSaveEditedName(); if (e.key === "Escape") handleCancelEditName(); }} className="flex-1 px-2 py-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
                                  <button type="button" onClick={handleSaveEditedName} className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer">Save</button>
                                  <button type="button" onClick={handleCancelEditName} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"><X className="h-3 w-3" /></button>
                                </div>
                              ) : (
                                <>
                                  <div className="flex-1 min-w-0 flex items-center gap-3">
                                    <div className="min-w-0 flex-1">
                                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{m.LastName}, {m.FirstName} {m.MiddleInitial || ""}</span>
                                      <span className="text-[10px] text-slate-400 ml-2">{m.Office}</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {m.differences?.map((d: string) => (
                                        <span key={d} className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                                          <span>&#9888;</span> {d}
                                        </span>
                                      ))}
                                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{m.matchReasons?.[0]}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button type="button" onClick={() => handleStartEditName(key, m.rawName || `${m.LastName}, ${m.FirstName}`)} className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">Edit</button>
                                    <button type="button" onClick={() => onSelectEmployee(Number(m.EmployeeID))} className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">View</button>
                                    <button type="button" onClick={() => handleRemoveImportAttendee(key)} className="btn-glass bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border-red-200/50 dark:border-red-900/30 p-1.5 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-all duration-100"><Trash2 className="h-3 w-3" /></button>
                                  </div>
                                </>
                              )}
                            </div>
                            {hasDiff && (
                              <div className="ml-9 mt-1">
                                <button type="button" onClick={() => setExpandedDiff((prev) => { const next = new Set(prev); const key = idx + 10000; next.has(key) ? next.delete(key) : next.add(key); return next; })} className="text-[9px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">
                                  {expandedDiff.has(idx + 10000) ? "Hide details" : "Show details"}
                                </button>
                                {expandedDiff.has(idx + 10000) && (
                                  <div className="mt-1.5 bg-slate-50 dark:bg-slate-950/40 rounded-lg p-2.5 border border-slate-200/60 dark:border-slate-800">
                                    <div className="grid grid-cols-3 gap-2 text-[9px] font-semibold text-slate-500 dark:text-slate-400 pb-1.5 border-b border-slate-200 dark:border-slate-800 mb-1.5">
                                      <span>Field</span><span>Database</span><span>Excel File</span>
                                    </div>
                                    {m.differences?.map((diff: string) => (
                                      <div key={diff} className="grid grid-cols-3 gap-2 py-1 text-[9px] border-b border-slate-100 dark:border-slate-800 last:border-0">
                                        <span className="font-medium text-slate-700 dark:text-slate-300">{diff}</span>
                                        <span className="text-slate-600 dark:text-slate-400">{m[`db${diff}`] || m[diff] || "-"}</span>
                                        <span className="text-amber-600 dark:text-amber-400">{m[`excel${diff}`] || m.office || m.position || "-"}</span>
                                      </div>
                                    ))}
                                    {m.matchReasons?.length > 0 && (
                                      <div className="mt-1.5 text-[9px] text-slate-400 dark:text-slate-500">
                                        Match: {m.matchReasons.join(", ")}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Needs Review Section */}
                {previewData.matchedDiff.length > 0 && (
                  <>
                    <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Needs Review</h4>
                        <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9.5px] font-bold px-2 py-0.5 rounded-full border border-amber-200/40 dark:border-amber-900/30">{previewData.matchedDiff.length}</span>
                        {(() => {
                          const mdiffKeys = previewData.matchedDiff.map((m, i) => m._key || `mdiff_${i}`);
                          const state = getSectionState(mdiffKeys);
                          return state === "all" ? <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">All Selected</span> : state === "some" ? <span className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold">Partially Selected</span> : null;
                        })()}
                      </div>
                      <button type="button" onClick={() => toggleSelectAll(previewData.matchedDiff.map((m, i) => m._key || `mdiff_${i}`))} className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all duration-100 cursor-pointer ${
                        previewData.matchedDiff.every((m, i) => selectedKeys.has(m._key || `mdiff_${i}`))
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/30 hover:bg-emerald-500/20"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30 hover:bg-blue-500/20"
                      }`}>
                        {previewData.matchedDiff.every((m, i) => selectedKeys.has(m._key || `mdiff_${i}`)) ? (
                          <><CheckCircle className="h-3 w-3" /> Deselect All</>
                        ) : (
                          <><span className="text-xs leading-none">☐</span> Select All</>
                        )}
                      </button>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-80 overflow-y-auto">
                      {previewData.matchedDiff.map((m, idx) => {
                        const key = m._key || `mdiff_${idx}`;
                        const isSelected = selectedKeys.has(key);
                        return (
                          <div key={key} className={`px-5 py-2.5 ${isSelected ? "bg-blue-50/30 dark:bg-blue-950/20" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/20"}`}>
                            <div className="flex items-center gap-3">
                              <input type="checkbox" checked={isSelected} onChange={() => toggleSelectKey(key)} className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                              {editingNameKey === key ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <input type="text" value={editingNameValue} onChange={(e) => setEditingNameValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSaveEditedName(); if (e.key === "Escape") handleCancelEditName(); }} className="flex-1 px-2 py-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
                                  <button type="button" onClick={handleSaveEditedName} className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer">Save</button>
                                  <button type="button" onClick={handleCancelEditName} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"><X className="h-3 w-3" /></button>
                                </div>
                              ) : (
                                <>
                                  <div className="flex-1 min-w-0 flex items-center gap-3">
                                    <div className="min-w-0 flex-1">
                                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{m.LastName}, {m.FirstName} {m.MiddleInitial || ""}</span>
                                      <span className="text-[10px] text-slate-400 ml-2">{m.Office}</span>
                                      <span className="text-[10px] text-amber-600 dark:text-amber-400 ml-2">{m.confidence || 95}% confidence</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 shrink-0">
                                      {m.differences?.map((d: string) => (
                                        <span key={d} className="inline-flex items-center gap-1 mr-2">
                                          <span className="text-amber-500">&#9888;</span> {d}
                                          {d === "Office" && ` (Excel: ${m.excelOffice || "-"})`}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button type="button" onClick={() => handleStartEditName(key, m.rawName || `${m.LastName}, ${m.FirstName}`)} className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">Edit</button>
                                    <button type="button" onClick={() => onSelectEmployee(Number(m.EmployeeID))} className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">View</button>
                                    <button type="button" onClick={() => handleRemoveImportAttendee(key)} className="btn-glass bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border-red-200/50 dark:border-red-900/30 p-1.5 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-all duration-100"><Trash2 className="h-3 w-3" /></button>
                                  </div>
                                </>
                              )}
                            </div>
                            {/* Expandable diff details */}
                            <div className="ml-9 mt-1">
                              <button type="button" onClick={() => setExpandedDiff((prev) => { const next = new Set(prev); next.has(idx) ? next.delete(idx) : next.add(idx); return next; })} className="text-[9px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">
                                {expandedDiff.has(idx) ? "Hide details" : "Show details"}
                              </button>
                              {expandedDiff.has(idx) && (
                                <div className="mt-1.5 bg-slate-50 dark:bg-slate-950/40 rounded-lg p-2.5 border border-slate-200/60 dark:border-slate-800">
                                  <div className="grid grid-cols-3 gap-2 text-[9px] font-semibold text-slate-500 dark:text-slate-400 pb-1.5 border-b border-slate-200 dark:border-slate-800 mb-1.5">
                                    <span>Field</span><span>Database</span><span>Excel File</span>
                                  </div>
                                  {m.differences?.map((diff: string) => (
                                    <div key={diff} className="grid grid-cols-3 gap-2 py-1 text-[9px] border-b border-slate-100 dark:border-slate-800 last:border-0">
                                      <span className="font-medium text-slate-700 dark:text-slate-300">{diff}</span>
                                      <span className="text-slate-600 dark:text-slate-400">{m[`db${diff}`] || m[diff] || "-"}</span>
                                        <span className="text-amber-600 dark:text-amber-400">{m[`excel${diff}`] || m.office || m.position || "-"}</span>
                                      </div>
                                    ))}
                                    {m.matchReasons?.length > 0 && (
                                      <div className="mt-1.5 text-[9px] text-slate-400 dark:text-slate-500">
                                        Match: {m.matchReasons.join(", ")}
                                      </div>
                                    )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Unknown Section */}
                {previewData.unmatched.length > 0 && (
                  <>
                    <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <X className="h-4 w-4 text-slate-400" />
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Unknown</h4>
                        <span className="bg-red-500/10 text-red-600 dark:text-red-400 text-[9.5px] font-bold px-2 py-0.5 rounded-full border border-red-200/40 dark:border-red-900/30">{previewData.unmatched.length}</span>
                        {(() => {
                          const unmatchedKeys = previewData.unmatched.map((u, i) => u._key || `unmatched_${i}`);
                          const state = getSectionState(unmatchedKeys);
                          return state === "all" ? <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">All Selected</span> : state === "some" ? <span className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold">Partially Selected</span> : null;
                        })()}
                      </div>
                      <button type="button" onClick={() => toggleSelectAll(previewData.unmatched.map((u, i) => u._key || `unmatched_${i}`))} className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all duration-100 cursor-pointer ${
                        previewData.unmatched.every((u, i) => selectedKeys.has(u._key || `unmatched_${i}`))
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/30 hover:bg-emerald-500/20"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30 hover:bg-blue-500/20"
                      }`}>
                        {previewData.unmatched.every((u, i) => selectedKeys.has(u._key || `unmatched_${i}`)) ? (
                          <><CheckCircle className="h-3 w-3" /> Deselect All</>
                        ) : (
                          <><span className="text-xs leading-none">☐</span> Select All</>
                        )}
                      </button>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-80 overflow-y-auto">
                      {previewData.unmatched.map((un, idx) => {
                        const key = un._key || `unmatched_${idx}`;
                        const isSelected = selectedKeys.has(key);
                        return (
                          <div key={key} className={`px-5 py-2.5 ${isSelected ? "bg-blue-50/30 dark:bg-blue-950/20" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/20"}`}>
                            <div className="flex items-center gap-3">
                              <input type="checkbox" checked={isSelected} onChange={() => toggleSelectKey(key)} className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                              {editingNameKey === key ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <input type="text" value={editingNameValue} onChange={(e) => setEditingNameValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSaveEditedName(); if (e.key === "Escape") handleCancelEditName(); }} className="flex-1 px-2 py-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
                                  <button type="button" onClick={handleSaveEditedName} className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer">Save</button>
                                  <button type="button" onClick={handleCancelEditName} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"><X className="h-3 w-3" /></button>
                                </div>
                              ) : (
                                <>
                                  <div className="flex-1 min-w-0 flex items-center gap-3">
                                    <div className="min-w-0 flex-1">
                                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{un.rawName}</span>
                                      {un.office && <span className="text-[10px] text-slate-400 ml-2">{un.office}</span>}
                                    </div>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">No match found</span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button type="button" onClick={() => handleOpenManualMatch(key)} className="btn-glass bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30 text-[10px] py-1.5 px-2.5 font-bold rounded-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-100">Match</button>
                                    <button type="button" onClick={() => handleOpenExternalForm(key)} className="text-[10px] text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer">External</button>
                                    <button type="button" onClick={() => handleStartEditName(key, un.rawName)} className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">Edit</button>
                                    <button type="button" onClick={() => handleOpenCreateEmployee(key)} className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer font-semibold">Create</button>
                                    <button type="button" onClick={() => handleRemoveImportAttendee(key)} className="btn-glass bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border-red-200/50 dark:border-red-900/30 p-1.5 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-all duration-100"><Trash2 className="h-3 w-3" /></button>
                                  </div>
                                </>
                              )}
                            </div>
                            {/* Inline External Participant Form */}
                            {externalFormKey === key && (
                              <div className="ml-9 mt-2 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-lg border border-slate-200/60 dark:border-slate-800 space-y-2">
                                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Mark as External Participant</div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                  <div>
                                    <label className="block text-[9px] font-semibold text-slate-400 dark:text-slate-500 mb-0.5">Organization</label>
                                    <input type="text" value={externalOrg} onChange={(e) => setExternalOrg(e.target.value)} placeholder="e.g. Department of Labor" className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300 dark:placeholder:text-slate-600" />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-semibold text-slate-400 dark:text-slate-500 mb-0.5">Role</label>
                                    <input type="text" value={externalRole} onChange={(e) => setExternalRole(e.target.value)} placeholder="Auto-filled" className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300 dark:placeholder:text-slate-600" />
                                  </div>
                                  <div>
                                    <label className="block text-[9px] font-semibold text-slate-400 dark:text-slate-500 mb-0.5">Remarks</label>
                                    <input type="text" value={externalRemarks} onChange={(e) => setExternalRemarks(e.target.value)} placeholder="Optional" className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-[10px] focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300 dark:placeholder:text-slate-600" />
                                  </div>
                                </div>
                                <div className="flex gap-2 pt-1">
                                  <button type="button" onClick={handleMarkAsExternal} className="btn-glass bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30 text-[10px] py-1.5 px-3 font-bold rounded-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-100">Confirm External</button>
                                  <button type="button" onClick={handleCancelExternalForm} className="text-[10px] text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">Cancel</button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* External Participants Section (integrated) */}
                {(previewData.externalParticipants?.length || 0) > 0 && (
                  <>
                    <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-blue-500" />
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">External Participants</h4>
                        <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9.5px] font-bold px-2 py-0.5 rounded-full border border-blue-200/40 dark:border-blue-900/30">{previewData.externalParticipants.length}</span>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-72 overflow-y-auto">
                      {previewData.externalParticipants.map((ep) => (
                        <div key={ep._key} className="px-5 py-2.5 flex items-center gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                          <div className="flex-1 min-w-0 flex items-center gap-3">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{ep.rawName}</span>
                            {ep.organization && <span className="text-[10px] text-slate-400">{ep.organization}</span>}
                            {ep.role && <span className="text-[10px] text-slate-400">{ep.role}</span>}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button type="button" onClick={() => {
                              const updated = previewData.externalParticipants.filter((e) => e._key !== ep._key);
                              const restored = { _key: ep._key, rawName: ep.rawName, office: "" };
                              setPreviewData({
                                ...previewData,
                                externalParticipants: updated,
                                unmatched: [...previewData.unmatched, restored],
                              });
                            }} className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">Undo</button>
                            <button type="button" onClick={() => {
                              const updated = previewData.externalParticipants.filter((e) => e._key !== ep._key);
                              setPreviewData({ ...previewData, externalParticipants: updated });
                            }} className="btn-glass bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border-red-200/50 dark:border-red-900/30 p-1.5 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-all duration-100"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Empty state when no attendees */}
                {previewData.matched.length === 0 && previewData.matchedDiff.length === 0 && previewData.unmatched.length === 0 && (!previewData.externalParticipants?.length) && (
                  <div className="text-center py-10">
                    <p className="text-xs text-slate-400">No attendees found in the uploaded file.</p>
                  </div>
                )}
              </div>

              {/* 5. Why Review Is Required */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowWhyReview(!showWhyReview)}
                  className="w-full px-5 py-3 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-slate-400" />
                    Why is manual review required?
                  </span>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${showWhyReview ? "rotate-180" : ""}`} />
                </button>
                {showWhyReview && (
                  <div className="px-5 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed space-y-2">
                      <p>Automatic matching is designed to assist the encoder, not replace administrative verification. Manual review is important because:</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        <li>External participants who legitimately do not exist in the employee database.</li>
                        <li>Employees using only their first name or abbreviated names.</li>
                        <li>Missing middle names or suffixes (Jr., Sr., III, etc.).</li>
                        <li>Nicknames and different capitalization or spacing.</li>
                        <li>Typographical errors in the attendance sheet.</li>
                        <li>Recently hired employees not yet encoded into the database.</li>
                        <li>Employees with recently updated information.</li>
                      </ul>
                      <p className="font-semibold text-slate-600 dark:text-slate-300">These situations should be expected rather than treated as system failures. The goal is to help you make informed decisions while keeping you in control of the final data.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 6. Review Acknowledgment */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl shadow-xs p-4">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={reviewAcknowledged}
                    onChange={(e) => setReviewAcknowledged(e.target.checked)}
                    className="h-4 w-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      I have reviewed all attendees and verified the seminar information.
                    </span>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      Please review every attendee before importing. Automatic matching is intended to reduce encoding time but should not replace administrative verification.
                    </p>
                  </div>
                </label>
              </div>

              {/* 7. Action buttons */}
              <div className="flex flex-wrap justify-end gap-3">
                <button type="button" onClick={resetImport} className="btn-glass text-xs py-2.5 px-5 cursor-pointer font-bold rounded-xl">
                  Discard
                </button>
                {previewData.rawEmployees?.length > 0 && (
                  <button type="button" onClick={handleRematch} className="btn-glass text-xs py-2.5 px-4 cursor-pointer font-bold rounded-xl">
                    Refresh Matches
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={previewData.matched.length + previewData.matchedDiff.length + (previewData.externalParticipants?.length || 0) === 0 || !reviewAcknowledged}
                  className="btn-glass bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 text-xs py-2.5 px-6 font-extrabold cursor-pointer rounded-xl transition-all duration-100 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
                >
                  {previewData.matched.length + previewData.matchedDiff.length + (previewData.externalParticipants?.length || 0) === 0
                    ? "No Attendees to Import"
                    : !reviewAcknowledged
                    ? "Review & Acknowledge to Import"
                    : `Import (${previewData.matched.length + previewData.matchedDiff.length + (previewData.externalParticipants?.length || 0)} attendees)`
                  }
                </button>
              </div>
            </div>
          )}

          {/* Manual Match Dialog */}
          {isManualMatchOpen && (
            <Modal title="Match Employee" onClose={closeManualMatch}>
              <div className="space-y-4 min-w-[380px]">
                {/* Attendee being matched */}
                {manualMatchKey && (() => {
                  const raw = previewData?.rawEmployees?.find((r) => r._key === manualMatchKey);
                  if (!raw) return null;
                  return (
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Matching attendee</div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-white">{raw.rawName}</div>
                      {raw.office && <div className="text-[10px] text-slate-500 mt-0.5">Office: {raw.office}</div>}
                    </div>
                  );
                })()}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name or employee ID..."
                    value={manualMatchSearch}
                    onChange={(e) => handleManualMatchSearch(e.target.value)}
                    autoFocus
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {manualMatchResults.length === 0 && manualMatchSearch.length >= 2 && (
                    <p className="text-[11px] text-slate-400 text-center py-6">No employees found matching "{manualMatchSearch}"</p>
                  )}
                  {manualMatchResults.length === 0 && manualMatchSearch.length < 2 && (
                    <p className="text-[11px] text-slate-400 text-center py-6">Type at least 2 characters to search employees</p>
                  )}
                  {manualMatchResults.map((emp: any) => (
                    <button
                      key={emp.EmployeeID}
                      type="button"
                      onClick={() => handleSelectManualMatch(emp)}
                      className="w-full text-left px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl transition-colors flex items-center gap-3 cursor-pointer group"
                    >
                      <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                        <User className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-800 dark:text-white">{emp.LastName}, {emp.FirstName} {emp.MiddleInitial || ""}</div>
                        <div className="text-[10px] text-slate-400 truncate">{emp.Office || ""} {emp.Position ? `· ${emp.Position}` : ""}</div>
                      </div>
                      {emp.EmployeeID && (
                        <span className="text-[10px] text-slate-400 shrink-0">ID: {emp.EmployeeID}</span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" onClick={closeManualMatch} className="btn-glass text-xs py-2 px-4 font-bold rounded-xl cursor-pointer">Cancel</button>
                </div>
              </div>
            </Modal>
          )}

          {/* IMPORT SUMMARY */}
          {importSummary && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/10 rounded-2xl p-8 max-w-md mx-auto text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-xs border border-emerald-500/20">
                <CheckCircle className="h-8 w-8 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Seminar Attendance Imported!</h3>
                <p className="text-xs text-slate-500">
                  All confirmed attendees (internal employees and external participants) have been linked to the seminar. Unmatched or unconfirmed entries were not imported.
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950/45 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-xs space-y-2.5 text-left shadow-inner">
                <div className="flex justify-between">
                  <span className="text-slate-500">New attendees linked:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{importSummary.added} records</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Duplicate entries skipped:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{importSummary.skipped} entries</span>
                </div>
              </div>
              <button onClick={resetImport} className="btn-glass bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 text-xs py-2.5 w-full font-bold rounded-xl cursor-pointer">
                Close & Return
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. MANUAL SEMINAR CREATION MODAL */}
      {isManualModalOpen && (
        <Modal isOpen onClose={() => setIsManualModalOpen(false)} title="Create New Seminar Manually" ariaLabel="Create New Seminar Manually" bodyClassName="space-y-4" maxWidth="max-w-lg"
          footer={
            <>
              <button onClick={() => setIsManualModalOpen(false)} className="btn-glass text-xs py-2 px-4 cursor-pointer font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform duration-100">
                Cancel <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal ml-1">Esc</span>
              </button>
              <button onClick={handleCreateSeminar} className="btn-glass bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 text-xs py-2 px-5 cursor-pointer font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-blue-500/5 transition-transform duration-100">
                Save Seminar <span className="text-[10px] text-blue-400 dark:text-blue-300 font-normal ml-1">Ctrl+Enter</span>
              </button>
            </>
          }
        >
          <div className="bg-slate-50 dark:bg-slate-950/40 rounded-xl px-4 py-3 border border-slate-200/60 dark:border-slate-800 flex items-center gap-3">
            <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Creating for <strong className="text-slate-800 dark:text-white">{year || currentYear}</strong> &bull; <strong className="text-slate-800 dark:text-white">{quarter || "Q2"}</strong>
            </span>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Seminar Name / Title</label>
            <input type="text" placeholder="e.g. Leadership Development Seminar" value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 dark:text-white font-semibold transition-colors duration-200" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Date</label>
              <input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 dark:text-white font-semibold transition-colors duration-200" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Venue / Location</label>
              <input type="text" placeholder="e.g. Training Center" value={manualLocation} onChange={(e) => setManualLocation(e.target.value)} className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 dark:text-white font-semibold transition-colors duration-200" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Facilitator / Speaker</label>
            <input type="text" placeholder="e.g. John Doe, HR Expert" value={manualSpeaker} onChange={(e) => setManualSpeaker(e.target.value)} className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 dark:text-white font-semibold transition-colors duration-200" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Description / Remarks</label>
            <textarea placeholder="e.g. Attendance is mandatory for all department heads" value={manualRemarks} onChange={(e) => setManualRemarks(e.target.value)} rows={2} className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 dark:text-white font-semibold transition-colors duration-200 resize-none" />
          </div>
        </Modal>
      )}
      {/* 5. EDIT SEMINAR DETAILS MODAL */}
      {isEditModalOpen && (
        <Modal isOpen onClose={() => setIsEditModalOpen(false)} title="Modify Seminar Properties" ariaLabel="Modify Seminar Properties" bodyClassName="space-y-4" maxWidth="max-w-lg"
          footer={
            <>
              <button onClick={() => setIsEditModalOpen(false)} className="btn-glass text-xs py-2 px-4 cursor-pointer font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform duration-100">
                Cancel <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal ml-1">Esc</span>
              </button>
              <button onClick={handleUpdateSeminar} className="btn-glass bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 text-xs py-2 px-5 cursor-pointer font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-blue-500/5 transition-transform duration-100">
                Update Info <span className="text-[10px] text-blue-400 dark:text-blue-300 font-normal ml-1">Ctrl+Enter</span>
              </button>
            </>
          }
        >
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Seminar Name / Title</label>
            <input type="text" placeholder="e.g. Leadership Development Seminar" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 dark:text-white font-semibold transition-colors duration-200" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Year</label>
              <input type="number" value={editYear} onChange={(e) => setEditYear(Number(e.target.value))} className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 dark:text-white font-semibold transition-colors duration-200" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Quarter</label>
              <select value={editQuarter} onChange={(e) => setEditQuarter(e.target.value as any)} className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 dark:text-white font-semibold transition-colors duration-200">
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
              <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 dark:text-white font-semibold transition-colors duration-200" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Venue / Location</label>
              <input type="text" placeholder="e.g. Training Center" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 dark:text-white font-semibold transition-colors duration-200" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Facilitator / Speaker</label>
            <input type="text" placeholder="e.g. John Doe, HR Expert" value={editSpeaker} onChange={(e) => setEditSpeaker(e.target.value)} className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 dark:text-white font-semibold transition-colors duration-200" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Description / Remarks</label>
            <textarea placeholder="e.g. Attendance is mandatory for all department heads" value={editRemarks} onChange={(e) => setEditRemarks(e.target.value)} rows={2} className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 dark:text-white font-semibold transition-colors duration-200 resize-none" />
          </div>
        </Modal>
      )}

      {/* 6. INTERACTIVE ATTENDEE PICKER DIALOG MODAL */}
      <Modal
        isOpen={isPickerOpen}
        onClose={() => { setIsPickerOpen(false); setSelectedPickerIds([]); setPickerSearch(""); }}
        maxWidth="max-w-lg"
        ariaLabel="Batch Add Attendees"
        hideCloseButton
        header={
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 px-6 py-4 shrink-0">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Batch Add Attendees</h3>
            <button onClick={() => { setIsPickerOpen(false); setSelectedPickerIds([]); setPickerSearch(""); }} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-all duration-100 cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          </div>
        }
        footer={
          <>
            <span className="text-xs text-slate-500 font-medium mr-auto">
              {selectedPickerIds.length} employee(s) selected
            </span>
            <button onClick={() => { setIsPickerOpen(false); setSelectedPickerIds([]); setPickerSearch(""); }} className="btn-glass text-xs py-2 px-4 cursor-pointer font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform duration-100">
              Cancel
            </button>
            <button
              onClick={handleAddAttendees}
              disabled={selectedPickerIds.length === 0}
              className="btn-glass bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 text-xs py-2 px-5 font-bold cursor-pointer rounded-xl disabled:opacity-50 disabled:pointer-events-none hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-blue-500/5 transition-all duration-100"
            >
              Add Selected
            </button>
          </>
        }
        bodyClassName="space-y-4"
      >
        {/* Search Input inside Picker */}
        <div className="relative shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search employees by name, office, or ID..."
            value={pickerSearch}
            onChange={(e) => setPickerSearch(e.target.value)}
            className="block w-full pl-9 pr-9 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 dark:text-white font-semibold transition-colors"
          />
          {pickerLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />
          )}
        </div>

        {/* List employee results with Checkboxes */}
        <div className="flex-1 overflow-y-auto min-h-40 max-h-[50vh] border border-slate-200/60 dark:border-slate-800 rounded-xl bg-slate-50/20 dark:bg-slate-950/20 divide-y divide-slate-100 dark:divide-slate-800 shadow-inner">
          {pickerLoading ? (
            <div className="text-center py-12 space-y-2">
              <Loader2 className="h-6 w-6 text-blue-500 animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-medium">Searching employees...</p>
            </div>
          ) : pickerSearch.trim().length < 2 ? (
            <div className="text-center py-12 space-y-2">
              <Search className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                Type a name or Employee ID to search...
              </p>
              <p className="text-[10px] text-slate-300 dark:text-slate-600">
                Minimum 2 characters required
              </p>
            </div>
          ) : pickerEmployees.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                <UserPlus className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                No employees match your search.
              </p>
              <p className="text-xs text-slate-400">
                Try a different search term or add their record.
              </p>
              {onAddNewRecord && (
                <button
                  type="button"
                  onClick={() => {
                    setIsPickerOpen(false);
                    setPickerSearch("");
                    setSelectedPickerIds([]);
                    onAddNewRecord();
                  }}
                  className="btn-glass bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 text-xs py-2 px-4 cursor-pointer font-bold rounded-xl inline-flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-100"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add New Record
                </button>
              )}
            </div>
          ) : (
            pickerEmployees.map((emp) => {
              const isChecked = selectedPickerIds.includes(emp.EmployeeID);
              return (
                <label
                  key={emp.EmployeeID}
                  className="flex items-center gap-3 p-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 cursor-pointer transition select-none"
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
                    <span className="font-bold text-xs text-slate-800 dark:text-white block truncate">
                      {emp.LastName}, {emp.FirstName} {emp.MiddleInitial || ""}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                      ID: {emp.EmployeeID} · {emp.Office} · {emp.Position}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate capitalize">
                      {emp.EmploymentStatus || "N/A"}
                    </span>
                  </div>
                </label>
              );
            })
          )}
        </div>
      </Modal>

      {/* 7. INLINE CREATE EMPLOYEE MODAL (import flow) */}
      <Modal
        isOpen={isCreateEmployeeOpen}
        onClose={handleCancelCreateEmployee}
        title="Create New Employee"
        maxWidth="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={handleCancelCreateEmployee}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateEmployee}
              disabled={isCreating}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              {isCreating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isCreating ? "Creating..." : "Create & Assign"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">First Name *</label>
              <input
                type="text"
                value={ceFirstName}
                onChange={(e) => setCeFirstName(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Juan"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Last Name *</label>
              <input
                type="text"
                value={ceLastName}
                onChange={(e) => setCeLastName(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Dela Cruz"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Middle Initial</label>
            <input
              type="text"
              value={ceMiddleInitial}
              onChange={(e) => setCeMiddleInitial(e.target.value)}
              className="w-full px-2.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="M"
              maxLength={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Office *</label>
              <input
                type="text"
                value={ceOffice}
                onChange={(e) => setCeOffice(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Provincial Capitol"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Position *</label>
              <input
                type="text"
                value={cePosition}
                onChange={(e) => setCePosition(e.target.value)}
                className="w-full px-2.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Administrative Aide"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* 8. EMPLOYEE PROFILE QUICK VIEW (shared component) */}
      <EmployeeProfileDrawer
        isOpen={isProfileOpen}
        employee={profileEmployee}
        needs={profileNeeds}
        seminars={profileSeminars}
        onClose={() => setIsProfileOpen(false)}
        onEdit={(empId) => { setIsProfileOpen(false); onSelectEmployee(empId); }}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
