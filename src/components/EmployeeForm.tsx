import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash, Search, ArrowRight, UserCheck, AlertTriangle, Eye, ChevronDown } from "lucide-react";
import { Employee, LearningNeed, User } from "../types";
import { OFFICES, POSITIONS, LEARNING_NEEDS, BASES, METHODOLOGIES, SCHEDULES } from "../constants";
import { getStoredLearningNeedsClipboard, getStoredLearningNeedsClipboardCount, setStoredLearningNeedsClipboard } from "../utils/learningNeedClipboard";
import SearchableSelect from "./SearchableSelect";
import StickyBackButton from "./StickyBackButton";

// ----------------------------------------------------
// Main Form Component
// ----------------------------------------------------
interface EmployeeFormProps {
  employee: Employee | null; // Null means create new
  currentUser: User;
  onSave: (employeeData: Partial<Employee>, needs: LearningNeed[]) => void;
  onCancel: () => void;
  customOptionsVersion?: number;
  onCustomOptionsChange?: () => void;
}

export default function EmployeeForm({ 
  employee, 
  currentUser, 
  onSave, 
  onCancel,
  customOptionsVersion,
  onCustomOptionsChange
}: EmployeeFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  // Employee State
  const [firstName, setFirstName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [lastName, setLastName] = useState("");
  const [office, setOffice] = useState("");
  const [position, setPosition] = useState("");
  const [employmentType, setEmploymentType] = useState("Undefined (Pending Review)");
  const [employmentStatus, setEmploymentStatus] = useState("Undefined (Pending Review)");
  const [gender, setGender] = useState("Undefined (Pending Review)");
  const [dateOfAssumption, setDateOfAssumption] = useState("");
  const [newlyHired, setNewlyHired] = useState("N/A");

  // Learning Needs List
  const [needs, setNeeds] = useState<LearningNeed[]>([]);
  const [clipboardCount, setClipboardCount] = useState(() => getStoredLearningNeedsClipboardCount());
  const [clipboardStatus, setClipboardStatus] = useState<string>("");
  const [clipboardFeedback, setClipboardFeedback] = useState<"copy" | "paste" | null>(null);
  
  // Custom Options State
  const [basisOptions, setBasisOptions] = useState<string[]>(BASES);
  const [methodologyOptions, setMethodologyOptions] = useState<string[]>(METHODOLOGIES);
  const [officeOptions, setOfficeOptions] = useState<string[]>(OFFICES);
  const [positionOptions, setPositionOptions] = useState<string[]>(POSITIONS);
  const [learningNeedOptions, setLearningNeedOptions] = useState<string[]>(LEARNING_NEEDS);
  const [scheduleOptions, setScheduleOptions] = useState<string[]>(SCHEDULES);

  // Fetch custom options
  useEffect(() => {
    ["basis", "methodology", "office", "position", "learningNeed", "schedule"].forEach(type => {
      fetch(`/api/options/${type}`)
        .then(res => res.json())
        .then(data => {
          const cleanCustom = Array.isArray(data) ? data : [];

          if (type === "basis") { 
            setBasisOptions(cleanCustom); 
          }
          else if (type === "methodology") { 
            setMethodologyOptions(cleanCustom); 
          }
          else if (type === "office") { 
            setOfficeOptions(cleanCustom); 
          }
          else if (type === "position") { 
            setPositionOptions(cleanCustom); 
          }
          else if (type === "learningNeed") { 
            setLearningNeedOptions(cleanCustom); 
          }
          else if (type === "schedule") { 
            setScheduleOptions(cleanCustom); 
          }
        });
    });
  }, [customOptionsVersion]);

  // Similar Employee Warnings
  const [similarEmployees, setSimilarEmployees] = useState<Employee[]>([]);
  const [selectedSimilar, setSelectedSimilar] = useState<Employee | null>(null);

  // Auto-complete suggestion states
  const [firstNameSuggestions, setFirstNameSuggestions] = useState<string[]>([]);
  const [lastNameSuggestions, setLastNameSuggestions] = useState<string[]>([]);
  const [activeSuggestionField, setActiveSuggestionField] = useState<"first" | "last" | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // References for keyboard navigation flow
  const firstInputRef = useRef<HTMLInputElement>(null);
  const miInputRef = useRef<HTMLInputElement>(null);
  const lastInputRef = useRef<HTMLInputElement>(null);
  const officeSelectRef = useRef<HTMLDivElement>(null);
  const positionSelectRef = useRef<HTMLDivElement>(null);

  // Keyboard workflow auto-focus state
  const [isAddingCard, setIsAddingCard] = useState(false);

  // Load employee data on edit
  useEffect(() => {
    if (employee) {
      setFirstName(employee.FirstName);
      setMiddleInitial(employee.MiddleInitial || "");
      setLastName(employee.LastName);
      setOffice(employee.Office);
      setPosition(employee.Position);
      setEmploymentType(employee.EmploymentType || "Undefined (Pending Review)");
      setEmploymentStatus(employee.EmploymentStatus || "Undefined (Pending Review)");
      setGender(employee.Gender || "Undefined (Pending Review)");
      setNewlyHired(employee.NewlyHired || "N/A");
      const assumptionDate = employee.DateOfAssumption ? employee.DateOfAssumption.substring(0, 10) : "";
      setDateOfAssumption(assumptionDate);

      // Fetch employee's learning needs from backend
      fetch(`/api/employees/${employee.EmployeeID}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.needs) {
            setNeeds(data.needs.map((n: any) => ({
              ...n,
              Basis: Array.isArray(n.Basis) ? n.Basis : (n.Basis ? (n.Basis as string).split(",").map((s: string) => s.trim()) : ["Advanced Knowledge"]),
              Methodology: Array.isArray(n.Methodology) ? n.Methodology : (n.Methodology ? (n.Methodology as string).split(",").map((s: string) => s.trim()) : ["Seminar/Training"]),
            })));
          }
        });
    } else {
      // Clear form for fresh input
      setFirstName("");
      setMiddleInitial("");
      setLastName("");
      setOffice("");
      setPosition("");
      setEmploymentType("Undefined (Pending Review)");
      setEmploymentStatus("Undefined (Pending Review)");
      setGender("Undefined (Pending Review)");
      setNewlyHired("N/A");
      setDateOfAssumption("");
      setNeeds([createEmptyNeed()]);
    }
    setSimilarEmployees([]);
    setSelectedSimilar(null);
  }, [employee]);

  // Create empty learning need card template
  function createEmptyNeed(): LearningNeed {
    return {
      LearningNeed: "",
      Basis: ["Advanced Knowledge"],
      Methodology: ["Seminar/Training"],
      TargetSchedule: `1st Quarter of ${new Date().getFullYear()}`,
    };
  }

  // Reset form fields back to starting values
  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all form fields? Any typed progress will be cleared.")) {
      if (employee) {
        setFirstName(employee.FirstName);
        setMiddleInitial(employee.MiddleInitial || "");
        setLastName(employee.LastName);
        setOffice(employee.Office);
        setPosition(employee.Position);
        setEmploymentType(employee.EmploymentType || "Undefined (Pending Review)");
        setEmploymentStatus(employee.EmploymentStatus || "Undefined (Pending Review)");
        setGender(employee.Gender || "Undefined (Pending Review)");
        setNewlyHired(employee.NewlyHired || "N/A");
        const assumptionDate = employee.DateOfAssumption ? employee.DateOfAssumption.substring(0, 10) : "";
        setDateOfAssumption(assumptionDate);
        
        fetch(`/api/employees/${employee.EmployeeID}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.needs) {
              setNeeds(data.needs.map((n: any) => ({
                ...n,
                Basis: Array.isArray(n.Basis) ? n.Basis : (n.Basis ? (n.Basis as string).split(",").map((s: string) => s.trim()) : ["Advanced Knowledge"]),
                Methodology: Array.isArray(n.Methodology) ? n.Methodology : (n.Methodology ? (n.Methodology as string).split(",").map((s: string) => s.trim()) : ["Seminar/Training"]),
              })));
            }
          });
      } else {
        setFirstName("");
        setMiddleInitial("");
        setLastName("");
        setOffice("");
        setPosition("");
        setEmploymentType("Undefined (Pending Review)");
        setEmploymentStatus("Undefined (Pending Review)");
        setGender("Undefined (Pending Review)");
        setNewlyHired("N/A");
        setDateOfAssumption("");
        setNeeds([createEmptyNeed()]);
      }
      setSimilarEmployees([]);
      setSelectedSimilar(null);
    }
  };

  // Handle similarity checking while typing first/last name
  useEffect(() => {
    if (employee) return; // Skip similarity checks during existing employee editing

    if (firstName.trim().length >= 2 || lastName.trim().length >= 2) {
      const delayDebounce = setTimeout(() => {
        fetch("/api/employees/check-similar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firstName, lastName }),
        })
          .then((res) => res.json())
          .then((data) => {
            // Exclude current employee (if editing) and filter
            setSimilarEmployees(data.similar || []);
          });
      }, 300);

      return () => clearTimeout(delayDebounce);
    } else {
      setSimilarEmployees([]);
    }
  }, [firstName, lastName, employee]);

  // Handle dynamic dropdown auto-completions while typing first or last name
  useEffect(() => {
    if (firstName.trim().length > 1) {
      // Fetch names that start with typed characters to display autocompletes
      fetch(`/api/employees?search=${firstName.trim()}`)
        .then((res) => res.json())
        .then((data: Employee[]) => {
          const suggestions = Array.from(new Set(data.map((e) => e.FirstName)));
          setFirstNameSuggestions(suggestions);
        });
    } else {
      setFirstNameSuggestions([]);
    }
  }, [firstName]);

  useEffect(() => {
    if (lastName.trim().length > 1) {
      fetch(`/api/employees?search=${lastName.trim()}`)
        .then((res) => res.json())
        .then((data: Employee[]) => {
          const suggestions = Array.from(new Set(data.map((e) => e.LastName)));
          setLastNameSuggestions(suggestions);
        });
    } else {
      setLastNameSuggestions([]);
    }
  }, [lastName]);

  // Handle proper capitalization & spacing (Rule: proper names capitalized)
  const formatName = (val: string) => {
    if (!val) return "";
    return val
      .toLowerCase()
      .replace(/\s+/g, " ") // trim internal extra spaces
      .replace(/\b\w/g, (char) => char.toUpperCase()) // proper casing
      .trim();
  };

  const handleFirstNameBlur = () => {
    setFirstName(formatName(firstName));
    setTimeout(() => setActiveSuggestionField(null), 200);
  };

  const handleLastNameBlur = () => {
    setLastName(formatName(lastName));
    setTimeout(() => setActiveSuggestionField(null), 200);
  };

  const handleMiddleInitialBlur = () => {
    let val = middleInitial.trim().toUpperCase();
    if (val) {
      if (val.length === 1) {
        val = val + ".";
      } else if (val.length > 2) {
        val = val.charAt(0) + ".";
      }
    }
    setMiddleInitial(val);
  };

  // Keyboard navigation inside Suggestions list and moving between inputs
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: "first" | "last" | "mi") => {
    if (field === "mi") {
      if (e.key === "Enter") {
        e.preventDefault();
        lastInputRef.current?.focus();
      }
      return;
    }

    const list = field === "first" ? firstNameSuggestions : lastNameSuggestions;

    if (e.key === "Enter") {
      if (list.length > 0 && highlightedIndex >= 0) {
        e.preventDefault();
        const val = list[highlightedIndex];
        if (field === "first") {
          setFirstName(val);
          setTimeout(() => miInputRef.current?.focus(), 50);
        } else {
          setLastName(val);
          setTimeout(() => officeSelectRef.current?.focus(), 50);
        }
        setActiveSuggestionField(null);
        setHighlightedIndex(-1);
      } else {
        // No active suggestion highlighted, proceed to focus next field
        e.preventDefault();
        if (field === "first") {
          miInputRef.current?.focus();
        } else if (field === "last") {
          officeSelectRef.current?.focus();
        }
      }
    } else if (e.key === "ArrowDown") {
      if (list.length > 0) {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < list.length - 1 ? prev + 1 : prev));
      }
    } else if (e.key === "ArrowUp") {
      if (list.length > 0) {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }
    } else if (e.key === "Escape") {
      setActiveSuggestionField(null);
      setHighlightedIndex(-1);
    }
  };

  const selectSuggestion = (val: string, field: "first" | "last") => {
    if (field === "first") {
      setFirstName(val);
    } else {
      setLastName(val);
    }
    setActiveSuggestionField(null);
    setHighlightedIndex(-1);
  };

  // Duplicate decision triggers
  const handleUseExisting = (similarEmp: Employee) => {
    setSelectedSimilar(similarEmp);
    setOffice(similarEmp.Office);
    setPosition(similarEmp.Position);
    setFirstName(similarEmp.FirstName);
    setMiddleInitial(similarEmp.MiddleInitial || "");
    setLastName(similarEmp.LastName);

    // Fetch existing employee's needs to display
    fetch(`/api/employees/${similarEmp.EmployeeID}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.needs && data.needs.length > 0) {
          setNeeds(data.needs.map((n: any) => ({
            ...n,
              Basis: Array.isArray(n.Basis) ? n.Basis : (n.Basis ? (n.Basis as string).split(",").map((s: string) => s.trim()) : ["Advanced Knowledge"]),
            Methodology: Array.isArray(n.Methodology) ? n.Methodology : (n.Methodology ? (n.Methodology as string).split(",").map((s: string) => s.trim()) : ["Seminar/Training"]),
          })));
        } else {
          setNeeds([createEmptyNeed()]);
        }
      });
    
    // Clear similar list since user selected them
    setSimilarEmployees([]);
  };

  // Learning Need Actions
  const handleAddNeed = () => {
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

  const handleAddCustomOption = (type: "basis" | "methodology" | "office" | "position" | "learningNeed" | "schedule", value: string) => {
    fetch(`/api/options/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    })
      .then(res => {
        if (!res.ok) {
          if (res.status === 400) alert("Duplicate entry detected.");
          throw new Error("Failed to add option");
        }
        return res.json();
      })
      .then(data => {
        if (type === "basis") { setBasisOptions(prev => [...prev, data.value]); }
        else if (type === "methodology") { setMethodologyOptions(prev => [...prev, data.value]); }
        else if (type === "office") { setOfficeOptions(prev => [...prev, data.value]); }
        else if (type === "position") { setPositionOptions(prev => [...prev, data.value]); }
        else if (type === "learningNeed") { setLearningNeedOptions(prev => [...prev, data.value]); }
        else if (type === "schedule") { setScheduleOptions(prev => [...prev, data.value]); }
        
        if (onCustomOptionsChange) {
          onCustomOptionsChange();
        }
      })
      .catch(err => console.error(err));
  };

  const handleDeleteCustomOption = (type: "basis" | "methodology" | "office" | "position" | "learningNeed" | "schedule", value: string) => {
    fetch(`/api/options/${type}/${encodeURIComponent(value)}`, { method: "DELETE" })
      .then(res => res.json())
      .then(() => {
        const filterFn = (v: string) => v.toLowerCase().trim() !== value.toLowerCase().trim();
        if (type === "basis") { setBasisOptions(prev => prev.filter(filterFn)); }
        else if (type === "methodology") { setMethodologyOptions(prev => prev.filter(filterFn)); }
        else if (type === "office") { setOfficeOptions(prev => prev.filter(filterFn)); }
        else if (type === "position") { setPositionOptions(prev => prev.filter(filterFn)); }
        else if (type === "learningNeed") { setLearningNeedOptions(prev => prev.filter(filterFn)); }
        else if (type === "schedule") { setScheduleOptions(prev => prev.filter(filterFn)); }
        
        if (onCustomOptionsChange) {
          onCustomOptionsChange();
        }
      })
      .catch(err => console.error(err));
  };

  // Bring newly added learning need cards into view; the target selector handles its own autofocus.
  useEffect(() => {
    if (isAddingCard && needs.length > 0) {
      setIsAddingCard(false);
      setTimeout(() => {
        const targetCard = formRef.current?.querySelector(
          `[data-need-card-index="${needs.length - 1}"]`
        ) as HTMLElement | null;
        targetCard?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 100);
    }
  }, [needs.length, isAddingCard]);

  // When opening the Add New view (no `employee` provided), scroll the form into view
  useEffect(() => {
    if (!employee) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        firstInputRef.current?.focus();
      }, 80);
    }
  }, [employee]);

  // Global form hotkeys (like Alt+N to add card)
  useEffect(() => {
    const handleFormShortcuts = (e: KeyboardEvent) => {
      // Add need card: Alt + N (or Alt + n)
      if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleAddNeed();
      }
    };
    window.addEventListener("keydown", handleFormShortcuts);
    return () => window.removeEventListener("keydown", handleFormShortcuts);
  }, [needs]);

  const handleDeleteNeed = (index: number) => {
    const newNeeds = [...needs];
    newNeeds.splice(index, 1);
    setNeeds(newNeeds.length === 0 ? [createEmptyNeed()] : newNeeds);
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

  const handleNeedChange = (index: number, field: keyof LearningNeed, value: string | string[]) => {
    const newNeeds = [...needs];
    newNeeds[index] = {
      ...newNeeds[index],
      [field]: value,
    };
    setNeeds(newNeeds);
  };

  // Submit Handler with Client Validation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check values
    if (!firstName.trim() || !lastName.trim() || !office || !position) {
      alert("Please fill out all required employee information.");
      return;
    }

    // Filter out completely empty learning needs (submitting employees with no learning needs is now allowed)
    const cleanNeeds = needs.filter((n) => n.LearningNeed.trim() !== "");

    // Prevent duplicates within the same list
    const seenNeeds = new Set();
    let hasDuplicateNeed = false;
    cleanNeeds.forEach((n) => {
      const uniqueKey = n.LearningNeed.trim().toLowerCase();
      if (seenNeeds.has(uniqueKey)) {
        hasDuplicateNeed = true;
      }
      seenNeeds.add(uniqueKey);
    });

    if (hasDuplicateNeed) {
      alert("You have entered duplicate learning needs for this employee. Please remove duplicates before saving.");
      return;
    }

    // Assemble payload
    const empData: Partial<Employee> = {
      EmployeeID: employee ? employee.EmployeeID : selectedSimilar ? selectedSimilar.EmployeeID : undefined,
      FirstName: firstName.trim(),
      MiddleInitial: middleInitial.trim(),
      LastName: lastName.trim(),
      Office: office,
      Position: position,
      EmploymentType: employmentStatus,
      EmploymentStatus: employmentStatus,
      Gender: gender,
      DateOfAssumption: dateOfAssumption ? new Date(dateOfAssumption).toISOString() : null as any,
      NewlyHired: newlyHired,
    };

    onSave(empData, cleanNeeds);
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-200">
      <StickyBackButton onBack={onCancel} />
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-200">
        {/* Panel Title */}
        <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 px-6 py-4 flex items-center justify-between rounded-t-2xl transition-colors duration-200">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 text-white p-2 rounded-xl">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight font-display">
                {employee ? "Edit Employee Records" : "Employee Information & Demographics"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Provide personal and professional information</p>
            </div>
          </div>
          <span className="btn-glass bg-blue-500/10 text-xs font-medium px-3 py-1.5 rounded-full">
            Encoder: {currentUser.name} ({currentUser.role})
          </span>
        </div>

        {/* Warning: Similar Employee Detection */}
        {similarEmployees.length > 0 && (
          <div className="m-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-xl flex flex-col sm:flex-row items-start gap-4">
            <div className="bg-amber-100 text-amber-800 p-2.5 rounded-full shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-3 w-full">
              <div>
                <h4 className="font-bold text-amber-900 dark:text-amber-300 text-sm">Similar employee found.</h4>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  We found matching employees with a similar name. Would you like to use an existing record instead to prevent creating duplicates?
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {similarEmployees.map((emp) => (
                  <button
                    key={emp.EmployeeID}
                    type="button"
                    onClick={() => handleUseExisting(emp)}
                    className="flex items-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-950 border border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition text-left cursor-pointer"
                  >
                    <span>{emp.LastName}, {emp.FirstName} ({emp.Office})</span>
                    <ArrowRight className="h-3 w-3 text-amber-600 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Selected Similar Employee Notification */}
        {selectedSimilar && (
          <div className="mx-6 mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 rounded-xl flex items-center gap-3">
            <UserCheck className="h-5 w-5 text-blue-600" />
            <div className="text-xs text-blue-800 dark:text-blue-300">
              Selected Existing Record: <strong className="font-semibold">{selectedSimilar.FirstName} {selectedSimilar.LastName}</strong>. The system will merge these learning needs instead of creating a new employee.
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedSimilar(null);
                setFirstName("");
                setLastName("");
                setNeeds([createEmptyNeed()]);
              }}
              className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline ml-auto"
            >
              Reset
            </button>
          </div>
        )}

        {/* Inputs */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-6 gap-5">
          {/* First Name */}
          <div className="md:col-span-2 relative">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              ref={firstInputRef}
              required
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                setActiveSuggestionField("first");
                setHighlightedIndex(-1);
              }}
              onKeyDown={(e) => handleKeyDown(e, "first")}
              onBlur={handleFirstNameBlur}
              className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-slate-100 text-sm shadow-sm transition-colors duration-200"
              placeholder="e.g. Vivian Lyn"
            />
            
            {/* Auto-complete dropdown */}
            {activeSuggestionField === "first" && firstNameSuggestions.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-50 dark:divide-slate-800">
                {firstNameSuggestions.map((suggestion, i) => (
                  <div
                    key={i}
                    onMouseDown={() => selectSuggestion(suggestion, "first")}
                    className={`px-3.5 py-2 text-xs cursor-pointer transition ${
                      i === highlightedIndex ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950"
                    }`}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Middle Initial */}
          <div className="md:col-span-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              M.I.
            </label>
            <input
              type="text"
              ref={miInputRef}
              maxLength={3}
              value={middleInitial}
              onChange={(e) => setMiddleInitial(e.target.value.toUpperCase())}
              onKeyDown={(e) => handleKeyDown(e, "mi")}
              onBlur={handleMiddleInitialBlur}
              className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-slate-100 text-sm text-center shadow-sm transition-colors duration-200"
              placeholder="e.g. E."
            />
          </div>

          {/* Last Name */}
          <div className="md:col-span-3 relative">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              ref={lastInputRef}
              required
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                setActiveSuggestionField("last");
                setHighlightedIndex(-1);
              }}
              onKeyDown={(e) => handleKeyDown(e, "last")}
              onBlur={handleLastNameBlur}
              className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-slate-100 text-sm shadow-sm transition-colors duration-200"
              placeholder="e.g. De Guzman"
            />

            {/* Auto-complete dropdown */}
            {activeSuggestionField === "last" && lastNameSuggestions.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-50 dark:divide-slate-800">
                {lastNameSuggestions.map((suggestion, i) => (
                  <div
                    key={i}
                    onMouseDown={() => selectSuggestion(suggestion, "last")}
                    className={`px-3.5 py-2 text-xs cursor-pointer transition ${
                      i === highlightedIndex ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950"
                    }`}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Office (Standardized Autocomplete Search) */}
          <div className="md:col-span-3">
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
              placeholder="Select or Search Office..."
              required
              allowCustom
              onDeleteCustom={(val) => handleDeleteCustomOption("office", val)}
              isCustom={() => true}
              triggerRef={officeSelectRef}
            />
          </div>

          {/* Position */}
          <div className="md:col-span-3">
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
              placeholder="Select or specify position..."
              required
              allowCustom
              onDeleteCustom={(val) => handleDeleteCustomOption("position", val)}
              isCustom={() => true}
              triggerRef={positionSelectRef}
            />
          </div>

          {/* Employment Status */}
          <div className="md:col-span-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Employment Status <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              value={employmentStatus}
              onChange={setEmploymentStatus}
              options={["Undefined (Pending Review)", "Newly Hired", "Re-employed", "Casual", "Permanent", "Co-Terminous", "Elective Official", "Job Order", "Consultant"]}
              placeholder="Select employment status..."
              allowCustom={false}
            />
          </div>

          {/* Newly Hired / Reemployed Entry */}
          <div className="md:col-span-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Employee Entry
            </label>
            <SearchableSelect
              value={newlyHired}
              onChange={setNewlyHired}
              options={["N/A", "Newly Hired", "Reemployed"]}
              placeholder="Select employee entry..."
              allowCustom={false}
            />
          </div>

          {/* Gender */}
          <div className="md:col-span-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Gender <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              value={gender}
              onChange={setGender}
              options={["Undefined (Pending Review)", "Female", "Male"]}
              placeholder="Select gender..."
              allowCustom={false}
            />
          </div>

          {/* Date of Assumption */}
          <div className="md:col-span-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Date of Assumption
            </label>
            <input
              type="date"
              value={dateOfAssumption}
              onChange={(e: any) => setDateOfAssumption(e.target.value)}
              className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-slate-100 text-xs transition-colors duration-200"
            />
          </div>
        </div>
      </div>

      {/* Learning Needs Block */}
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight font-display">
              Target Learning Needs ({needs.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Provide one or more learning needs / target schedules</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyNeedsToClipboard}
              className={`btn-glass transition-all duration-200 hover:-translate-y-0.5 active:scale-95 text-xs py-2 px-3 cursor-pointer ${clipboardFeedback === "copy" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300/60 dark:border-emerald-700/60 shadow-sm" : ""}`}
            >
              {clipboardFeedback === "copy" ? "✓ Copied" : "Copy Needs"}
            </button>
            <button
              type="button"
              onClick={handlePasteNeedsFromClipboard}
              className={`btn-glass transition-all duration-200 hover:-translate-y-0.5 active:scale-95 text-xs py-2 px-3 cursor-pointer ${clipboardFeedback === "paste" ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-300/60 dark:border-blue-700/60 shadow-sm" : ""}`}
            >
              {clipboardFeedback === "paste" ? "✓ Pasted" : "Paste Needs"}
            </button>
            <button
              type="button"
              onClick={handleAddNeed}
              className="btn-glass hover:scale-[1.02] active:scale-[0.98] text-xs py-2 px-4 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Need Card</span>
              <span className="text-[9px] bg-blue-200/50 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 rounded font-mono ml-1">Alt+N</span>
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

        {/* Needs Grid Card Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {needs.map((need, index) => (
            <div
              key={index}
              data-need-card-index={index}
              onFocus={(e) => {
                const card = e.currentTarget;
                if (!card.contains(e.relatedTarget as Node)) {
                  setTimeout(() => {
                    card.scrollIntoView({ behavior: "smooth", block: "center" });
                  }, 50);
                }
              }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 space-y-4 relative group transition-colors duration-200"
            >
              {/* Delete Need Float Button */}
              <button
                type="button"
                onClick={() => handleDeleteNeed(index)}
                className="btn-glass bg-red-500/10 absolute top-4 right-4 p-2 rounded-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                title="Remove Need Card"
              >
                <Trash className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-950 text-[10px] font-bold text-slate-500 dark:text-slate-400 border dark:border-slate-800">
                  {index + 1}
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Need Specification
                </span>
              </div>

              {/* Large Dropdown with Live Search inside Option selection */}
              <SearchableSelect
                label="Learning Need / Competency Area"
                value={need.LearningNeed}
                onChange={(val) => {
                  if (val !== "Undefined (Pending Review)" && !learningNeedOptions.includes(val)) {
                    handleAddCustomOption("learningNeed", val);
                  }
                  handleNeedChange(index, "LearningNeed", val);
                }}
                options={["Undefined (Pending Review)", ...learningNeedOptions]}
                placeholder="Search or specify need..."
                required
                allowCustom
                onDeleteCustom={(val) => handleDeleteCustomOption("learningNeed", val)}
                isCustom={() => true}
                autoFocus={isAddingCard && index === needs.length - 1}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Basis of Need
                  </label>
                  {need.Basis.map((basis, bIdx) => (
                    <div key={bIdx} className="flex gap-2">
                      <SearchableSelect
                        label=""
                        value={basis}
                        onChange={(val) => {
                          if (!basisOptions.includes(val)) {
                            handleAddCustomOption("basis", val);
                          }
                          const newBasis = [...need.Basis];
                          newBasis[bIdx] = val;
                          handleNeedChange(index, "Basis", newBasis);
                        }}
                        options={basisOptions}
                        placeholder="Select basis..."
                        allowCustom
                        onDeleteCustom={(val) => handleDeleteCustomOption("basis", val)}
                        isCustom={() => true}
                        autoFocus={basis === "" && bIdx === need.Basis.length - 1 && bIdx > 0}
                      />
                      {need.Basis.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newBasis = need.Basis.filter((_, i) => i !== bIdx);
                            handleNeedChange(index, "Basis", newBasis);
                          }}
                          className="text-red-500 hover:text-red-700 mt-6"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleNeedChange(index, "Basis", [...need.Basis, ""])}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Basis
                  </button>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Proposed Methodology
                  </label>
                  {need.Methodology.map((meth, mIdx) => (
                    <div key={mIdx} className="flex gap-2">
                      <SearchableSelect
                        label=""
                        value={meth}
                        onChange={(val) => {
                          if (!methodologyOptions.includes(val)) {
                            handleAddCustomOption("methodology", val);
                          }
                          const newMeth = [...need.Methodology];
                          newMeth[mIdx] = val;
                          handleNeedChange(index, "Methodology", newMeth);
                        }}
                        options={methodologyOptions}
                        placeholder="Select methodology..."
                        allowCustom
                        onDeleteCustom={(val) => handleDeleteCustomOption("methodology", val)}
                        isCustom={() => true}
                        autoFocus={meth === "" && mIdx === need.Methodology.length - 1 && mIdx > 0}
                      />
                      {need.Methodology.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newMeth = need.Methodology.filter((_, i) => i !== mIdx);
                            handleNeedChange(index, "Methodology", newMeth);
                          }}
                          className="text-red-500 hover:text-red-700 mt-6"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleNeedChange(index, "Methodology", [...need.Methodology, ""])}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Methodology
                  </button>
                </div>

                <SearchableSelect
                  label="Target Implementation"
                  value={need.TargetSchedule}
                  onChange={(val) => {
                    if (!scheduleOptions.includes(val)) {
                      handleAddCustomOption("schedule", val);
                    }
                    handleNeedChange(index, "TargetSchedule", val);
                  }}
                  options={scheduleOptions}
                  placeholder="Select schedule..."
                  allowCustom
                  onDeleteCustom={(val) => handleDeleteCustomOption("schedule", val)}
                  isCustom={() => true}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button Row */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleReset}
          className="btn-glass bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border-red-200/50 dark:border-red-900/30 hover:scale-[1.02] active:scale-[0.98] text-xs py-2 px-4 cursor-pointer"
        >
          Reset Fields
        </button>
        <button
          type="submit"
          className="btn-glass bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30 hover:scale-[1.02] active:scale-[0.98] text-xs py-2 px-4 cursor-pointer font-bold shadow-md shadow-blue-500/5"
        >
          Save Records <span className="text-[10px] text-blue-400 dark:text-blue-300 ml-1 font-normal">Ctrl+S</span>
        </button>
      </div>
    </form>
  );
}
