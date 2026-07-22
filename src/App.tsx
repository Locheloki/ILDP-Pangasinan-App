import React, { useState, useEffect } from "react";
import { 
  Users, 
  ClipboardList, 
  Calendar, 
  CheckSquare, 
  AlertTriangle,
  Info,
  Menu,
  ArrowRight,
  X,
  HelpCircle,
  Phone,
  MapPin,
  Mail,
  Facebook,
  Server,
  Sun,
  Moon,
  Sunset,
  Copy,
  Check,
  Globe,
  Lock,
} from "lucide-react";
import { User, DashboardStats, Employee, LearningNeed } from "./types";
import LoginScreen from "./components/LoginScreen";
import DashboardStatsCard from "./components/DashboardStatsCard";
import EmployeeForm from "./components/EmployeeForm";
import RecordsTable from "./components/RecordsTable";
import SaveConfirmDialog from "./components/SaveConfirmDialog";
import RapidEncoding from "./components/RapidEncoding";
import ImportData from "./components/ImportData";
import Seminars from "./components/Seminars";
import Sidebar from "./components/Sidebar";
import Modal from "./components/Modal";
import ErrorBoundary from "./components/ErrorBoundary";
import AuditLogs from "./components/AuditLogs";
import UserManagement from "./components/UserManagement";
import { useNavigation } from "./NavigationContext";

export default function App() {
  return <AppContent />;
}

