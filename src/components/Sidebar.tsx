import React from "react";
import {
  LayoutDashboard,
  UserPlus,
  Database,
  Zap,
  Upload,
  Calendar,
  FileSpreadsheet,
  LogOut,
  Camera,
  Trash2,
  PlusCircle,
  Key,
  ArrowLeft,
  ChevronDown,
  History,
  Shield,
} from "lucide-react";
import { User } from "../types";

const SIDEBAR_EASE = "cubic-bezier(0.16,1,0.3,1)";
const TRANSITION_STYLE = `transition-all duration-500 ease-[${SIDEBAR_EASE}]`;

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  activeTab: string;
  currentUser: User | null;
  editingEmployee: boolean;
  years: number[];
  seminarsTree: Record<number, string[]>;
  collapsedYears: Record<number, boolean>;
  selectedSeminarYear: number | null;
  selectedSeminarQuarter: string | null;
  profileFileInputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onToggleCollapse: () => void;
  onTabChange: (tab: string) => void;
  onToggleYear: (year: number) => void;
  onSelectSeminarQuarter: (year: number, quarter: string) => void;
  onProfilePicUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onChangePasswordOpen: () => void;
  onSignOut: () => void;
  onExcelExport: () => void;
  onYearModalOpen: () => void;
  onDeleteYear: (year: number) => void;
  variant?: "desktop" | "mobile";
}

type NavItem = {
  tab: string;
  icon: React.ElementType;
  label: string;
  dataText: string;
  color: string;
  adminOnly?: boolean;
  devOnly?: boolean;
  iconClass?: string;
  editLabel?: string;
};

const mainMenuItems: NavItem[] = [
  { tab: "home", icon: LayoutDashboard, label: "Dashboard", dataText: "Dashboard", color: "#3b82f6" },
  { tab: "add", icon: UserPlus, label: "Add New Record", dataText: "Add New Record", color: "#8b5cf6", editLabel: "Modify Records" },
  { tab: "view", icon: Database, label: "View Records", dataText: "View Records", color: "#10b981" },
  { tab: "rapid", icon: Zap, label: "Rapid Encoding", dataText: "Rapid Encoding", color: "#f59e0b", iconClass: "fill-amber-500/10" },
  { tab: "import", icon: Upload, label: "Import Data", dataText: "Import Data", color: "#ef4444", adminOnly: true },
  { tab: "auditlogs", icon: History, label: "Activity & Audit Logs", dataText: "Activity & Audit Logs", color: "#6366f1", adminOnly: true },
  { tab: "usermanagement", icon: Shield, label: "User Management", dataText: "User Management", color: "#a855f7", devOnly: true },
];

