import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash, Search, ChevronDown } from "lucide-react";

interface SearchableSelectProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
  allowCustom?: boolean;
  triggerRef?: React.RefObject<HTMLDivElement | null>;
  onDeleteCustom?: (val: string) => void;
  isCustom?: (val: string) => boolean;
  autoFocus?: boolean;
}

export default function SearchableSelect({ 
  label, 
  value, 
  onChange, 
  options, 
  placeholder = "Search...", 
  required = false, 
  allowCustom = false,
  triggerRef: externalTriggerRef,
  onDeleteCustom = () => {},
  isCustom = () => false,
  autoFocus = false
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const localTriggerRef = useRef<HTMLDivElement>(null);
  const triggerRef = externalTriggerRef || localTriggerRef;
  const inputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // If the current value is custom, include it in the active options list so it can be selected/highlighted correctly
  const isCustomValue = value && !options.includes(value);
  const activeOptions = isCustomValue ? [value, ...options] : options;

  const filteredOptions = activeOptions.filter((opt) =>
    opt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showCustomOption = allowCustom && searchQuery.trim() && !activeOptions.some(opt => opt.toLowerCase() === searchQuery.trim().toLowerCase());

  // Consolidate options currently selectable in the dropdown list
  const selectableOptions: string[] = [];
  if (showCustomOption) {
    selectableOptions.push(searchQuery.trim());
  }
  filteredOptions.forEach(opt => {
    selectableOptions.push(opt);
  });

  // Reset highlighted index when selectable options change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery, isOpen]);

  // Scroll active element into view
  useEffect(() => {
    if (listContainerRef.current && highlightedIndex >= 0) {
      const activeEl = listContainerRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (autoFocus) {
      triggerRef.current?.focus();
      setIsOpen(true);
      setHighlightedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus]);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearchQuery("");
    // Return focus to the trigger so the user remains in keyboard flow
    setTimeout(() => {
      triggerRef.current?.focus();
    }, 50);
  };

  const handleToggle = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen) {
      setHighlightedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        handleToggle();
      }
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => 
        prev < selectableOptions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectableOptions.length > 0 && highlightedIndex >= 0 && highlightedIndex < selectableOptions.length) {
        handleSelect(selectableOptions[highlightedIndex]);
      } else if (selectableOptions.length > 0) {
        handleSelect(selectableOptions[0]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    } else if (e.key === "Tab") {
      // Allow focus to leave organically, but close the dropdown
      setIsOpen(false);
    }
  };

  return (
    <div className="relative space-y-1.5" ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div 
        ref={triggerRef}
        tabIndex={0}
        role="combobox"
        aria-expanded={isOpen}
        onClick={handleToggle}
        onKeyDown={handleTriggerKeyDown}
        className={`flex items-center justify-between w-full px-3.5 py-2 border rounded-xl shadow-sm text-xs cursor-pointer transition outline-none transition-colors duration-200 ${
          isOpen 
            ? "border-blue-500 ring-2 ring-blue-500 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100" 
            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        }`}
      >
        <span className={value ? "text-slate-800 dark:text-slate-100 font-medium" : "text-slate-400 dark:text-slate-500"}>
          {value || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 text-slate-400 ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="absolute z-30 w-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden max-h-60 flex flex-col animate-in slide-in-from-top-2 duration-100 transition-colors duration-200">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center gap-2 transition-colors duration-200">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              ref={inputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Type to filter list..."
              className="w-full bg-transparent border-none text-xs text-slate-800 dark:text-slate-100 focus:outline-none placeholder-slate-400 dark:placeholder-slate-500 py-1"
            />
          </div>
          
          <div ref={listContainerRef} className="overflow-y-auto max-h-48 divide-y divide-slate-50 dark:divide-slate-800/60">
            {selectableOptions.map((opt, idx) => {
              const isCustomOption = showCustomOption && idx === 0;
              const isHighlighted = idx === highlightedIndex;
              const isSelected = opt === value;
              const isDeletable = !isCustomOption && onDeleteCustom && isCustom(opt);

              return (
                <div
                  key={idx}
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`px-3.5 py-2.5 text-xs cursor-pointer transition text-left flex items-center gap-2 justify-between ${
                    isHighlighted 
                      ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 font-semibold" 
                      : isSelected 
                        ? "bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-medium" 
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950/60"
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1">
                    {isCustomOption ? (
                      <>
                        <Plus className={`h-3.5 w-3.5 shrink-0 ${isHighlighted ? "text-blue-700 dark:text-blue-400" : "text-blue-600"}`} />
                        <span className={isHighlighted ? "text-blue-700 dark:text-blue-400 font-bold" : "text-blue-600 font-semibold"}>
                          Add custom: "{opt}"
                        </span>
                      </>
                    ) : (
                      <span>{opt}</span>
                    )}
                  </div>
                  {isDeletable && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCustom!(opt);
                      }}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-950/40 rounded-md text-red-500 transition-colors shrink-0"
                      title="Delete custom option"
                    >
                      <Trash className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}

            {selectableOptions.length === 0 && (
              <div className="p-3 text-xs text-slate-400 dark:text-slate-500 text-center">
                {allowCustom ? "No matching standard options" : "No options found"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