function AppContent() {
  const { returnContext, setReturnContext, consumeReturnContext } = useNavigation();
  // Theme State: 'light' | 'dark' | 'sunset'
  const [theme, setTheme] = useState<'light' | 'dark' | 'sunset'>(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "dark" || savedTheme === "sunset" || savedTheme === "light") return savedTheme;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  });

  const cycleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : prev === "dark" ? "sunset" : "light");
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "sunset");
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "sunset") {
      root.classList.add("dark", "sunset"); // sunset inherits dark-mode utility classes
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Active View Tab State
  const [activeTab, setActiveTab] = useState<string>("home");
  const [tabBeforeEdit, setTabBeforeEdit] = useState<string>("view");
  const [selectedSeminarYear, setSelectedSeminarYear] = useState<number | null>(null);
  const [selectedSeminarQuarter, setSelectedSeminarQuarter] = useState<"Q1" | "Q2" | "Q3" | "Q4" | null>(null);
  const [seminarYears, setSeminarYears] = useState<number[]>([]);
  const [seminarsTree, setSeminarsTree] = useState<Record<number, string[]>>({});
  const [collapsedYears, setCollapsedYears] = useState<Record<number, boolean>>({});
  const [yearModalOpen, setYearModalOpen] = useState(false);
  const [deleteYearModalOpen, setDeleteYearModalOpen] = useState<number | null>(null);
  const [yearSeminarCount, setYearSeminarCount] = useState(0);
  const [yearAttendeeCount, setYearAttendeeCount] = useState(0);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const changeTab = (tab: string) => {
    if (tab === "add" && activeTab !== "add") {
      setTabBeforeEdit(activeTab);
    }
    setActiveTab(tab);
  };

  // IP Address Clipboard Copied Toast State
  const [ipCopied, setIpCopied] = useState(false);

  // Edit / Form state
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Summary Metrics Stats
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    totalLearningNeeds: 0,
    addedToday: 0,
    upcomingSchedules: 0,
  });

  // Save Confirmation Dialog states
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [pendingEmployee, setPendingEmployee] = useState<Partial<Employee> | null>(null);
  const [pendingNeeds, setPendingNeeds] = useState<LearningNeed[] | null>(null);
  const [skipConfirmation, setSkipConfirmation] = useState(false);
  // Force remount of add form to clear after successful save
  const [formKey, setFormKey] = useState(0);

  // Status Alerts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Global State for Custom Options Synchronization
  const [customOptionsVersion, setCustomOptionsVersion] = useState(0);
  const handleCustomOptionsChange = () => {
    setCustomOptionsVersion((prev) => prev + 1);
  };

  const profileFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!currentUser) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;

      try {
        const response = await fetch("/api/users/profile-pic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUser.id, profilePic: base64String }),
        });

        if (!response.ok) {
          throw new Error("Failed to upload profile picture");
        }

        const updatedUser = { ...currentUser, profilePic: base64String };
        setCurrentUser(updatedUser);
        sessionStorage.setItem("ildp_user", JSON.stringify(updatedUser));
        
        setToastType("success");
        setToastMessage("Profile picture updated successfully!");
      } catch (err: any) {
        setToastType("error");
        setToastMessage(err.message || "Failed to upload profile picture");
      }
    };
    reader.readAsDataURL(file);
  };

  // Load session or credentials if any, otherwise fetch stats on load
  useEffect(() => {
    // Check if session storage has user
    const savedUser = sessionStorage.getItem("ildp_user");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }

    // Check if save confirmation dialog preference was saved
    const savedSkip = sessionStorage.getItem("ildp_skip_confirm");
    if (savedSkip) {
      setSkipConfirmation(JSON.parse(savedSkip));
    }

    // Expose routing function for employee profile drawer clicks
    (window as any)._navigateToSeminar = (year: number, quarter: string, seminarId: string) => {
      setSelectedSeminarYear(year);
      setSelectedSeminarQuarter(quarter as any);
      setActiveTab("seminars");
      // Trigger deep selection within the Seminars component
      setTimeout(() => {
        const customEvent = new CustomEvent("openSeminarDetails", { detail: { seminarId } });
        window.dispatchEvent(customEvent);
      }, 100);
    };
  }, []);

  // Fetch stats whenever active tab shifts or user logs in
  useEffect(() => {
    if (currentUser) {
      fetchStats();
    }
  }, [currentUser, activeTab]);

  // Consume return context when navigating back from add/edit
  useEffect(() => {
    if (activeTab === "seminars") {
      const ctx = consumeReturnContext();
      if (ctx?.returnParams?.shouldRematch) {
        // Clear the context after consuming
        setReturnContext(null);
        showToast(`Returning to import review.`, "success");
      }
    }
  }, [activeTab, consumeReturnContext]);

  const fetchStats = () => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
      })
      .catch((err) => console.error("Error loading metrics:", err));

    // Also fetch unique seminar years to populate sidebar
    fetch("/api/seminars/years")
      .then((res) => res.json())
      .then((data) => {
        const yearsData = data.years || [];
        const years = yearsData.map((y: any) => y.year);
        const tree: Record<number, string[]> = {};
        yearsData.forEach((y: any) => {
          tree[y.year] = Object.keys(y.quarters || {});
        });
        setSeminarYears(years);
        setSeminarsTree(tree);
      })
      .catch((err) => console.error("Error loading seminar years:", err));
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem("ildp_user", JSON.stringify(user));
    showToast(`Welcome back, ${user.name}!`, "success");
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    sessionStorage.removeItem("ildp_user");
    showToast("Successfully signed out.", "success");
  };

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Switch directory row edit mode
  const handleEditEmployeeTrigger = (employeeId: number, fromTab?: string) => {
    // Save return context if coming from seminars import
    if (fromTab === "seminars" || activeTab === "seminars") {
      setReturnContext({
        returnTab: "seminars",
        returnParams: { shouldRematch: true },
      });
    }
    setTabBeforeEdit(activeTab);
    fetch(`/api/employees/${employeeId}`)
      .then((res) => res.json())
      .then((emp) => {
        setEditingEmployee(emp);
        setActiveTab("add");
        showToast(`Editing profile of ${emp.FirstName} ${emp.LastName}`, "success");
      })
      .catch((err) => {
        console.error("Error fetching employee details:", err);
        showToast("Unable to load profile data for editing.", "error");
      });
  };

  // Export spreadsheet triggered from Quick actions
  const triggerExcelExportAll = () => {
    window.open("/api/export/excel", "_blank");
    showToast("Downloading Learning Needs summary Excel spreadsheet...", "success");
  };

  // Form Saving logic
  const handleFormSaveRequest = (employeeData: Partial<Employee>, needs: LearningNeed[]) => {
    setPendingEmployee(employeeData);
    setPendingNeeds(needs);

    if (skipConfirmation) {
      // Execute save directly
      executeSave(employeeData, needs, skipConfirmation);
    } else {
      // Open modal
      setIsSaveModalOpen(true);
    }
  };

  const handleConfirmSave = (dontAskAgain: boolean) => {
    setIsSaveModalOpen(false);
    if (dontAskAgain) {
      setSkipConfirmation(true);
      sessionStorage.setItem("ildp_skip_confirm", "true");
    }

    if (pendingEmployee && pendingNeeds) {
      executeSave(pendingEmployee, pendingNeeds, dontAskAgain);
    }
  };

  const executeSave = async (empData: Partial<Employee>, needsData: LearningNeed[], dontAskAgain: boolean) => {
    try {
      let response;
      const isEdit = !!empData.EmployeeID;
      
      const payload = {
        firstName: empData.FirstName,
        middleInitial: empData.MiddleInitial,
        lastName: empData.LastName,
        office: empData.Office,
        position: empData.Position,
        employmentType: empData.EmploymentStatus || empData.EmploymentType,
        employmentStatus: empData.EmploymentStatus,
        needs: needsData,
        username: currentUser?.username || "system",
      };

      if (isEdit) {
        // Update existing employee (or selected similar)
        response = await fetch(`/api/employees/${empData.EmployeeID}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new employee
        // First we create the employee
        response = await fetch("/api/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const newEmp = await response.json();
          // Then we attach their learning needs using sync endpoint
          response = await fetch(`/api/employees/${newEmp.EmployeeID}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              firstName: newEmp.FirstName,
              middleInitial: newEmp.MiddleInitial,
              lastName: newEmp.LastName,
              office: newEmp.Office,
              position: newEmp.Position,
              employmentType: newEmp.EmploymentStatus || newEmp.EmploymentType,
              employmentStatus: newEmp.EmploymentStatus,
              needs: needsData,
              username: currentUser?.username || "system",
            }),
          });
        }
      }

      if (!response || !response.ok) {
        throw new Error("Server database sync failed");
      }

      showToast("Records saved and synchronized successfully!", "success");
      setEditingEmployee(null);
      setPendingEmployee(null);
      setPendingNeeds(null);
      
      // Refresh Stats
      fetchStats();
      
      // Check if we should return to a previous context (e.g., seminar import review)
      if (returnContext?.returnTab) {
        const targetTab = returnContext.returnTab;
        setReturnContext(null);
        changeTab(targetTab);
      } else if (isEdit) {
        changeTab("view");
      } else {
        // Keep user on Add New page and reset the form for convenience
        changeTab("add");
        setFormKey((k) => k + 1);
      }
    } catch (error) {
      console.error("Save error:", error);
      showToast("An error occurred while saving the records. Please try again.", "error");
    }
  };

  const handleCancelSave = () => {
    setIsSaveModalOpen(false);
    setPendingEmployee(null);
    setPendingNeeds(null);
  };

  // Sidebar mobile toggle state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Keyboard shortcut listener: Ctrl + S to save if in add tab, Esc to cancel
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if (activeTab === "add") {
        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
          e.preventDefault();
          // Find form submit button and trigger it
          const submitBtn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
          if (submitBtn) submitBtn.click();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, [activeTab]);

  // Format current date dynamically
  const formatHeaderDate = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    return `${now.toLocaleDateString(undefined, options)} (Q${quarter})`;
  };

  // Render Login page if not authenticated
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex antialiased font-sans transition-colors duration-200">
      {/* Dynamic Toast Alerts */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl border shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom duration-300 ${
          toastType === "success" 
            ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/10" 
            : "bg-red-600 text-white border-red-500 shadow-red-600/10"
        }`}>
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white font-bold ml-2 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Desktop sidebar wrapper */}
      <div
        className="hidden md:block shrink-0 overflow-hidden transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] my-3 ml-3 rounded-2xl border border-white/10 dark:md:border-white/15 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] h-[calc(100vh-1.5rem)] sidebar-contrast-bg backdrop-blur-xl"
        style={{ width: isSidebarCollapsed ? 64 : 240 }}
      >
        <Sidebar
          isOpen={true}
          isCollapsed={isSidebarCollapsed}
          activeTab={activeTab}
          currentUser={currentUser}
          editingEmployee={!!editingEmployee}
          years={seminarYears}
          seminarsTree={seminarsTree}
          collapsedYears={collapsedYears}
          selectedSeminarYear={selectedSeminarYear}
          selectedSeminarQuarter={selectedSeminarQuarter}
          profileFileInputRef={profileFileInputRef}
          onClose={() => setIsSidebarOpen(false)}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onTabChange={(tab) => changeTab(tab)}
          onToggleYear={(yr) => setCollapsedYears(prev => {
            const isCurrentlyExpanded = !(prev[yr] ?? true);
            if (isCurrentlyExpanded) {
              return { ...prev, [yr]: true };
            } else {
              const next: Record<number, boolean> = {};
              for (const key of Object.keys(prev)) {
                next[Number(key)] = true;
              }
              next[yr] = false;
              return next;
            }
          })}
          onSelectSeminarQuarter={(yr, q) => {
            setSelectedSeminarYear(yr);
            setSelectedSeminarQuarter(q as any);
          }}
          onProfilePicUpload={handleProfilePicUpload}
          onChangePasswordOpen={() => setIsChangePasswordOpen(true)}
          onSignOut={handleSignOut}
          onExcelExport={triggerExcelExportAll}
          onYearModalOpen={() => setYearModalOpen(true)}
          onDeleteYear={async (yr) => {
            try {
              const res = await fetch(`/api/seminars/years/${yr}`);
              if (res.ok) {
                const data = await res.json();
                setDeleteYearModalOpen(yr);
                setYearSeminarCount(data.seminarsRemoved ?? 0);
                setYearAttendeeCount(data.attendeeAssociationsRemoved ?? 0);
              }
            } catch {}
          }}
          variant="desktop"
        />
      </div>

      {/* Mobile sidebar */}
      <div className="md:hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          isCollapsed={false}
          activeTab={activeTab}
          currentUser={currentUser}
          editingEmployee={!!editingEmployee}
          years={seminarYears}
          seminarsTree={seminarsTree}
          collapsedYears={collapsedYears}
          selectedSeminarYear={selectedSeminarYear}
          selectedSeminarQuarter={selectedSeminarQuarter}
          profileFileInputRef={profileFileInputRef}
          onClose={() => setIsSidebarOpen(false)}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onTabChange={(tab) => changeTab(tab)}
          onToggleYear={(yr) => setCollapsedYears(prev => {
            const isCurrentlyExpanded = !(prev[yr] ?? true);
            if (isCurrentlyExpanded) {
              return { ...prev, [yr]: true };
            } else {
              const next: Record<number, boolean> = {};
              for (const key of Object.keys(prev)) {
                next[Number(key)] = true;
              }
              next[yr] = false;
              return next;
            }
          })}
          onSelectSeminarQuarter={(yr, q) => {
            setSelectedSeminarYear(yr);
            setSelectedSeminarQuarter(q as any);
          }}
          onProfilePicUpload={handleProfilePicUpload}
          onChangePasswordOpen={() => setIsChangePasswordOpen(true)}
          onSignOut={handleSignOut}
          onExcelExport={triggerExcelExportAll}
          onYearModalOpen={() => setYearModalOpen(true)}
          onDeleteYear={async (yr) => {
            try {
              const res = await fetch(`/api/seminars/years/${yr}`);
              if (res.ok) {
                const data = await res.json();
                setDeleteYearModalOpen(yr);
                setYearSeminarCount(data.seminarsRemoved ?? 0);
                setYearAttendeeCount(data.attendeeAssociationsRemoved ?? 0);
              }
            } catch {}
          }}
          variant="mobile"
        />
      </div>

      {/* 2. Main Content Wrapper - Floating layout on desktop to match sidebar card flow */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:my-3 md:mr-2 md:ml-2 md:rounded-2xl md:border md:border-slate-200 dark:md:border-slate-800/80 md:shadow-md bg-slate-50 dark:bg-slate-950">
        
        {/* Persistent Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sm:px-8 shrink-0 shadow-xs transition-colors duration-200">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Menu Button */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 -ml-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 md:hidden transition"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Desktop Sidebar Expand Button (arrow) */}
            {isSidebarCollapsed && (
              <button 
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-1.5 -ml-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 hidden md:flex transition cursor-pointer animate-in fade-in duration-200"
                title="Expand Sidebar"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            )}
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight font-display sm:text-base">
                {activeTab === "home" && "Home Dashboard"}
                {activeTab === "add" && (editingEmployee ? "Modify Employee Record" : "New Entry Wizard")}
                {activeTab === "view" && "Registered Learning Needs Directory"}
                {activeTab === "rapid" && "Ingestion Panel"}
                {activeTab === "import" && "Employee Data Import"}
                {activeTab === "seminars" && `Seminar Attendances Directory — ${selectedSeminarYear}`}
                {activeTab === "auditlogs" && "Activity & Audit Logs"}
                {activeTab === "usermanagement" && "User Management"}
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                {formatHeaderDate()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={cycleTheme}
              className="btn-glass p-2.5 rounded-xl cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 border-none"
              title={theme === "light" ? "Switch to dark mode" : theme === "dark" ? "Switch to sunset mode" : "Switch to light mode"}
            >
              {theme === "light" && <Moon className="h-4.5 w-4.5" />}
              {theme === "dark" && <Sunset className="h-4.5 w-4.5" />}
              {theme === "sunset" && <Sun className="h-4.5 w-4.5" />}
            </button>
          </div>
        </header>

        {/* Scrollable panel area */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 sm:p-8 transition-colors duration-200">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Render Page 1: Home Dashboard */}
            <div className={`space-y-6 tab-pane-animate ${activeTab === "home" ? "" : "hidden"}`}>
                {/* Welcome banner */}
                <div className="sidebar-contrast-bg border border-slate-200/50 dark:border-slate-800/80 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none"></div>

                  <div className="max-w-3xl space-y-3 relative z-10 flex-1">
                    <span className="bg-blue-600/30 text-blue-300 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-blue-500/20 backdrop-blur-md">
                      Pangasinan Provincial Portal
                    </span>
                    <h1>
                    </h1>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight font-display">
                      ILDP Learning Needs Encoding Portal
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                      Official workspace for the Provincial Government of Pangasinan. Manage employee learning requirements, streamline ILDP records with keyboard efficiency, and compile clean Excel summaries seamlessly.
                    </p>
                  </div>

                  <div className="relative z-10 shrink-0 hidden md:block">
                    <div className="logo-glass p-4 rounded-full flex items-center justify-center">
                      <img
                        src="/pangasinan-logo.svg"
                        alt="Pangasinan Seal Logo"
                        className="h-24 w-24 object-contain"
                      />
                    </div>
                  </div>
                </div>

                {/* Employment Status Review Alerts */}
                {stats.alertEmployees && stats.alertEmployees.length > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl">
                        <AlertTriangle className="h-5 w-5 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-display">
                          Employment Status Action Required ({stats.alertEmployees.length})
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          The following employees have remained in their current status for over 1 year. Administrative review or declaration may be required.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                      {stats.alertEmployees.map((emp) => (
                        <div 
                          key={emp.id}
                          className="bg-white/60 dark:bg-slate-900/40 border border-slate-200/40 dark:border-white/5 rounded-xl p-3 flex items-center justify-between gap-4 shadow-xs hover:shadow-xs transition"
                        >
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{emp.name}</h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{emp.office}</p>
                            <span className="inline-block mt-1 text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Current: {emp.status}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => {
                              handleEditEmployeeTrigger(emp.id);
                            }}
                            className="btn-glass bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/30 text-[10px] py-1.5 px-3 font-semibold rounded-lg shrink-0 cursor-pointer transition hover:scale-102 active:scale-98"
                          >
                            Review Profile
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary metrics widgets grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <DashboardStatsCard
                    title="Total Employees"
                    value={stats.totalEmployees}
                    description="Unique staff profiles"
                    icon={Users}
                    theme="blue"
                  />
                  <DashboardStatsCard
                    title="Learning Needs Logged"
                    value={stats.totalLearningNeeds}
                    description="Active training plans"
                    icon={ClipboardList}
                    theme="indigo"
                  />
                  <DashboardStatsCard
                    title="Added Today"
                    value={stats.addedToday}
                    description="Records past 24 hours"
                    icon={Calendar}
                    theme="green"
                  />
                  <DashboardStatsCard
                    title="Upcoming Schedules"
                    value={stats.upcomingSchedules}
                    description="Active training milestones"
                    icon={CheckSquare}
                    theme="amber"
                  />
                </div>

                {/* Web App Access Guidelines & Reminders */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md p-6 sm:p-8 space-y-6 transition-all duration-300">
                  {/* Header Section */}
                  <div className="border-b border-slate-50 dark:border-slate-800/50 pb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 rounded-xl">
                        <HelpCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-display">
                          Web App Access Guidelines & Reminders
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          System connectivity instructions, security notifications, and administrator reminders
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Grid Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Access Steps Card */}
                    <div className="bg-slate-50/50 dark:bg-slate-950/30 rounded-2xl p-6 space-y-4 shadow-sm hover:shadow-md transition-all duration-200">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-display flex items-center gap-2.5 tracking-tight">
                        <div className="p-1.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg">
                          <Globe className="h-4.5 w-4.5" />
                        </div>
                        <span>How to Access the App (For All Users)</span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        To access the employee database, please follow these steps:
                      </p>
                      <ol className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400">
                        <li className="flex gap-2">
                          <span className="text-blue-500 font-bold shrink-0">•</span>
                          <div>
                            <strong>Connect to the Network:</strong> Ensure your device is connected to the <span className="font-bold text-slate-800 dark:text-slate-200">CEEOD</span> office router.
                            <div className="mt-1.5 bg-amber-50/60 dark:bg-amber-950/15 text-amber-800 dark:text-amber-400 text-[10px] px-3 py-2 rounded-xl flex items-start gap-2 leading-relaxed shadow-xs">
                              <Info className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-500" />
                              <span>This is a strictly local database. It is <strong>not</strong> accessible outside the office or on any other network.</span>
                            </div>
                          </div>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-blue-500 font-bold shrink-0">•</span>
                          <div>
                            <strong>Open the App:</strong> Once connected, open any web browser on your device and enter the following IP address in the address bar:
                            
                            <div className="mt-2.5 flex items-center gap-2">
                              <div className="font-mono text-xs text-blue-700 dark:text-blue-500 font-bold bg-blue-50 dark:bg-blue-950/60 py-2 px-3.5 rounded-xl shadow-xs select-all">
                                http://192.168.2.150
                              </div>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText("http://192.168.2.150");
                                  setIpCopied(true);
                                  setTimeout(() => setIpCopied(false), 2000);
                                }}
                                className="p-2 bg-slate-200/60 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl transition-all active:scale-95 shadow-xs cursor-pointer flex items-center gap-1.5 text-[10px] font-semibold"
                                title="Copy IP to Clipboard"
                              >
                                {ipCopied ? (
                                  <>
                                    <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500 animate-in zoom-in duration-200" />
                                    <span className="text-emerald-600 dark:text-emerald-500">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3.5 w-3.5 text-slate-500" />
                                    <span>Copy IP</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </li>
                      </ol>
                    </div>

                    {/* Security Notice Card & Admin Notes */}
                    <div className="space-y-6">
                      <div className="bg-slate-50/50 dark:bg-slate-950/30 rounded-2xl p-6 space-y-3.5 shadow-sm hover:shadow-md transition-all duration-200">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-display flex items-center gap-2.5 tracking-tight">
                          <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-lg">
                            <Lock className="h-4.5 w-4.5" />
                          </div>
                          <span>Why is the App Local? (Security Notice)</span>
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          Because this application handles sensitive employee information, <strong>we do not use a cloud service provider</strong>.
                        </p>
                        <div className="bg-white dark:bg-slate-900/60 rounded-xl p-4 shadow-xs leading-relaxed text-xs text-slate-600 dark:text-slate-400">
                          Keeping the database entirely offline and local to the office router ensures maximum security, data privacy, and complete protection against unauthorized external network access.
                        </div>
                      </div>

                      {/* Admin Card inside right column for better grid balance */}
                      <div className="bg-slate-50/50 dark:bg-slate-950/30 rounded-2xl p-6 space-y-3.5 shadow-sm hover:shadow-md transition-all duration-200">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 font-display flex items-center gap-2.5 tracking-tight">
                          <div className="p-1.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg">
                            <Server className="h-4.5 w-4.5" />
                          </div>
                          <span>For the Host PC Administrator</span>
                        </h4>
                        <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 list-none pl-0">
                          <li className="flex gap-2.5 items-start">
                            <span className="text-blue-500 shrink-0 mt-1">•</span>
                            <p className="leading-relaxed">
                              <strong>Keep the Host PC Running:</strong> The web application must remain active and running on the host PC at all times. If the host PC is turned off, goes to sleep, or logs out, other team members will lose access to the system immediately.
                            </p>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Developer Contact Support Banner */}
                <div className="pt-4">
                <div 
                    className="developer-support-banner bg-slate-900/60 backdrop-blur-lg border border-white/10 shadow-xl rounded-2xl p-6 relative overflow-hidden transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                      
                      {/* Left: Branding & Developer Info */}
                      <div className="flex items-start gap-3.5">
                        <div className="stat-icon-glass theme-blue text-white p-2.5 rounded-xl shrink-0 mt-0.5">
                          <HelpCircle className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">Having Trouble?</span>
                            <span className="bg-white/20 text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">Developer Support</span>
                          </div>
                          <h4 className="text-base font-bold text-white tracking-tight font-display">
                            Guillermo Jimz S. Jimenez III
                          </h4>
                          <p className="text-xs text-white/60 font-medium">
                            System Developer · Contact me for database, setup, or technical assistance
                          </p>
                        </div>
                      </div>

                      {/* Right: Contact Details & Link Button */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6 shrink-0">
                        <div className="space-y-2 text-xs text-slate-600">
                          <div 
                            className="flex items-center gap-2 info-glass px-5 py-3 rounded-xl transition-all duration-200 hover:scale-102"
                          >
                            <Phone className="h-4 w-4 !text-white shrink-0" />
                            <a href="tel:+639691637944" className="hover:text-white hover:underline font-mono font-semibold !text-white/90">
                              +63 969 163 7944
                            </a>
                          </div>

                          <div 
                            className="flex items-center gap-2 info-glass px-5 py-3 rounded-xl transition-all duration-200 hover:scale-102"
                          >
                            <MapPin className="h-4 w-4 !text-white shrink-0" />
                            <span className="!text-white/90 font-medium">Libsong East, Lingayen, Pangasinan</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <a
                            href="https://www.facebook.com/Loche.Jimenez"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-glass bg-blue-500/10 hover:bg-blue-500/20 !text-white border-blue-200/50 dark:border-blue-900/30 text-xs py-3 px-5 rounded-xl flex items-center justify-center gap-2 shadow-md transition duration-200 shrink-0 hover:scale-105"
                          >
                            <Facebook className="h-4 w-4 shrink-0 !text-blue-300" />
                            <span className="!text-white">Connect on Facebook</span>
                          </a>
                          <a
                            href="mailto:jimenezguillermojimz@gmail.com"
                            className="btn-glass bg-red-500/10 hover:bg-red-500/20 !text-white border-red-200/50 dark:border-red-900/30 text-xs py-3 px-5 rounded-xl flex items-center justify-center gap-2 shadow-md transition duration-200 shrink-0 hover:scale-105"
                          >
                            <Mail className="h-4 w-4 shrink-0 !text-red-300" />
                            <span className="!text-white">Email Me</span>
                          </a>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>

            {/* Render Page 2: Add/Edit Record */}
            <div className={`tab-pane-animate ${activeTab === "add" ? "" : "hidden"}`}>
              <EmployeeForm
                key={formKey}
                employee={editingEmployee}
                currentUser={currentUser}
                onSave={handleFormSaveRequest}
                onCancel={() => {
                  // Check if we should return to seminar import
                  const ctx = consumeReturnContext();
                  if (ctx?.returnTab) {
                    setReturnContext(null);
                    changeTab(ctx.returnTab);
                  } else {
                    changeTab(tabBeforeEdit);
                  }
                  setEditingEmployee(null);
                  setFormKey((k) => k + 1);
                }}
                customOptionsVersion={customOptionsVersion}
                onCustomOptionsChange={handleCustomOptionsChange}
              />
            </div>

            {/* Render Page 3: View Records Table */}
            <div className={`tab-pane-animate ${activeTab === "view" ? "" : "hidden"}`}>
              <RecordsTable
                onEditEmployee={handleEditEmployeeTrigger}
                onRefreshStats={fetchStats}
                customOptionsVersion={customOptionsVersion}
                onCustomOptionsChange={handleCustomOptionsChange}
              />
            </div>

            {/* Render Page 4: Rapid Encoding Mode */}
            <div className={`tab-pane-animate ${activeTab === "rapid" ? "" : "hidden"}`}>
              {currentUser && (
                <RapidEncoding
                  currentUser={currentUser}
                  onSaveSuccess={fetchStats}
                  customOptionsVersion={customOptionsVersion}
                />
              )}
            </div>

            {/* Render Page 5: Import Data (Admin Only) */}
            <div className={`tab-pane-animate ${activeTab === "import" ? "" : "hidden"}`}>
              <ImportData onComplete={fetchStats} />
            </div>

            {/* Render Page 6: Audit Logs */}
            <div className={`tab-pane-animate ${activeTab === "auditlogs" ? "" : "hidden"}`}>
              <AuditLogs currentUser={currentUser} />
            </div>

            {/* Render Page 7: Seminars Catalog (Dynamic Years) */}
            <div className={`tab-pane-animate ${activeTab === "seminars" ? "" : "hidden"}`}>
              <ErrorBoundary><Seminars
                year={selectedSeminarYear}
                quarter={selectedSeminarQuarter}
                onSelectEmployee={(empId) => handleEditEmployeeTrigger(empId, "seminars")}
                currentUser={currentUser}
                onSeminarChange={fetchStats}
                onAddNewRecord={() => {
                  // Save return context so we come back after creating employee
                  setReturnContext({
                    returnTab: "seminars",
                    returnParams: { shouldRematch: true },
                  });
                  setEditingEmployee(null);
                  setFormKey((k) => k + 1);
                  changeTab("add");
                }}
                /></ErrorBoundary>
            </div>

            {/* Render Page 8: User Management (System Developer only) */}
            <div className={`tab-pane-animate ${activeTab === "usermanagement" ? "" : "hidden"}`}>
              <UserManagement currentUser={currentUser} />
            </div>

          </div>
        </div>

        {/* System footer */}
        <footer className="h-12 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sm:px-8 text-[11px] text-slate-400 dark:text-slate-500 shrink-0 transition-colors duration-200">
          <span>ILDP Summary System</span>
          <span>© {new Date().getFullYear()} Provincial Government of Pangasinan</span>
        </footer>

      </div>

      {/* Save Confirmation Dialogue */}
      <SaveConfirmDialog
        isOpen={isSaveModalOpen}
        onConfirm={handleConfirmSave}
        onCancel={handleCancelSave}
      />

      {/* Change Password Dialogue */}
      {isChangePasswordOpen && currentUser && (
        <ChangePasswordModal
          currentUser={currentUser}
          onClose={() => setIsChangePasswordOpen(false)}
          onSuccess={(msg) => {
            showToast(msg, "success");
            setIsChangePasswordOpen(false);
          }}
          onError={(msg) => {
            showToast(msg, "error");
          }}
        />
      )}

      {/* Add Year Modal */}
      <Modal
        isOpen={yearModalOpen}
        onClose={() => setYearModalOpen(false)}
        maxWidth="max-w-sm"
        ariaLabel="Add Seminar Year"
        title="Add Seminar Year"
        bodyClassName="space-y-4"
        footer={
          <>
            <button
              onClick={() => setYearModalOpen(false)}
              className="btn-glass text-xs py-2 px-4 cursor-pointer font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                const input = document.getElementById("new-year-input") as HTMLInputElement;
                const year = parseInt(input?.value);
                if (!year || isNaN(year)) return;
                try {
                  const res = await fetch("/api/seminars/years", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ year }),
                  });
                  if (res.ok) {
                    setYearModalOpen(false);
                    fetchStats();
                  } else {
                    const err = await res.json();
                    showToast(err.error || "Failed to create year", "error");
                  }
                } catch {
                  showToast("Failed to create year", "error");
                }
              }}
              className="btn-glass bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/30 text-xs py-2 px-4 cursor-pointer font-bold rounded-xl shadow-md shadow-blue-500/5"
            >
              Create Year
            </button>
          </>
        }
      >
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Enter a new seminar year. Quarters Q1–Q4 will be available automatically.
        </p>
        <input
          id="new-year-input"
          type="number"
          placeholder="e.g. 2027"
          min="2020"
          max="2100"
          className="block w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 dark:text-white font-semibold transition-colors"
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.currentTarget.parentElement?.parentElement?.querySelector("button:last-child") as HTMLButtonElement)?.click();
          }}
        />
      </Modal>

      {/* Delete Year Confirmation Modal */}
      <Modal
        isOpen={deleteYearModalOpen !== null}
        onClose={() => { setDeleteYearModalOpen(null); setDeleteConfirmText(""); }}
        maxWidth="max-w-md"
        ariaLabel="Delete Seminar Year"
        title={`Delete Year ${deleteYearModalOpen || ""}?`}
        bodyClassName="space-y-4"
        footer={
          <>
            <button
              onClick={() => { setDeleteYearModalOpen(null); setDeleteConfirmText(""); }}
              className="btn-glass text-xs py-2 px-4 cursor-pointer font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              disabled={yearSeminarCount > 0 && deleteConfirmText !== "CONFIRM"}
              onClick={async () => {
                const yr = deleteYearModalOpen;
                if (yr === null) return;
                try {
                  const res = await fetch(`/api/seminars/years/${yr}`, { method: "DELETE" });
                  if (res.ok) {
                    setDeleteYearModalOpen(null);
                    setYearSeminarCount(0);
                    setYearAttendeeCount(0);
                    setDeleteConfirmText("");
                    fetchStats();
                    showToast(`Year ${yr} deleted successfully.`, "success");
                  } else {
                    const err = await res.json();
                    showToast(err.error || "Failed to delete year", "error");
                  }
                } catch {
                  showToast("Failed to delete year", "error");
                }
              }}
              className="btn-glass bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-900/30 text-xs py-2 px-4 cursor-pointer font-bold rounded-xl shadow-md shadow-red-500/5 disabled:opacity-50 disabled:pointer-events-none"
            >
              Delete Year
            </button>
          </>
        }
      >
        {yearSeminarCount > 0 ? (
          <>
            <div className="flex gap-3 items-start p-3 bg-red-500/10 border border-red-200/40 dark:border-red-900/30 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-red-600 dark:text-red-400">This year contains seminar records.</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Deleting it will permanently remove <strong>{deleteYearModalOpen}</strong>, its <strong>{yearSeminarCount}</strong> seminars, and <strong>{yearAttendeeCount}</strong> attendee associations. This action cannot be undone.
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Type <strong className="text-red-500">CONFIRM</strong> below to proceed.
            </p>
            <input
              type="text"
              placeholder="Type CONFIRM"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="block w-full px-3 py-2 border border-red-300 dark:border-red-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-xs text-slate-800 dark:text-white font-bold text-center tracking-widest uppercase transition-colors"
            />
          </>
        ) : (
          <>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              This year has no seminars and will be removed immediately.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to remove <strong>{deleteYearModalOpen}</strong> from the sidebar?
            </p>
          </>
        )}
      </Modal>
    </div>
  );
}

interface ChangePasswordModalProps {
  currentUser: User;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

function ChangePasswordModal({ currentUser, onClose, onSuccess, onError }: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      onError("New passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: currentUser.username,
          oldPassword,
          newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to change password.");
      }

      onSuccess(data.message || "Password successfully changed!");
    } catch (err: any) {
      onError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      maxWidth="max-w-sm"
      ariaLabel="Change Password"
      title="Change Password"
      bodyClassName="space-y-4 pt-2"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="btn-glass text-xs py-2 px-4 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            onClick={handleSubmit}
            className="btn-glass bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30 text-xs py-2 px-4 cursor-pointer font-bold"
          >
            {loading ? "Saving..." : "Change Password"}
          </button>
        </>
      }
    >
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-2">
        Update the security credentials for your account (<strong>{currentUser.username}</strong>).
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Current Password
          </label>
          <input
            type="password"
            required
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-slate-100 text-xs transition-colors duration-200"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            New Password
          </label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-slate-100 text-xs transition-colors duration-200"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Confirm New Password
          </label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="block w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-slate-100 text-xs transition-colors duration-200"
            placeholder="••••••••"
          />
        </div>
      </form>
    </Modal>
  );
}
