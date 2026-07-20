import React, { useState, useEffect, useRef } from "react";
import { Search, Zap, Check, ChevronRight, ChevronLeft, AlertCircle, Plus, Trash2, Key, Filter } from "lucide-react";
import { Employee, LearningNeed, User } from "../types";
import { getStoredLearningNeedsClipboard, getStoredLearningNeedsClipboardCount, setStoredLearningNeedsClipboard } from "../utils/learningNeedClipboard";
import SearchableSelect from "./SearchableSelect";

interface RapidEncodingProps {
  currentUser: User;
  onSaveSuccess: () => void;
  customOptionsVersion: number;
}

export default function RapidEncoding({ currentUser, onSaveSuccess, customOptionsVersion }: RapidEncodingProps) {
  // Queue list states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [queueMode, setQueueMode] = useState<string>("no_needs");
  const [officeFilter, setOfficeFilter] = useState<string>("");
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState<string>("");
  const [employmentStatusFilter, setEmploymentStatusFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Custom Spotify-like playlist queue states
  const [queueType, setQueueType] = useState<"smart" | "playlist">("playlist");
  const [playlistQueue, setPlaylistQueue] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem("rapidEncoding_queue");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState("");
  const [playlistSearchResults, setPlaylistSearchResults] = useState<Employee[]>([]);
  const [loadingPlaylistSearch, setLoadingPlaylistSearch] = useState(false);
  const [queueSearchHighlightIndex, setQueueSearchHighlightIndex] = useState(0);

  // Active encoding states
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(() => {
    try {
      const savedId = localStorage.getItem("rapidEncoding_selectedId");
      if (savedId) {
        const queue = JSON.parse(localStorage.getItem("rapidEncoding_queue") || "[]");
        return queue.find((e: Employee) => e.EmployeeID === parseInt(savedId)) || null;
      }
    } catch {}
    return null;
  });
  const [firstName, setFirstName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [lastName, setLastName] = useState("");
  const [office, setOffice] = useState("");
  const [position, setPosition] = useState("");
  const [employmentType, setEmploymentType] = useState("Undefined (Pending Review)");
  const [employmentStatus, setEmploymentStatus] = useState("Undefined (Pending Review)");
  const [gender, setGender] = useState("Undefined (Pending Review)");
  const [newlyHired, setNewlyHired] = useState("N/A");
  const [dateOfAssumption, setDateOfAssumption] = useState("");
  const [needs, setNeeds] = useState<LearningNeed[]>([createEmptyNeed()]);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [clipboardCount, setClipboardCount] = useState(() => getStoredLearningNeedsClipboardCount());
  const [clipboardStatus, setClipboardStatus] = useState<string>("");
  const [clipboardFeedback, setClipboardFeedback] = useState<"copy" | "paste" | null>(null);

  // Options states
  const [officeOptions, setOfficeOptions] = useState<string[]>([]);
  const [positionOptions, setPositionOptions] = useState<string[]>([]);
  const [basisOptions, setBasisOptions] = useState<string[]>([]);
  const [methodologyOptions, setMethodologyOptions] = useState<string[]>([]);
  const [learningNeedOptions, setLearningNeedOptions] = useState<string[]>([]);
  const [scheduleOptions, setScheduleOptions] = useState<string[]>([]);

  // Feedback states
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isQueueOpen, setIsQueueOpen] = useState(true);

  // Refs to force blur or triggers
  const searchInputRef = useRef<HTMLInputElement>(null);
  const formContainerRef = useRef<HTMLFormElement | null>(null);
  const searchResultsListRef = useRef<HTMLDivElement | null>(null);

  // 1. Fetch queue list (custom pending queue)
  const fetchQueue = async (query: string = "") => {
    setLoadingQueue(true);
    try {
      const response = await fetch(
        `/api/employees/pending?search=${encodeURIComponent(query)}&office=${encodeURIComponent(officeFilter)}&employmentType=${encodeURIComponent(employmentTypeFilter)}&employmentStatus=${encodeURIComponent(employmentStatusFilter)}&mode=${queueMode}`
      );
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
        setTotalCount(data.total || 0);
        
        // Auto-select first employee if none is selected
        if (data.employees && data.employees.length > 0) {
          selectEmployee(data.employees[0]);
        } else {
          setSelectedEmployee(null);
        }
      }
    } catch (err) {
      console.error("Failed to load encoding queue:", err);
    } finally {
      setLoadingQueue(false);
    }
  };

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQueue(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, queueMode, officeFilter, employmentTypeFilter, employmentStatusFilter]);

  useEffect(() => {
    setQueueSearchHighlightIndex(0);
  }, [searchQuery, employees.length]);

  // Persist queue & selected employee to localStorage
  useEffect(() => {
    localStorage.setItem("rapidEncoding_queue", JSON.stringify(playlistQueue));
  }, [playlistQueue]);

  useEffect(() => {
    if (selectedEmployee) {
      localStorage.setItem("rapidEncoding_selectedId", selectedEmployee.EmployeeID.toString());
    } else {
      localStorage.removeItem("rapidEncoding_selectedId");
    }
  }, [selectedEmployee]);

  useEffect(() => {
    const list = searchResultsListRef.current;
    if (!list) return;
    const active = list.querySelector<HTMLElement>(`[data-search-result-index="${queueSearchHighlightIndex}"]`);
    active?.scrollIntoView({ block: "nearest" });
  }, [queueSearchHighlightIndex]);

  // Debounced search for Spotify-like playlist queue additions
  useEffect(() => {
    if (!playlistSearchQuery.trim()) {
      setPlaylistSearchResults([]);
      return;
    }
    setLoadingPlaylistSearch(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/employees/pending?search=${encodeURIComponent(playlistSearchQuery)}&mode=all`);
        if (response.ok) {
          const data = await response.json();
          setPlaylistSearchResults(data.employees || []);
        }
      } catch (err) {
        console.error("Failed to search employees for playlist:", err);
      } finally {
        setLoadingPlaylistSearch(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [playlistSearchQuery]);

  // Helper to add employee to playlist queue
  const addToPlaylist = (emp: Employee) => {
    if (playlistQueue.some((e) => e.EmployeeID === emp.EmployeeID)) {
      return; // Already added
    }
    const updated = [...playlistQueue, emp];
    setPlaylistQueue(updated);
    if (!selectedEmployee || playlistQueue.length === 0) {
      selectEmployee(emp);
    }
  };

  // Helper to remove employee from playlist queue
  const removeFromPlaylist = (empId: number) => {
    const updated = playlistQueue.filter((e) => e.EmployeeID !== empId);
    setPlaylistQueue(updated);
    if (selectedEmployee?.EmployeeID === empId) {
      if (updated.length > 0) {
        selectEmployee(updated[0]);
      } else {
        setSelectedEmployee(null);
      }
    }
  };

  // Helper to add all current search results to playlist queue
  const handleAddAllToPlaylist = () => {
    const updated = [...playlistQueue];
    employees.forEach((emp) => {
      if (!updated.some((e) => e.EmployeeID === emp.EmployeeID)) {
        updated.push(emp);
      }
    });
    setPlaylistQueue(updated);
    if (updated.length > 0 && !selectedEmployee) {
      selectEmployee(updated[0]);
    }
  };

  const handleQueueSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const hasResults = employees.length > 0;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (hasResults) {
        setQueueSearchHighlightIndex((prev) => Math.min(prev + 1, employees.length - 1));
      }
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (hasResults) {
        setQueueSearchHighlightIndex((prev) => Math.max(prev - 1, 0));
      }
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (!hasResults || loadingQueue) return;

      const highlighted = employees[Math.min(queueSearchHighlightIndex, employees.length - 1)];
      if (!highlighted) return;

      if (playlistQueue.some((emp) => emp.EmployeeID === highlighted.EmployeeID)) {
        selectEmployee(highlighted);
      } else {
        addToPlaylist(highlighted);
      }
    }
  };

  // 2. Load custom options
  const fetchOptions = () => {
    ["basis", "methodology", "office", "position", "learningNeed", "schedule"].forEach((type) => {
      fetch(`/api/options/${type}`)
        .then((res) => res.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : [];
          if (type === "basis") setBasisOptions(list);
          else if (type === "methodology") setMethodologyOptions(list);
          else if (type === "office") setOfficeOptions(list);
          else if (type === "position") setPositionOptions(list);
          else if (type === "learningNeed") setLearningNeedOptions(list);
          else if (type === "schedule") setScheduleOptions(list);
        });
    });
  };

  useEffect(() => {
    fetchOptions();
  }, [customOptionsVersion]);

  // 3. Selection handler
  const selectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setFirstName(emp.FirstName);
    setMiddleInitial(emp.MiddleInitial || "");
    setLastName(emp.LastName);
    setOffice(emp.Office);
    setPosition(emp.Position);
    setEmploymentType(emp.EmploymentType || "Undefined (Pending Review)");
    setEmploymentStatus(emp.EmploymentStatus || "Undefined (Pending Review)");
    setGender(emp.Gender || "Undefined (Pending Review)");
    setNewlyHired(emp.NewlyHired || "N/A");
    setDateOfAssumption(emp.DateOfAssumption ? emp.DateOfAssumption.substring(0, 10) : "");
    setNeeds([createEmptyNeed()]);
    setError(null);
  };

  // Helper template
  function createEmptyNeed(): LearningNeed {
    return {
      LearningNeed: "",
      Basis: ["Advanced Knowledge"],
      Methodology: ["Seminar/Training"],
      TargetSchedule: `1st Quarter of ${new Date().getFullYear()}`,
    };
  }

  // Handle addition of standard options
  const handleAddCustomOption = async (type: string, value: string) => {
    if (!value.trim()) return;
    try {
      await fetch(`/api/options/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: value.trim() }),
      });
      fetchOptions();
    } catch (err) {
      console.error(`Failed to add custom option for ${type}:`, err);
    }
  };

  const handleDeleteCustomOption = async (type: string, value: string) => {
    if (!value.trim() || value === "Undefined (Pending Review)") return;

    try {
      await fetch(`/api/options/${type}/${encodeURIComponent(value)}`, { method: "DELETE" });
      fetchOptions();
    } catch (err) {
      console.error(`Failed to delete option for ${type}:`, err);
    }
  };

  // Learning Need row handlers
  const handleNeedChange = (index: number, field: keyof LearningNeed, value: any) => {
    const updated = [...needs];
    updated[index] = { ...updated[index], [field]: value };
    setNeeds(updated);
  };

  const addNeedRow = () => {
    setIsAddingCard(true);
    setNeeds((prev) => {
      if (prev.length > 0) {
        const lastNeed = prev[prev.length - 1];
        const copyNeed: LearningNeed = {
          LearningNeed: "",
          Basis: [...lastNeed.Basis],
          Methodology: [...lastNeed.Methodology],
          TargetSchedule: lastNeed.TargetSchedule,
        };
        return [...prev, copyNeed];
      }
      return [...prev, createEmptyNeed()];
    });
  };

  const removeNeedRow = (index: number) => {
    if (needs.length === 1) {
      setNeeds([createEmptyNeed()]);
    } else {
      setNeeds(needs.filter((_, i) => i !== index));
    }
  };

  useEffect(() => {
    if (!clipboardFeedback) return;
    const timer = window.setTimeout(() => {
      setClipboardFeedback(null);
      setClipboardStatus("");
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [clipboardFeedback]);

  const handleCopyNeedsToClipboard = () => {
    const cleanNeeds = needs.filter((need) => need.LearningNeed.trim() !== "");
    if (cleanNeeds.length === 0) {
      setClipboardFeedback(null);
      setClipboardStatus("No learning needs to copy yet.");
      return;
    }

    setStoredLearningNeedsClipboard(cleanNeeds);
    setClipboardCount(cleanNeeds.length);
    setClipboardFeedback("copy");
    setClipboardStatus(`Copied ${cleanNeeds.length} learning need${cleanNeeds.length === 1 ? "" : "s"}.`);
  };

  const handlePasteNeedsFromClipboard = () => {
    const storedNeeds = getStoredLearningNeedsClipboard();
    if (storedNeeds.length === 0) {
      setClipboardStatus("Clipboard is empty. Copy a set of learning needs first.");
      return;
    }

    const pastedNeeds = storedNeeds.map((need) => ({
      ...need,
      Basis: Array.isArray(need.Basis) ? [...need.Basis] : [need.Basis || "Advanced Knowledge"],
      Methodology: Array.isArray(need.Methodology) ? [...need.Methodology] : [need.Methodology || "Seminar/Training"],
    }));

    setNeeds(pastedNeeds.length > 0 ? pastedNeeds : [createEmptyNeed()]);
    setClipboardCount(pastedNeeds.length);
    setClipboardFeedback("paste");
    setClipboardStatus(`Pasted ${pastedNeeds.length} learning need${pastedNeeds.length === 1 ? "" : "s"}.`);
  };

  // Skip handler
  const handleSkip = () => {
    if (!selectedEmployee) return;
    
    if (queueType === "playlist") {
      const currentIndex = playlistQueue.findIndex((e) => e.EmployeeID === selectedEmployee.EmployeeID);
      if (currentIndex !== -1 && currentIndex + 1 < playlistQueue.length) {
        selectEmployee(playlistQueue[currentIndex + 1]);
      } else if (playlistQueue.length > 1) {
        selectEmployee(playlistQueue[0]);
      }
    } else {
      const currentIndex = employees.findIndex((e) => e.EmployeeID === selectedEmployee.EmployeeID);
      if (currentIndex !== -1 && currentIndex + 1 < employees.length) {
        selectEmployee(employees[currentIndex + 1]);
      } else if (employees.length > 1) {
        selectEmployee(employees[0]);
      }
    }
  };

  // Save handler
  const handleSaveAndNext = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedEmployee) return;

    // Validate
    const cleanNeeds = needs.filter((n) => n.LearningNeed.trim() !== "");
    if (cleanNeeds.length === 0) {
      setError("Please specify at least one learning need before saving.");
      return;
    }

    // Check for duplicate learning needs
    const uniqueNeeds = new Set(cleanNeeds.map((n) => n.LearningNeed.trim().toLowerCase()));
    if (uniqueNeeds.size !== cleanNeeds.length) {
      setError("Duplicate learning needs detected. Please remove duplicates.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      firstName: firstName.trim(),
      middleInitial: middleInitial.trim(),
      lastName: lastName.trim(),
      office: office,
      position: position,
      employmentType: employmentType,
      employmentStatus: employmentStatus,
      gender: gender,
      newlyHired: newlyHired,
      dateOfAssumption: dateOfAssumption ? new Date(dateOfAssumption).toISOString() : null,
      needs: cleanNeeds,
      username: currentUser.username,
    };

    try {
      const response = await fetch(`/api/employees/${selectedEmployee.EmployeeID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save employee training plans.");
      }

      const currentId = selectedEmployee.EmployeeID;
      
      if (queueType === "playlist") {
        // Success! Remove from playlist queue
        const updatedPlaylist = playlistQueue.filter((e) => e.EmployeeID !== currentId);
        setPlaylistQueue(updatedPlaylist);
        
        onSaveSuccess();
        
        if (updatedPlaylist.length > 0) {
          selectEmployee(updatedPlaylist[0]);
        } else {
          setSelectedEmployee(null);
        }
      } else {
        // Success! Remove from local smart queue
        const updatedQueue = employees.filter((e) => e.EmployeeID !== currentId);
        setEmployees(updatedQueue);
        setTotalCount((c) => Math.max(0, c - 1));

        onSaveSuccess();

        if (updatedQueue.length > 0) {
          selectEmployee(updatedQueue[0]);
        } else {
          fetchQueue(searchQuery);
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  // Bind keyboard shortcuts: Ctrl+Enter (Save), Ctrl+Right (Skip), and Alt+N (Add need card)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleSaveAndNext();
      } else if (e.ctrlKey && e.key === "ArrowRight") {
        e.preventDefault();
        handleSkip();
      } else if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        addNeedRow();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedEmployee, firstName, lastName, office, position, employmentType, employmentStatus, gender, newlyHired, dateOfAssumption, needs, queueType, playlistQueue]);

  // Bring newly added learning need cards into view inside rapid encoding
  useEffect(() => {
    if (isAddingCard && needs.length > 0) {
      setIsAddingCard(false);
      setTimeout(() => {
        const targetCard = formContainerRef.current?.querySelector(
          `[data-need-card-index="${needs.length - 1}"]`
        ) as HTMLElement | null;
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: "smooth", block: "end" });
        }
      }, 100);
    }
  }, [needs.length, isAddingCard]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-12rem)] relative items-start">
      {/* 1. Left Queue List Panel */}
      <div className={`transition-all duration-300 ease-in-out bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col shrink-0 ${
        isQueueOpen 
          ? "w-full lg:w-[320px] opacity-100" 
          : "w-0 h-0 lg:w-0 lg:h-auto opacity-0 overflow-hidden border-none pointer-events-none p-0 m-0"
      }`}>
        
        {/* Workspace Title & Filters Button */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between transition-colors duration-200 shrink-0">
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-display">
              <Zap className="h-4 w-4 text-amber-500 fill-amber-500/20" />
              Playlist Ingestion Queue
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {playlistQueue.length} In Queue
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-glass px-2.5 py-1.5 rounded-xl text-[11px] font-semibold cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 ${
                showFilters 
                  ? "bg-amber-500/10" 
                  : ""
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Filters</span>
            </button>
            <button
              type="button"
              onClick={() => setIsQueueOpen(false)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 transition cursor-pointer"
              title="Collapse Queue"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 space-y-3.5 transition-all duration-200 shrink-0 animate-in slide-in-from-top-2 duration-150">
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Queue Mode
              </label>
              <select
                value={queueMode}
                onChange={(e) => setQueueMode(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 text-xs transition duration-200"
              >
                <option value="no_needs">No Learning Needs (Default)</option>
                <option value="has_needs">With Learning Needs</option>
                <option value="all">All Employees</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Office / Department
              </label>
              <SearchableSelect
                value={officeFilter || "All Offices"}
                onChange={(val) => setOfficeFilter(val === "All Offices" ? "" : val)}
                options={["All Offices", ...officeOptions]}
                placeholder="All Offices"
                allowCustom={false}
              />
            </div>

            <div className="mt-3">
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Employment Status
              </label>
              <select
                value={employmentStatusFilter}
                onChange={(e) => setEmploymentStatusFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 text-xs transition duration-200"
              >
                <option value="">All Statuses</option>
                <option value="permanent">Permanent</option>
                <option value="co-terminous">Co-Terminous</option>
                <option value="elective official">Elective Official</option>
                <option value="casual">Casual</option>
                <option value="job order">Job Order</option>
                <option value="consultant">Consultant</option>
                <option value="newly hired">Newly Hired</option>
                <option value="re-employed">Re-employed</option>
                <option value="undefined (pending review)">Undefined</option>
              </select>
            </div>
          </div>
        )}

        {/* Search database input */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/10 dark:bg-slate-950/5 transition-colors duration-200 shrink-0 space-y-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search database to add to queue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleQueueSearchKeyDown}
              className="block w-full pl-9 pr-3.5 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-slate-200 text-xs transition-all duration-200"
            />
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal italic px-0.5">
            Note: If an employee does not appear, they may already have a learning need encoded. Use the "View Records" tab to edit them.
          </p>
        </div>

        {/* Conditional Search & Filter Results list */}
        {(() => {
          const isSearching = searchQuery.trim() !== "" || officeFilter !== "" || employmentTypeFilter !== "" || employmentStatusFilter !== "" || (queueMode !== "no_needs" && showFilters);
          return isSearching && (
            <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/10 dark:bg-slate-950/5 flex flex-col max-h-[300px] shrink-0">
              {/* Results Header */}
              <div className="px-4 py-2 bg-slate-50/30 dark:bg-slate-950/10 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Search Results ({employees.length})
                </span>
                <div className="flex items-center gap-2">
                  {employees.length > 0 && (
                    <button
                      type="button"
                      onClick={handleAddAllToPlaylist}
                      className="text-[9px] font-bold text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer font-sans"
                    >
                      + Queue Page
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setOfficeFilter("");
                      setEmploymentTypeFilter("");
                      setEmploymentStatusFilter("");
                      setQueueMode("no_needs");
                    }}
                    className="text-[9px] font-bold text-slate-400 hover:text-slate-655 cursor-pointer font-sans"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Items scroll */}
              <div ref={searchResultsListRef} className="flex-1 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800/50">
                {loadingQueue ? (
                  <div className="p-4 text-center text-xs text-slate-400">Loading results...</div>
                ) : employees.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">No employees match filters.</div>
                ) : (
                  employees.map((emp, index) => {
                    const alreadyQueued = playlistQueue.some((q) => q.EmployeeID === emp.EmployeeID);
                    const isHighlighted = index === queueSearchHighlightIndex;
                    return (
                      <div
                        key={emp.EmployeeID}
                        data-search-result-index={index}
                        onMouseEnter={() => setQueueSearchHighlightIndex(index)}
                        className={`p-3 flex items-center justify-between gap-3 text-xs transition-colors duration-100 ${
                          isHighlighted
                            ? "bg-blue-50 dark:bg-blue-950/30"
                            : "bg-white dark:bg-slate-900"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className={`font-bold truncate ${isHighlighted ? "text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-300"}`}>
                            {emp.LastName}, {emp.FirstName}
                          </p>
                          <p className="text-[9px] text-slate-400 truncate mt-0.5 font-medium">{emp.Office}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!alreadyQueued) {
                              addToPlaylist(emp);
                            } else {
                              removeFromPlaylist(emp.EmployeeID);
                            }
                          }}
                          className={`btn-glass p-1 px-2.5 rounded-lg text-[9px] font-bold cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 ${
                            alreadyQueued
                              ? "bg-emerald-500/10"
                              : "bg-blue-500/10"
                          }`}
                        >
                          {alreadyQueued ? "✓ Queued" : "+ Add"}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })()}

        {/* Playlist Queue Header */}
        <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0">
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
            Active Queue Playlist
          </span>
          {playlistQueue.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setPlaylistQueue([]);
                setSelectedEmployee(null);
              }}
              className="text-[9px] font-bold text-red-500 hover:text-red-655 dark:hover:text-red-400 cursor-pointer"
            >
              Clear Queue
            </button>
          )}
        </div>

        {/* Active Queue Playlist items */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800/50">
          {playlistQueue.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2.5 min-h-[250px]">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-500 font-bold text-lg">
                Q
              </div>
              <p className="max-w-[200px] text-slate-400 leading-relaxed font-medium">
                Your custom queue is empty. Search names above or apply filters to queue employees.
              </p>
            </div>
          ) : (
            playlistQueue.map((emp, index) => {
              const active = selectedEmployee?.EmployeeID === emp.EmployeeID;
              return (
                <div
                  key={emp.EmployeeID}
                  className={`p-3.5 flex items-start gap-3 transition-colors duration-150 ${
                    active 
                      ? "active-queue-item" 
                      : "hover:bg-slate-50/50 dark:hover:bg-slate-950/20"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => selectEmployee(emp)}
                    className="flex-1 text-left min-w-0 cursor-pointer"
                  >
                    <p className={`text-xs font-bold truncate ${active ? "active-queue-item-text" : "text-slate-700 dark:text-slate-300"}`}>
                      <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px] mr-1.5 font-bold">
                        {(index + 1).toString().padStart(2, "0")}
                      </span>
                      {emp.LastName}, {emp.FirstName}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-semibold uppercase tracking-wider">{emp.Office}</p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => removeFromPlaylist(emp.EmployeeID)}
                    className="btn-glass bg-red-500/10 p-1.5 rounded-xl cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 self-center"
                    title="Remove from queue"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Right Entry Form Panel */}
      <div className="flex-1 w-full flex flex-col gap-6 transition-all duration-300 ease-in-out">
        {!selectedEmployee ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 text-center flex flex-col items-center justify-center min-h-[400px] transition-colors duration-200 relative">
            {!isQueueOpen && (
              <button
                type="button"
                onClick={() => setIsQueueOpen(true)}
                className="absolute top-4 left-4 p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-sm"
                title="Expand Queue"
              >
                <ChevronRight className="h-4.5 w-4.5" />
              </button>
            )}
            <Zap className="h-12 w-12 text-amber-500 bg-amber-500/10 p-2.5 rounded-2xl animate-pulse mb-4" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 font-display">No Employee Selected</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1.5">
              Select a pending encoder entry from the queue on the left to start adding their Individual Learning and Development Plan.
            </p>
          </div>
        ) : (
          <form
            ref={formContainerRef}
            onSubmit={handleSaveAndNext}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-visible transition-colors duration-200"
          >
            {/* Header info */}
            <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 p-6 rounded-t-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors duration-200">
              <div className="flex items-center gap-3">
                {!isQueueOpen && (
                  <button
                    type="button"
                    onClick={() => setIsQueueOpen(true)}
                    className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-sm"
                    title="Expand Queue"
                  >
                    <ChevronRight className="h-4.5 w-4.5" />
                  </button>
                )}
                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-base shrink-0">
                  {lastName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800 dark:text-slate-200 leading-tight font-display">
                    {lastName}, {firstName} {middleInitial}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">
                    Encoder Target Entry
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition"
                  title="Skip (Ctrl + Right)"
                >
                  Skip Record
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-glass bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-900/30 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Save & Select Next (Ctrl + Enter)"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Save & Next
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {error && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-[10px] flex items-center justify-center gap-2 backdrop-blur-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="text-center font-semibold">{error}</span>
                </div>
              )}

              {/* Step 1: Employee Demographic Fields */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Demographic Profile</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Office */}
                  <div className="md:col-span-2">
                    <SearchableSelect
                      label="Office / Department"
                      value={office}
                      onChange={(val) => {
                        if (val !== "Undefined (Pending Review)" && !officeOptions.includes(val)) {
                          handleAddCustomOption("office", val);
                        }
                        setOffice(val);
                      }}
                      options={["Undefined (Pending Review)", ...officeOptions]}
                      placeholder="Select Office..."
                      required
                      allowCustom
                      onDeleteCustom={(val) => handleDeleteCustomOption("office", val)}
                      isCustom={() => true}
                    />
                  </div>

                  {/* Position */}
                  <div className="md:col-span-2">
                    <SearchableSelect
                      label="Official Position"
                      value={position}
                      onChange={(val) => {
                        if (val !== "Undefined (Pending Review)" && !positionOptions.includes(val)) {
                          handleAddCustomOption("position", val);
                        }
                        setPosition(val);
                      }}
                      options={["Undefined (Pending Review)", ...positionOptions]}
                      placeholder="Select Position..."
                      required
                      allowCustom
                      onDeleteCustom={(val) => handleDeleteCustomOption("position", val)}
                      isCustom={() => true}
                    />
                  </div>

                  {/* Employment Status */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Status
                    </label>
                    <SearchableSelect
                      value={employmentStatus}
                      onChange={setEmploymentStatus}
                      options={["Undefined (Pending Review)", "Newly Hired", "Re-employed", "Casual", "Permanent", "Co-Terminous", "Elective Official", "Job Order", "Consultant"]}
                      placeholder="Status"
                      allowCustom={false}
                    />
                  </div>

                  {/* Gender */}
                  <div className="md:col-span-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Gender
                    </label>
                    <SearchableSelect
                      value={gender}
                      onChange={setGender}
                      options={["Undefined (Pending Review)", "Female", "Male"]}
                      placeholder="Gender"
                      allowCustom={false}
                    />
                  </div>

                  {/* Newly Hired */}
                  <div className="md:col-span-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Newly Hired
                    </label>
                    <SearchableSelect
                      value={newlyHired}
                      onChange={setNewlyHired}
                      options={["N/A", "Newly Hired", "Reemployed"]}
                      placeholder="Newly Hired"
                      allowCustom={false}
                    />
                  </div>

                  {/* Date of Assumption */}
                  <div className="md:col-span-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Assumed Date
                    </label>
                    <input
                      type="date"
                      value={dateOfAssumption}
                      onChange={(e) => setDateOfAssumption(e.target.value)}
                      className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-slate-100 text-xs transition-colors duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Learning Needs Builder */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Encode ILDP Needs</h4>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyNeedsToClipboard}
                      className={`btn-glass transition-all duration-200 hover:-translate-y-0.5 active:scale-95 bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60 text-[10px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer shadow-xs ${clipboardFeedback === "copy" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300/60 dark:border-emerald-700/60" : ""}`}
                    >
                      {clipboardFeedback === "copy" ? "✓ Copied" : "Copy Needs"}
                    </button>
                    <button
                      type="button"
                      onClick={handlePasteNeedsFromClipboard}
                      className={`btn-glass transition-all duration-200 hover:-translate-y-0.5 active:scale-95 bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60 text-[10px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer shadow-xs ${clipboardFeedback === "paste" ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-300/60 dark:border-blue-700/60" : ""}`}
                    >
                      {clipboardFeedback === "paste" ? "✓ Pasted" : "Paste Needs"}
                    </button>
                    <button
                      type="button"
                      onClick={addNeedRow}
                      className="btn-glass bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30 text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition shadow-xs"
                    >
                      <Plus className="h-3 w-3" />
                      Add Need Plan
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1">Clipboard: {clipboardCount} need{clipboardCount === 1 ? "" : "s"}</span>
                  {clipboardStatus && (
                    <span className={`rounded-full px-2.5 py-1 transition-all duration-300 ${clipboardFeedback ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300" : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"}`}>
                      {clipboardStatus}
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  {needs.map((need, idx) => (
                    <div
                      key={idx}
                      data-need-card-index={idx}
                      className="p-4 bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-xl relative transition-all duration-200"
                    >
                      <button
                        type="button"
                        onClick={() => removeNeedRow(idx)}
                        className="btn-glass bg-red-500/10 p-1.5 rounded-xl cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 absolute top-3.5 right-3.5"
                        title="Remove row"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* Learning Need */}
                        <div className="md:col-span-12 pr-8 min-w-0">
                          <SearchableSelect
                            label={`Learning Need / Competency Opportunity #${idx + 1}`}
                            value={need.LearningNeed}
                            onChange={(val) => {
                              if (val !== "Undefined (Pending Review)" && !learningNeedOptions.includes(val)) {
                                handleAddCustomOption("learningNeed", val);
                              }
                              handleNeedChange(idx, "LearningNeed", val);
                            }}
                            options={["Undefined (Pending Review)", ...learningNeedOptions]}
                            placeholder="Select or specify needed competency..."
                            required
                            allowCustom
                            onDeleteCustom={(val) => handleDeleteCustomOption("learningNeed", val)}
                            isCustom={() => true}
                            autoFocus={isAddingCard && idx === needs.length - 1}
                          />
                        </div>

                        {/* Basis of L&D Needs */}
                        <div className="md:col-span-4 space-y-2 min-w-0">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Basis of Need
                          </label>
                          <div className="space-y-2">
                            {need.Basis.map((basis, bIdx) => (
                              <div key={bIdx} className="flex items-center gap-2">
                                <div className="flex-1">
                                  <SearchableSelect
                                    label=""
                                    value={basis}
                                    onChange={(val) => {
                                      if (!basisOptions.includes(val)) {
                                        handleAddCustomOption("basis", val);
                                      }
                                      const newBasis = [...need.Basis];
                                      newBasis[bIdx] = val;
                                      handleNeedChange(idx, "Basis", newBasis);
                                    }}
                                    options={basisOptions}
                                    placeholder="Select basis..."
                                    required
                                    allowCustom
                                    onDeleteCustom={(val) => handleDeleteCustomOption("basis", val)}
                                    isCustom={() => true}
                                    autoFocus={basis === "" && bIdx === need.Basis.length - 1 && bIdx > 0}
                                  />
                                </div>
                                {need.Basis.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newBasis = need.Basis.filter((_, i) => i !== bIdx);
                                      handleNeedChange(idx, "Basis", newBasis);
                                    }}
                                    className="text-red-500 hover:text-red-700 hover:scale-105 active:scale-95 transition-all p-1 cursor-pointer"
                                    title="Remove basis"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => handleNeedChange(idx, "Basis", [...need.Basis, ""])}
                              className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="h-3 w-3" /> Add Basis
                            </button>
                          </div>
                        </div>

                        {/* Proposed Action / Methodology */}
                        <div className="md:col-span-4 space-y-2 min-w-0">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Proposed Methodology
                          </label>
                          <div className="space-y-2">
                            {need.Methodology.map((meth, mIdx) => (
                              <div key={mIdx} className="flex items-center gap-2">
                                <div className="flex-1">
                                  <SearchableSelect
                                    label=""
                                    value={meth}
                                    onChange={(val) => {
                                      if (!methodologyOptions.includes(val)) {
                                        handleAddCustomOption("methodology", val);
                                      }
                                      const newMeth = [...need.Methodology];
                                      newMeth[mIdx] = val;
                                      handleNeedChange(idx, "Methodology", newMeth);
                                    }}
                                    options={methodologyOptions}
                                    placeholder="Select methodology..."
                                    required
                                    allowCustom
                                    onDeleteCustom={(val) => handleDeleteCustomOption("methodology", val)}
                                    isCustom={() => true}
                                    autoFocus={meth === "" && mIdx === need.Methodology.length - 1 && mIdx > 0}
                                  />
                                </div>
                                {need.Methodology.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newMeth = need.Methodology.filter((_, i) => i !== mIdx);
                                      handleNeedChange(idx, "Methodology", newMeth);
                                    }}
                                    className="text-red-500 hover:text-red-700 hover:scale-105 active:scale-95 transition-all p-1 cursor-pointer"
                                    title="Remove methodology"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => handleNeedChange(idx, "Methodology", [...need.Methodology, ""])}
                              className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="h-3 w-3" /> Add Methodology
                            </button>
                          </div>
                        </div>

                        {/* Target Schedule */}
                        <div className="md:col-span-4 min-w-0">
                          <SearchableSelect
                            label="Target Schedule"
                            value={need.TargetSchedule}
                            onChange={(val) => {
                              if (!scheduleOptions.includes(val)) {
                                handleAddCustomOption("schedule", val);
                              }
                              handleNeedChange(idx, "TargetSchedule", val);
                            }}
                            options={scheduleOptions}
                            placeholder="Select schedule..."
                            required
                            allowCustom
                            onDeleteCustom={(val) => handleDeleteCustomOption("schedule", val)}
                            isCustom={() => true}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>             {/* Form Footer Keyboard Shortcuts Help */}
            <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 px-6 py-4 rounded-b-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-400 font-semibold font-mono tracking-wide uppercase transition-colors duration-200">
              <span className="flex items-center gap-1.5">
                <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">Ctrl + Enter</span>
                <span>Save & Next</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">Alt + N</span>
                <span>Add Need Card</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">Ctrl + →</span>
                <span>Skip Employee</span>
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