export default function Sidebar({
  isOpen,
  isCollapsed,
  activeTab,
  currentUser,
  editingEmployee,
  years,
  seminarsTree,
  collapsedYears,
  selectedSeminarYear,
  selectedSeminarQuarter,
  profileFileInputRef,
  onClose,
  onToggleCollapse,
  onTabChange,
  onToggleYear,
  onSelectSeminarQuarter,
  onProfilePicUpload,
  onChangePasswordOpen,
  onSignOut,
  onExcelExport,
  onYearModalOpen,
  onDeleteYear,
  variant = "desktop",
}: SidebarProps) {

  const isMobile = variant === "mobile";

  const handleTabClick = (tab: string) => {
    onTabChange(tab);
    if (isMobile) onClose();
  };

  const labelForItem = (item: NavItem) =>
    item.tab === "add" && editingEmployee ? item.editLabel || item.label : item.label;

  return (
    <aside
      className={`flex flex-col overflow-hidden w-full h-full text-slate-200 ${
        isMobile
          ? `fixed inset-y-0 left-0 z-50 w-60 sidebar-contrast-bg backdrop-blur-xl transition-transform duration-300 ${isOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"}`
          : "relative z-0"
      }`}
    >
      {/* Header */}
      <div
        className={`flex items-center shrink-0 h-14 border-b border-white/5 overflow-hidden ${TRANSITION_STYLE} ${
          isCollapsed ? "justify-center px-0" : "justify-between px-3.5"
        }`}
      >
        <div
          onClick={isCollapsed ? onToggleCollapse : undefined}
          className={`flex items-center ${TRANSITION_STYLE} ${
            isCollapsed ? "justify-center w-full cursor-pointer" : "justify-start min-w-0"
          }`}
          title={isCollapsed ? "Expand Sidebar" : undefined}
        >
          <img
            src="/pangasinan-logo.svg"
            alt="Pangasinan Provincial Seal"
            className="w-7 h-7 aspect-square min-w-[28px] min-h-[28px] max-w-[28px] max-h-[28px] object-contain bg-white rounded-full p-0.5 shrink-0 shadow-xs"
          />
          <span
            className={`font-medium text-sm tracking-tight font-sans text-slate-100 whitespace-nowrap overflow-hidden ${TRANSITION_STYLE} ${
              isCollapsed ? "opacity-0 max-w-0 ml-0 pointer-events-none" : "opacity-100 max-w-[100px] ml-2.5"
            }`}
          >
            ILDP
          </span>
        </div>

        {!isCollapsed && (
          <button
            onClick={isMobile ? onClose : onToggleCollapse}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer shrink-0 ml-auto focus:outline-none transition-colors duration-200"
            title={isMobile ? "Close Menu" : "Collapse Sidebar"}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2.5 px-2 custom-scrollbar">
        {/* Main Menu */}
        <div className="mb-3">
          <div
            className={`overflow-hidden ${TRANSITION_STYLE} ${
              isCollapsed ? "max-h-0 opacity-0 my-0" : "max-h-6 opacity-100 px-2 mb-1.5 mt-1"
            }`}
          >
            <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-widest whitespace-nowrap">
              Main Menu
            </span>
          </div>

          <div className="space-y-1.5">
            {mainMenuItems.map((item) => {
              if (item.adminOnly && currentUser?.role !== "Administrator" && currentUser?.role !== "System developer") {
                return null;
              }
              if (item.devOnly && currentUser?.role !== "System developer") {
                return null;
              }
              const Icon = item.icon;
              const isActive = activeTab === item.tab;
              const displayLabel = labelForItem(item);

              return (
                <button
                  key={item.tab}
                  title={isCollapsed ? displayLabel : undefined}
                  style={{ "--active-color": item.color } as React.CSSProperties}
                  onClick={() => handleTabClick(item.tab)}
                  className={`relative group h-10 cursor-pointer focus:outline-none flex items-center active:scale-95 ${TRANSITION_STYLE} ${
                    isCollapsed ? "w-10 mx-auto justify-center rounded-xl" : "w-full px-3 gap-3 rounded-xl justify-start"
                  }`}
                >
                  {/* Left Vertical Line (Extended Mode - Fades in on Expand) */}
                  <div
                    className={`absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full transition-all duration-300 ease-out ${
                      !isCollapsed && isActive
                        ? "opacity-100 scale-y-100 delay-300"
                        : !isCollapsed
                        ? "opacity-0 scale-y-50 group-hover:opacity-75 group-hover:scale-y-85 delay-0 pointer-events-none"
                        : "opacity-0 delay-0 pointer-events-none"
                    }`}
                    style={{
                      backgroundColor: item.color,
                      boxShadow: isActive ? `0 0 10px ${item.color}` : `0 0 6px ${item.color}`,
                    }}
                  />

                  {/* Bottom Horizontal Line (Collapsed Mode - Hidden during collapse, slowly fades in AFTER collapse completes) */}
                  <div
                    className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full transition-opacity duration-300 ease-out ${
                      isCollapsed && isActive
                        ? "opacity-100 delay-500"
                        : isCollapsed
                        ? "opacity-0 group-hover:opacity-80 delay-0 pointer-events-none"
                        : "opacity-0 delay-0 pointer-events-none"
                    }`}
                    style={{
                      backgroundColor: item.color,
                      boxShadow: isActive ? `0 0 8px ${item.color}` : `0 0 5px ${item.color}`,
                    }}
                  />

                  {/* Icon */}
                  <div className="w-6 h-6 flex items-center justify-center shrink-0">
                    <Icon
                      className={`w-4.5 h-4.5 transition-colors duration-200 ${
                        isActive
                          ? "text-[var(--active-color)]"
                          : "text-slate-400 group-hover:text-[var(--active-color)]"
                      } ${item.iconClass || ""}`}
                    />
                  </div>

                  {/* Label */}
                  <span
                    className={`whitespace-nowrap text-xs truncate overflow-hidden ${TRANSITION_STYLE} ${
                      isCollapsed
                        ? "opacity-0 max-w-0 ml-0 pointer-events-none"
                        : "opacity-100 max-w-[160px]"
                    } ${
                      isActive
                        ? "text-[var(--active-color)] font-medium"
                        : "text-slate-300 group-hover:text-[var(--active-color)] font-normal"
                    }`}
                  >
                    {displayLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Seminars Section */}
        <div className="mb-3">
          <div
            className={`overflow-hidden ${TRANSITION_STYLE} ${
              isCollapsed ? "max-h-0 opacity-0 my-0" : "max-h-8 opacity-100 px-2 mb-1.5"
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-medium text-slate-400 uppercase tracking-widest whitespace-nowrap">
              <span>Seminars</span>
              {(currentUser?.role === "Administrator" || currentUser?.role === "System developer") && (
                <button
                  onClick={onYearModalOpen}
                  className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer focus:outline-none"
                  aria-label="Add new year"
                  title="Add New Year"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Collapsed Mode Seminars Trigger */}
          {isCollapsed ? (
            <button
              title="Seminars"
              style={{ "--active-color": "#f59e0b" } as React.CSSProperties}
              onClick={onToggleCollapse}
              className="relative group w-10 h-10 mx-auto flex items-center justify-center rounded-xl cursor-pointer focus:outline-none active:scale-95 transition-all duration-200"
            >
              <Calendar className="w-4.5 h-4.5 text-slate-400 group-hover:text-amber-400 transition-colors duration-200" />
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-amber-400 opacity-0 group-hover:opacity-80 transition-opacity duration-300 ease-out shadow-[0_0_5px_#f59e0b]" />
            </button>
          ) : (
            <div className="space-y-1.5">
              {years.length === 0 ? (
                <div className="text-center py-2 text-[10px] text-slate-500 italic whitespace-nowrap">
                  No years yet. Click + to create one.
                </div>
              ) : (
                years.map((yr) => {
                  const yrExpanded = !(collapsedYears[yr] ?? true);
                  const quarters = seminarsTree[yr] || [];
                  const isYearActive = activeTab === "seminars" && selectedSeminarYear === yr;
                  return (
                    <div key={yr}>
                      <button
                        onClick={() => onToggleYear(yr)}
                        style={{ "--active-color": "#f59e0b" } as React.CSSProperties}
                        className="relative group w-full h-10 px-3 flex items-center gap-3 rounded-xl cursor-pointer focus:outline-none"
                      >
                        {/* Fading Vertical Accent Line Indicator */}
                        <div
                          className={`absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full bg-amber-400 ${TRANSITION_STYLE} ${
                            isYearActive && yrExpanded
                              ? "opacity-100 scale-y-100 shadow-[0_0_10px_#f59e0b] delay-300"
                              : "opacity-0 scale-y-50 group-hover:opacity-75 group-hover:scale-y-85 shadow-[0_0_6px_#f59e0b] delay-0"
                          }`}
                        />
                        <div className="w-6 h-6 flex items-center justify-center shrink-0">
                          <Calendar
                            className={`w-4.5 h-4.5 transition-colors duration-200 ${
                              isYearActive && yrExpanded ? "text-amber-400" : "text-slate-400 group-hover:text-amber-400"
                            }`}
                          />
                        </div>
                        <span
                          className={`flex-1 min-w-0 truncate text-left text-xs whitespace-nowrap transition-colors duration-200 ${
                            isYearActive && yrExpanded
                              ? "text-amber-400 font-medium"
                              : "text-slate-300 group-hover:text-amber-400 font-normal"
                          }`}
                        >
                          {yr} Seminars
                        </span>
                        {(currentUser?.role === "Administrator" || currentUser?.role === "System developer") && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteYear(yr); }}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 p-1 rounded-md transition-opacity cursor-pointer shrink-0 focus:outline-none"
                            aria-label={`Delete year ${yr}`}
                            title={`Delete year ${yr}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-all duration-200 ml-1 ${
                          isYearActive && yrExpanded ? "text-amber-400" : "text-slate-400 group-hover:text-amber-400"
                        } ${yrExpanded ? "rotate-180" : ""}`} />
                      </button>

                      {/* Tree Dropdown */}
                      <div
                        className="overflow-hidden transition-all duration-200 ease-in-out"
                        style={{
                          maxHeight: yrExpanded ? "240px" : "0",
                          opacity: yrExpanded ? "1" : "0",
                        }}
                      >
                        <div className="ml-6 pl-3 border-l border-white/15 my-1 space-y-1">
                          {quarters.length === 0 ? (
                            <span className="text-[11px] text-slate-500 italic block py-1 px-2 whitespace-nowrap">No quarters</span>
                          ) : (
                            quarters.map((q) => {
                              const isActiveQ = activeTab === "seminars" && selectedSeminarYear === yr && selectedSeminarQuarter === q;
                              return (
                                <button
                                  key={q}
                                  onClick={() => {
                                    onSelectSeminarQuarter(yr, q);
                                    handleTabClick("seminars");
                                  }}
                                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-lg cursor-pointer focus:outline-none transition-all duration-200 ${
                                    isActiveQ
                                      ? "bg-amber-500/15 text-amber-300 font-medium border border-amber-500/25 shadow-xs"
                                      : "text-slate-400 hover:text-white hover:bg-white/10 font-normal"
                                  }`}
                                >
                                  <span className="whitespace-nowrap">{q}</span>
                                  {isActiveQ && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Reports & Actions */}
        <div className="mb-2">
          <div
            className={`overflow-hidden ${TRANSITION_STYLE} ${
              isCollapsed ? "max-h-0 opacity-0 my-0" : "max-h-6 opacity-100 px-2 mb-1.5"
            }`}
          >
            <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-widest whitespace-nowrap">
              Reports & Actions
            </span>
          </div>

          <button
            title={isCollapsed ? "Excel Export" : undefined}
            style={{ "--active-color": "#10b981" } as React.CSSProperties}
            onClick={() => { onExcelExport(); onClose(); }}
            className={`relative group h-10 cursor-pointer focus:outline-none flex items-center active:scale-95 ${TRANSITION_STYLE} ${
              isCollapsed ? "w-10 mx-auto justify-center rounded-xl" : "w-full px-3 gap-3 rounded-xl justify-start"
            }`}
          >
            {/* Left Vertical Line (Extended Mode) */}
            <div
              className={`absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full bg-emerald-400 ${TRANSITION_STYLE} ${
                !isCollapsed
                  ? "opacity-0 scale-y-50 group-hover:opacity-75 group-hover:scale-y-85 shadow-[0_0_6px_#10b981] pointer-events-none"
                  : "opacity-0 pointer-events-none"
              }`}
            />

            {/* Bottom Horizontal Line (Collapsed Mode - Delayed Fade In) */}
            <div
              className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-emerald-400 transition-opacity duration-300 ease-out ${
                isCollapsed
                  ? "opacity-0 group-hover:opacity-80 shadow-[0_0_5px_#10b981] pointer-events-none"
                  : "opacity-0 pointer-events-none"
              }`}
            />

            <div className="w-6 h-6 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4.5 h-4.5 text-emerald-400 transition-colors duration-200" />
            </div>
            <span
              className={`whitespace-nowrap text-xs font-normal truncate overflow-hidden text-slate-300 group-hover:text-emerald-400 transition-all duration-500 ease-[${SIDEBAR_EASE}] ${
                isCollapsed
                  ? "opacity-0 max-w-0 ml-0 pointer-events-none"
                  : "opacity-100 max-w-[160px]"
              }`}
            >
              Excel Export
            </span>
          </button>
        </div>
      </nav>

      {/* User Profile */}
      {currentUser && (
        <div className="shrink-0 border-t border-white/5 overflow-hidden">
          <input type="file" ref={profileFileInputRef} accept="image/*" className="hidden" onChange={onProfilePicUpload} />

          <div className="flex items-center h-14 px-3">
            <div
              onClick={() => profileFileInputRef.current?.click()}
              className="w-8.5 h-8.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-medium flex items-center justify-center shrink-0 uppercase text-xs shadow-xs cursor-pointer overflow-hidden group relative transition-colors duration-200 mx-auto"
              title={`${currentUser.name} (${currentUser.role})`}
            >
              {currentUser.profilePic ? (
                <img src={currentUser.profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{currentUser.name.charAt(0)}</span>
              )}
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                <Camera className="h-3.5 w-3.5 text-white" />
              </div>
            </div>

            <div
              className={`flex items-center justify-between min-w-0 flex-1 ${TRANSITION_STYLE} ${
                isCollapsed ? "opacity-0 max-w-0 ml-0 pointer-events-none overflow-hidden" : "opacity-100 max-w-[160px] ml-2.5"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white truncate leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 truncate font-normal leading-none mt-0.5">{currentUser.role}</p>
              </div>
              <div className="flex items-center gap-0.5 shrink-0 ml-1">
                <button
                  onClick={onChangePasswordOpen}
                  className="p-1 rounded-md text-slate-400 hover:text-blue-500 hover:bg-white/10 transition cursor-pointer focus:outline-none"
                  title="Change Password"
                >
                  <Key className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={onSignOut}
                  className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-white/10 transition cursor-pointer focus:outline-none"
                  title="Sign Out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
