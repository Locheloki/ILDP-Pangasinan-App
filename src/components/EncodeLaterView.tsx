import React, { useState, useEffect, useRef } from "react";
import { CheckCircle, Clock, Trash2, Search, ArrowRight, UserPlus, Sparkles, Building2, BookOpen } from "lucide-react";
import { Employee } from "../types";
import EmployeeForm from "./EmployeeForm";
import Modal from "./Modal";

interface EncodeLaterViewProps {
  onQueueUpdated: () => void;
  currentUser: any;
}

export default function EncodeLaterView({ onQueueUpdated, currentUser }: EncodeLaterViewProps) {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Matching states
  const [matchingItem, setMatchingItem] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Employee[]>([]);
  
  const [isEmployeeFormOpen, setIsEmployeeFormOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchQueue = async () => {
    try {
      const res = await fetch("/api/encode-later");
      const data = await res.json();
      setQueue(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  useEffect(() => {
    if (matchingItem && searchInputRef.current) {
      searchInputRef.current.focus();
      const len = searchInputRef.current.value.length;
      searchInputRef.current.setSelectionRange(len, len);
    }
  }, [matchingItem]);

  const handleRemove = async (id: string) => {
    if (!window.confirm("Remove this entry from the encode later queue?")) return;
    try {
      await fetch(`/api/encode-later/${id}`, { method: "DELETE" });
      fetchQueue();
      onQueueUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/employees/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (Array.isArray(data)) setSearchResults(data.slice(0, 20));
    } catch (err) {
      setSearchResults([]);
    }
  };

  const handleMatch = (item: any) => {
    setMatchingItem(item);
    // Extract last name for cleaner initial search
    let searchName = item.rawName || "";
    if (searchName.includes(",")) {
      searchName = searchName.split(",")[0].trim();
    } else {
      const parts = searchName.trim().split(/\s+/);
      searchName = parts.length > 1 ? parts[parts.length - 1] : searchName;
    }
    setSearchQuery(searchName);
    handleSearch(searchName);
  };

  const confirmMatch = async (emp: Employee) => {
    if (!matchingItem) return;
    try {
      const newNeed = {
        EmployeeID: emp.EmployeeID,
        Year: matchingItem.seminarYear,
        Quarter: matchingItem.seminarQuarter,
        Title: matchingItem.seminarTitle,
        Reason: "Imported from Encode Later",
        Type: "Technical/Functional",
        Status: "Pending"
      };
      
      const res = await fetch("/api/learning-needs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNeed)
      });
      
      if (res.ok) {
        await fetch(`/api/encode-later/${matchingItem.id}`, { method: "DELETE" });
        setMatchingItem(null);
        fetchQueue();
        onQueueUpdated();
      } else {
        alert("Failed to add learning need.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 dark:bg-amber-500/20 rounded-2xl text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">
                  Encode Later Queue
                </h2>
                <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200/40 dark:border-amber-900/30">
                  {queue.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Deferred attendees waiting for database matching or employee creation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/10 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs font-medium animate-pulse">
            Loading deferred queue items...
          </div>
        ) : queue.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-full text-emerald-500 dark:text-emerald-400 mb-3 border border-emerald-100 dark:border-emerald-900/30">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">All Caught Up!</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              There are currently no attendees deferred in the Encode Later queue.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {queue.map((item) => (
              <div
                key={item.id}
                className="p-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                      {item.rawName}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {item.office && (
                      <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {item.office}
                      </span>
                    )}
                    {item.seminarTitle && (
                      <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-blue-200/40 dark:border-blue-900/30">
                        <BookOpen className="w-3 h-3" />
                        {item.seminarTitle} {item.seminarYear && `(${item.seminarYear})`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleMatch(item)}
                    className="btn-glass bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30 text-xs py-1.5 px-3 font-bold rounded-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-100 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Match
                  </button>
                  <button
                    onClick={() => handleRemove(item.id)}
                    title="Remove from queue"
                    className="btn-glass bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border-red-200/50 dark:border-red-900/30 p-2 rounded-xl cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all duration-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Match Modal */}
      {matchingItem && (
        <Modal
          isOpen={!!matchingItem}
          onClose={() => { setMatchingItem(null); setSearchResults([]); }}
          title="Match Queue Attendee"
          maxWidth="max-w-lg"
          footer={
            <div className="flex items-center justify-between w-full gap-2">
              <button
                type="button"
                onClick={() => setIsEmployeeFormOpen(true)}
                className="btn-glass bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30 text-xs py-2 px-3.5 font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" /> Create New Employee
              </button>
              <button
                type="button"
                onClick={() => { setMatchingItem(null); setSearchResults([]); }}
                className="btn-glass text-xs py-2 px-4 font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>
          }
        >
          <div className="space-y-4 min-w-[340px]">
            {/* Attendee Info Header */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Matching Queue Attendee
              </div>
              <div className="text-sm font-semibold text-slate-800 dark:text-white">
                {matchingItem.rawName}
              </div>
              {(matchingItem.office || matchingItem.seminarTitle) && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap gap-2">
                  {matchingItem.office && <span>Office: {matchingItem.office}</span>}
                  {matchingItem.seminarTitle && <span>&bull; {matchingItem.seminarTitle}</span>}
                </div>
              )}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search database by name or ID..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                ref={searchInputRef}
                autoFocus
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Search Results */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800 pr-1">
              {searchResults.length > 0 ? (
                searchResults.map((emp) => (
                  <div
                    key={emp.EmployeeID}
                    onClick={() => confirmMatch(emp)}
                    className="p-2.5 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 rounded-xl cursor-pointer transition-colors flex items-center justify-between group pt-3"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {emp.LastName}, {emp.FirstName} {emp.MiddleInitial || ""}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {emp.Office} {emp.Position ? `• ${emp.Position}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400">
                        ID: {emp.EmployeeID}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  {searchQuery.trim().length < 2
                    ? "Type at least 2 characters to search..."
                    : "No matching database employees found."}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Create New Employee Modal */}
      {isEmployeeFormOpen && (
        <EmployeeForm
          onClose={() => setIsEmployeeFormOpen(false)}
          onSuccess={() => {
            setIsEmployeeFormOpen(false);
            if (matchingItem) handleSearch(matchingItem.rawName);
          }}
          currentUser={currentUser}
          initialData={{
            FirstName: matchingItem?.rawName?.includes(",")
              ? matchingItem?.rawName?.split(",")[1]?.trim() || ""
              : matchingItem?.rawName || "",
            LastName: matchingItem?.rawName?.includes(",")
              ? matchingItem?.rawName?.split(",")[0]?.trim() || ""
              : "",
            Office: matchingItem?.office || ""
          }}
        />
      )}
    </div>
  );
}
