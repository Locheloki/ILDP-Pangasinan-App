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
  { tab: "rapid", icon: Zap, label: "Rapid Encoding", dataText: "Rapid Encoding", color: "#f59e0b", iconClass: "text-amber-500 fill-amber-500/10" },
  { tab: "import", icon: Upload, label: "Import Data", dataText: "Import Data", color: "#ef4444", adminOnly: true },
  { tab: "auditlogs", icon: History, label: "Activity & Audit Logs", dataText: "Activity & Audit Logs", color: "#6366f1", adminOnly: true },
  { tab: "usermanagement", icon: Shield, label: "User Management", dataText: "User Management", color: "#a855f7", devOnly: true },
];

const LAYOUT_TRANSITION = `transition-all duration-500 ease-[${SIDEBAR_EASE}]`;
const HOVER_TRANSITION = "transition-all duration-200 ease-out";

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
    onClose();
  };

  const labelForItem = (item: NavItem) =>
    item.tab === "add" && editingEmployee ? item.editLabel || item.label : item.label;

  const dataTextForItem = (item: NavItem) =>
    item.tab === "add" && editingEmployee ? item.editLabel || item.dataText : item.dataText;

  const iconContainerClass = (isActive: boolean) =>
    `w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${HOVER_TRANSITION} active:scale-90 ${
      isActive
        ? "bg-white/10 scale-100"
        : "scale-[0.96] group-hover:bg-white/5 group-hover:text-[var(--active-color)]"
    }`;

  return (
    <aside
      className={`flex flex-col overflow-hidden w-60 h-full text-slate-200 ${
        isMobile
          ? `fixed inset-y-0 left-0 z-50 sidebar-contrast-bg backdrop-blur-xl transition-transform duration-300 ${isOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"}`
          : "relative z-0"
      }`}
    >
      {/* Branding header */}
      <div className="flex items-center shrink-0 overflow-hidden pl-[18px] pr-3 py-4">
        <img
          src="/pangasinan-logo.svg"
          alt="Pangasinan Provincial Seal"
          className="w-7 h-7 object-contain bg-white rounded-full p-0.5 shrink-0"
        />
        <span
          className={`ml-2 whitespace-nowrap font-semibold text-base tracking-tight font-sans ${LAYOUT_TRANSITION} ${
            isCollapsed ? "opacity-0" : "opacity-100"
          }`}
        >
          ILDP
        </span>
        <div className="flex-1" />
        {isMobile ? (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer transition shrink-0"
            title="Close Menu"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer transition shrink-0"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Main Menu */}
        <div className="mb-4">
          <div
            className={`overflow-hidden ${LAYOUT_TRANSITION} ${
              isCollapsed
                ? "max-h-0 opacity-0 mt-0"
                : "max-h-8 opacity-100 px-3 mb-2 mt-2"
            }`}
          >
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Main Menu
            </span>
          </div>

          <div className={isCollapsed ? "space-y-2" : "space-y-1"}>
            {mainMenuItems.map((item, index) => {
              if (item.adminOnly && currentUser?.role !== "Administrator" && currentUser?.role !== "System developer") {
                return null;
              }
              if (item.devOnly && currentUser?.role !== "System developer") {
                return null;
              }
              const Icon = item.icon;
              const isActive = activeTab === item.tab;
              const displayLabel = labelForItem(item);
              const displayDataText = dataTextForItem(item);
              const delay = isCollapsed ? `${index * 40}ms` : `${(mainMenuItems.length - 1 - index) * 40}ms`;
              return (
                <button
                  key={item.tab}
                  title={isCollapsed ? displayLabel : undefined}
                  style={{ "--active-color": item.color, transitionDelay: delay } as React.CSSProperties}
                  onClick={() => handleTabClick(item.tab)}
                  className="group w-full flex items-center pl-3 pr-3 py-2.5 gap-3 justify-start text-xs font-medium text-slate-300"
                >
                  <div
                    className={iconContainerClass(isActive)}
                    style={{ color: isActive ? item.color : undefined }}
                  >
                    <Icon className={`w-5 h-5 ${item.iconClass || ""}`} />
                  </div>
                  <span
                    style={{
                      "--active-color": item.color,
                      transition: `opacity 500ms ${SIDEBAR_EASE}, color 200ms ease-out`,
                      transitionDelay: delay,
                      color: isActive ? item.color : undefined,
                      opacity: isCollapsed ? 0 : 1,
                    } as React.CSSProperties}
                    data-text={displayDataText}
                    className="whitespace-nowrap text-xs font-medium text-slate-300 group-hover:text-[var(--active-color)]"
                  >
                    {displayLabel}
                  </span>
                </button>
              );
            })}

            <div
              className={`overflow-hidden ${LAYOUT_TRANSITION} ${
                isCollapsed ? "max-h-[60px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <button
                title="Seminars"
                style={{ "--active-color": "#f59e0b" } as React.CSSProperties}
                onClick={() => onToggleCollapse()}
                className="group w-full flex items-center pl-3 pr-3 py-2.5 gap-3 justify-start text-xs font-medium text-slate-300"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-slate-300 group-hover:bg-white/5 group-hover:text-[var(--active-color)] transition-all duration-200 ease-out active:scale-90 scale-[0.96]">
                  <Calendar className="w-5 h-5" />
                </div>
              </button>
            </div>
          </div>
        </div>

        <div
          className={`overflow-hidden ${LAYOUT_TRANSITION} mb-4 ${
            isCollapsed ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100"
          }`}
        >
          <div className="flex items-center justify-between px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>Seminars</span>
            {(currentUser?.role === "Administrator" || currentUser?.role === "System developer") && (
              <button
                onClick={onYearModalOpen}
                className="text-slate-500 hover:text-white p-1 rounded-lg transition-colors duration-100 cursor-pointer"
                aria-label="Add new year"
              >
                <PlusCircle className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="space-y-1">
            {years.length === 0 ? (
              <div className="text-center py-4 text-[10px] text-slate-500 italic">
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
                      className="group w-full flex items-center pl-3 pr-3 py-2.5 gap-3 justify-start text-xs font-medium text-slate-300"
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${HOVER_TRANSITION} active:scale-90 ${
                          isYearActive && yrExpanded
                            ? "bg-white/10 scale-100"
                            : "scale-[0.96] group-hover:bg-white/5 group-hover:text-[var(--active-color)]"
                        }`}
                        style={{ color: isYearActive && yrExpanded ? "#f59e0b" : undefined }}
                      >
                        <Calendar className="w-5 h-5" />
                      </div>
                      <span
                        className="flex-1 min-w-0 truncate text-left text-xs font-medium text-slate-300 group-hover:text-[var(--active-color)]"
                        style={{
                          transition: `color 200ms ease-out`,
                          color: isYearActive && yrExpanded ? "#f59e0b" : undefined,
                        }}
                      >
                        {yr}
                      </span>
                      {(currentUser?.role === "Administrator" || currentUser?.role === "System developer") && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteYear(yr); }}
                          className="text-red-400/60 hover:text-red-300 p-1 rounded-lg transition-colors duration-100 cursor-pointer shrink-0"
                          aria-label={`Delete year ${yr}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <ChevronDown className={`w-4 h-4 shrink-0 text-slate-500 transition-transform duration-200 ${yrExpanded ? "rotate-180" : ""}`} />
                    </button>

                    <div
                      className="overflow-hidden transition-all duration-200 ease-in-out"
                      style={{
                        maxHeight: yrExpanded ? "200px" : "0",
                        opacity: yrExpanded ? "1" : "0",
                      }}
                    >
                      <div className="ml-[52px] pl-4 border-l border-white/10 py-1.5 space-y-1.5">
                        {quarters.length === 0 ? (
                          <span className="text-[11px] text-slate-500 italic block py-2">No quarters</span>
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
                                className={`flex items-center justify-center px-4 py-2 text-xs font-medium rounded-lg ${
                                  isActiveQ
                                    ? "bg-white/10 text-white"
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                                }`}
                              >
                                {q}
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
        </div>

        <div className="mb-4">
          <div
            className={`overflow-hidden ${LAYOUT_TRANSITION} ${
              isCollapsed
                ? "max-h-0 opacity-0"
                : "max-h-8 opacity-100 px-3 mb-2"
            }`}
          >
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Reports & Actions
            </span>
          </div>

          <div className="px-3">
            <button
              title={isCollapsed ? "Excel Export" : undefined}
              style={{ "--active-color": "#10b981" } as React.CSSProperties}
              onClick={() => { onExcelExport(); onClose(); }}
              className="group w-full flex items-center pl-0 pr-0 py-2.5 gap-3 justify-start text-xs font-medium text-slate-300"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-emerald-500/90 group-hover:bg-white/5 group-hover:text-[var(--active-color)] transition-all duration-200 ease-out active:scale-90 scale-[0.96]">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span
                className="whitespace-nowrap text-xs font-medium text-slate-300 group-hover:text-[var(--active-color)]"
                style={{
                  transition: `opacity 500ms ${SIDEBAR_EASE}, color 200ms ease-out`,
                  opacity: isCollapsed ? 0 : 1,
                }}
              >
                Excel Export
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* User Profile */}
      {currentUser && (
        <div className="shrink-0 border-t border-white/5 overflow-hidden">
          <input type="file" ref={profileFileInputRef} accept="image/*" className="hidden" onChange={onProfilePicUpload} />

          {/* Fixed-height wrapper keeps both layouts always absolutely positioned */}
          <div className="relative h-28">
            {/* Expanded footer */}
            <div
              className="absolute inset-0 flex items-center gap-3 px-4 py-4"
              style={{
                transition: `opacity 500ms ${SIDEBAR_EASE}`,
                opacity: isCollapsed ? 0 : 1,
                pointerEvents: isCollapsed ? "none" : "auto",
              }}
            >
              <div
                onClick={() => profileFileInputRef.current?.click()}
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-bold flex items-center justify-center shrink-0 uppercase text-sm shadow-md cursor-pointer overflow-hidden group relative transition-colors duration-200"
                title="Upload Profile Picture"
              >
                {currentUser.profilePic ? (
                  <img src={currentUser.profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{currentUser.name.charAt(0)}</span>
                )}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                  <Camera className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate leading-snug">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 truncate font-semibold leading-none mt-0.5">{currentUser.role}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={onChangePasswordOpen}
                  className="p-2 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-white/5 transition cursor-pointer"
                  title="Change Password"
                >
                  <Key className="h-4 w-4" />
                </button>
                <button
                  onClick={onSignOut}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-white/5 transition cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Collapsed footer */}
            <div
              className="absolute inset-0 flex flex-col items-start pl-3 pr-3 py-4"
              style={{
                transition: `opacity 500ms ${SIDEBAR_EASE}`,
                opacity: isCollapsed ? 1 : 0,
                pointerEvents: isCollapsed ? "auto" : "none",
              }}
            >
              <div
                onClick={() => profileFileInputRef.current?.click()}
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-bold flex items-center justify-center shrink-0 uppercase text-sm shadow-md cursor-pointer overflow-hidden group relative transition-colors duration-200"
                title="Upload Profile Picture"
              >
                {currentUser.profilePic ? (
                  <img src={currentUser.profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{currentUser.name.charAt(0)}</span>
                )}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                  <Camera className="h-4 w-4 text-white" />
                </div>
              </div>

              <div className="flex-1" />

              <button
                onClick={onSignOut}
                style={{ "--active-color": "#ef4444" } as React.CSSProperties}
                className="group w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:bg-white/5 hover:text-[var(--active-color)] transition-all duration-200 ease-out active:scale-90 cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
