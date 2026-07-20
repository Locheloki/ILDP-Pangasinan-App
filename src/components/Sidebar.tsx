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
} from "lucide-react";
import { User } from "../types";

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
}

type NavItem = {
  tab: string;
  icon: React.ElementType;
  label: string;
  dataText: string;
  color: string;
  adminOnly?: boolean;
  iconClass?: string;
  editLabel?: string;
};

const mainMenuItems: NavItem[] = [
  { tab: "home", icon: LayoutDashboard, label: "Dashboard", dataText: "Dashboard", color: "#3b82f6" },
  { tab: "add", icon: UserPlus, label: "Add New Record", dataText: "Add New Record", color: "#8b5cf6", editLabel: "Modify Records" },
  { tab: "view", icon: Database, label: "View Records", dataText: "View Records", color: "#10b981" },
  { tab: "rapid", icon: Zap, label: "Rapid Encoding", dataText: "Rapid Encoding", color: "#f59e0b", iconClass: "text-amber-500 fill-amber-500/10" },
  { tab: "import", icon: Upload, label: "Import Data", dataText: "Import Data", color: "#ef4444", adminOnly: true },
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
}: SidebarProps) {

  const handleTabClick = (tab: string) => {
    onTabChange(tab);
    onClose();
  };

  const labelForItem = (item: NavItem) =>
    item.tab === "add" && editingEmployee ? item.editLabel || item.label : item.label;

  const dataTextForItem = (item: NavItem) =>
    item.tab === "add" && editingEmployee ? item.editLabel || item.dataText : item.dataText;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 sidebar-contrast-bg backdrop-blur-xl text-slate-200 flex flex-col overflow-hidden shrink-0 transition-all duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } md:static md:translate-x-0 ${
        isCollapsed ? "w-60 md:w-[60px]" : "w-60 md:w-60"
      } md:my-3 md:ml-3 md:rounded-2xl md:border md:border-white/10 dark:md:border-white/15 md:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] md:h-[calc(100vh-1.5rem)]`}
    >
      {/* Branding header */}
      <div className={`flex items-center shrink-0 ${isCollapsed ? "justify-center p-3" : "px-5 py-4 justify-between"}`}>
        <div className="flex items-center space-x-2.5 min-w-0">
          <img
            src="/pangasinan-logo.svg"
            alt="Pangasinan Provincial Seal"
            className="w-7 h-7 object-contain bg-white rounded-full p-0.5 shrink-0"
          />
          {!isCollapsed && (
            <span className="font-semibold text-white text-base tracking-tight font-sans whitespace-nowrap">
              ILDP
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white md:hidden cursor-pointer transition shrink-0"
            title="Close Menu"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          {!isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white hidden md:block cursor-pointer transition shrink-0"
              title="Collapse Sidebar"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3">
        {/* Main Menu */}
        <div className="mb-4">
          {!isCollapsed && (
            <div className="px-2 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Main Menu
            </div>
          )}
          <div className={`space-y-1 ${isCollapsed ? "px-0.5" : ""} menu-hover-fill`}>
            {mainMenuItems.map((item) => {
              if (item.adminOnly && currentUser?.role !== "Administrator" && currentUser?.role !== "System developer") {
                return null;
              }
              const Icon = item.icon;
              const isActive = activeTab === item.tab;
              const displayLabel = labelForItem(item);
              const displayDataText = dataTextForItem(item);
              return (
                <button
                  key={item.tab}
                  title={isCollapsed ? displayLabel : undefined}
                  style={{ "--active-color": item.color } as React.CSSProperties}
                  onClick={() => handleTabClick(item.tab)}
                  className={`w-full flex items-center rounded-xl transition-all duration-150 text-xs font-medium ${
                    isCollapsed
                      ? "justify-center p-2.5"
                      : "justify-start px-3 py-3 gap-3"
                  } ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${item.iconClass || ""}`} />
                  {!isCollapsed && (
                    <span className="menu-link text-left truncate" data-text={displayDataText}>
                      {displayLabel}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Seminars icon in collapsed mode */}
            {isCollapsed && (
              <button
                title="Seminars"
                style={{ "--active-color": "#3b82f6" } as React.CSSProperties}
                onClick={() => onToggleCollapse()}
                className={`w-full flex justify-center p-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                  activeTab === "seminars"
                    ? "bg-white/10 text-white"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <Calendar className="w-5 h-5 shrink-0" />
              </button>
            )}
          </div>
        </div>

        {/* Seminars Section (expanded mode only) */}
        {!isCollapsed && (
          <div className="mb-4">
            <div className="flex items-center justify-between px-2 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Seminars</span>
              {(currentUser?.role === "Administrator" || currentUser?.role === "System developer") && (
                <button
                  onClick={onYearModalOpen}
                  className="text-slate-500 hover:text-white p-1 rounded-lg transition-all duration-100 cursor-pointer"
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
                  const yrExpanded = !(collapsedYears[yr] ?? false);
                  const quarters = seminarsTree[yr] || [];
                  const isYearActive = activeTab === "seminars" && selectedSeminarYear === yr;
                  return (
                    <div key={yr} className="group">
                      {/* Year row */}
                      <div className="flex items-center">
                        <button
                          onClick={() => onToggleYear(yr)}
                          className={`flex-1 flex items-center px-3 py-3 gap-3 text-xs font-medium transition-all duration-150 text-left rounded-xl min-w-0 ${
                            isYearActive && yrExpanded
                              ? "bg-white/10 text-white"
                              : "text-slate-300 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          <Calendar className="w-5 h-5 shrink-0" />
                          <span className="flex-1 min-w-0 truncate text-left">{yr}</span>
                          {(currentUser?.role === "Administrator" || currentUser?.role === "System developer") && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onDeleteYear(yr); }}
                              className="text-red-400/60 hover:text-red-300 p-1 rounded-lg transition-all duration-100 cursor-pointer shrink-0"
                              aria-label={`Delete year ${yr}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <ChevronDown className={`w-4 h-4 shrink-0 text-slate-500 transition-transform duration-200 ${yrExpanded ? "rotate-180" : ""}`} />
                        </button>
                      </div>

                      {/* Quarters — vertical line connector + sub-items */}
                      <div
                        className="overflow-hidden transition-all duration-200 ease-in-out"
                        style={{
                          maxHeight: yrExpanded ? "200px" : "0",
                          opacity: yrExpanded ? "1" : "0",
                        }}
                      >
                        <div className="ml-[25px] pl-4 border-l border-white/10 py-1 space-y-0.5">
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
                                  className={`w-full flex items-center px-3 py-2 text-xs font-medium transition-all duration-100 text-left rounded-lg ${
                                    isActiveQ
                                      ? "bg-white/10 text-white"
                                      : "text-slate-400 hover:text-white hover:bg-white/5"
                                  }`}
                                >
                                  <span className="truncate">{q}</span>
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
        )}

        {/* Reports & Actions */}
        <div className="mb-4">
          {!isCollapsed ? (
            <div className="px-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Reports & Actions
              </div>
              <button
                style={{ "--active-color": "#f59e0b" } as React.CSSProperties}
                onClick={() => { onExcelExport(); onClose(); }}
                className="w-full flex items-center px-3 py-3 text-xs font-medium transition-all duration-150 text-left text-slate-300 hover:text-white hover:bg-white/5 rounded-xl gap-3"
              >
                <FileSpreadsheet className="w-5 h-5 shrink-0 text-emerald-500" />
                <span className="menu-link truncate" data-text="Excel Export">Excel Export</span>
              </button>
            </div>
          ) : (
            <div className="px-0.5">
              <button
                title="Excel Export"
                style={{ "--active-color": "#f59e0b" } as React.CSSProperties}
                onClick={() => { onExcelExport(); onClose(); }}
                className="w-full flex justify-center p-2.5 rounded-xl text-xs font-medium transition-all duration-150 text-slate-300 hover:text-white hover:bg-white/5"
              >
                <FileSpreadsheet className="w-5 h-5 shrink-0 text-emerald-500" />
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* User Profile */}
      {currentUser && (
        <div className={`shrink-0 border-t border-white/5 ${isCollapsed ? "p-3 flex flex-col items-center gap-1.5" : "px-4 py-4 flex items-center gap-3"}`}>
          {isCollapsed ? (
            <>
              <div
                onClick={() => profileFileInputRef.current?.click()}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-bold flex items-center justify-center shrink-0 uppercase text-sm shadow-md cursor-pointer overflow-hidden group relative transition-colors duration-200"
                title="Upload Profile Picture"
              >
                {currentUser.profilePic ? (
                  <img src={currentUser.profilePic} alt="Profile" className="w-full h-full object-cover tab-pane-animate" />
                ) : (
                  <span>{currentUser.name.charAt(0)}</span>
                )}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                  <Camera className="h-4 w-4 text-white" />
                </div>
              </div>
              <input type="file" ref={profileFileInputRef} accept="image/*" className="hidden" onChange={onProfilePicUpload} />
              <button
                onClick={onSignOut}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-white/5 transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <div
                onClick={() => profileFileInputRef.current?.click()}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-bold flex items-center justify-center shrink-0 uppercase text-sm shadow-md cursor-pointer overflow-hidden group relative transition-colors duration-200"
                title="Upload Profile Picture"
              >
                {currentUser.profilePic ? (
                  <img src={currentUser.profilePic} alt="Profile" className="w-full h-full object-cover tab-pane-animate" />
                ) : (
                  <span>{currentUser.name.charAt(0)}</span>
                )}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                  <Camera className="h-4 w-4 text-white" />
                </div>
              </div>
              <input type="file" ref={profileFileInputRef} accept="image/*" className="hidden" onChange={onProfilePicUpload} />
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
            </>
          )}
        </div>
      )}
    </aside>
  );
}
