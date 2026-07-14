import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  UserPlus, 
  Database, 
  LogOut, 
  Users, 
  ClipboardList, 
  Calendar, 
  CheckSquare, 
  UserCheck, 
  Plus, 
  FileSpreadsheet, 
  Compass, 
  Info,
  Key,
  DatabaseBackup,
  Menu,
  X,
  HelpCircle,
  Phone,
  MapPin,
  Mail,
  Facebook,
  Server,
  Network,
  Sun,
  Moon,
  ChevronLeft
} from "lucide-react";
import { User, DashboardStats, Employee, LearningNeed } from "./types";
import LoginScreen from "./components/LoginScreen";
import DashboardStatsCard from "./components/DashboardStatsCard";
import EmployeeForm from "./components/EmployeeForm";
import RecordsTable from "./components/RecordsTable";
import SaveConfirmDialog from "./components/SaveConfirmDialog";

export default function App() {
  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme) return savedTheme === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Active View Tab State: home, add, view
  const [activeTab, setActiveTab] = useState<"home" | "add" | "view">("home");

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
  }, []);

  // Fetch stats whenever active tab shifts or user logs in
  useEffect(() => {
    if (currentUser) {
      fetchStats();
    }
  }, [currentUser, activeTab]);

  const fetchStats = () => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
      })
      .catch((err) => console.error("Error loading metrics:", err));
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
  const handleEditEmployeeTrigger = (employeeId: number) => {
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
      
      // Refresh Stats and redirect to table list
      fetchStats();
      if (isEdit) {
        setActiveTab("view");
      } else {
        // Keep user on Add New page and reset the form for convenience
        setActiveTab("add");
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
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : false);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex overflow-hidden antialiased font-sans transition-colors duration-200">
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

      {/* Backdrop overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* 1. Left Sidebar Component - Geometric Slate Design */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-slate-900 text-slate-200 flex flex-col shrink-0 transform transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:static md:translate-x-0 ${
          isSidebarCollapsed 
            ? 'md:w-0 md:opacity-0 md:pointer-events-none md:overflow-hidden' 
            : 'w-64 md:w-64 md:opacity-100'
        }`}
        aria-hidden={(!isSidebarOpen && !isDesktop) || (isDesktop && isSidebarCollapsed)}
      >
        {/* Branding header */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              <img
                src="/pangasinan-logo.svg"
                alt="Pangasinan Provincial Seal"
                className="w-9 h-9 object-contain bg-white rounded-full p-0.5 shrink-0"
              />
              <span className="font-bold tracking-tight text-white text-md leading-tight truncate">
                ILDP Pangasinan
                <span className="text-blue-400 text-[10px] block uppercase font-mono tracking-widest mt-0.5">Learning Needs Summary System</span>
              </span>
            </div>
            {/* Close button for mobile menu */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
            {/* Collapse button for desktop mode */}
            <button 
              onClick={() => setIsSidebarCollapsed(true)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white hidden md:block cursor-pointer transition shrink-0 ml-2"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Sidebar navigation */}
        <nav className="flex-1 py-6 space-y-7">
          <div>
            <div className="px-6 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Main Menu
            </div>
            <div className="space-y-1 menu-hover-fill">
              <button
                style={{ "--active-color": "#3b82f6" } as React.CSSProperties}
                onClick={() => { setActiveTab("home"); setIsSidebarOpen(false); }}
                className={`w-full flex items-center px-6 py-3 text-xs font-semibold transition-all duration-150 text-left border-l-4 ${
                  activeTab === "home" 
                    ? "bg-slate-800/80 border-blue-500 text-white font-bold" 
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 mr-3 shrink-0" />
                <span className="menu-link" data-text="Dashboard">Dashboard</span>
              </button>

              <button
                style={{ "--active-color": "#8b5cf6" } as React.CSSProperties}
                onClick={() => { setActiveTab("add"); setIsSidebarOpen(false); }}
                className={`w-full flex items-center px-6 py-3 text-xs font-semibold transition-all duration-150 text-left border-l-4 ${
                  activeTab === "add" 
                    ? "bg-slate-800/80 border-violet-500 text-white font-bold" 
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                <UserPlus className="w-4 h-4 mr-3 shrink-0" />
                <span className="menu-link" data-text={editingEmployee ? "Modify Records" : "Add New Record"}>
                  {editingEmployee ? "Modify Records" : "Add New Record"}
                </span>
              </button>

              <button
                style={{ "--active-color": "#10b981" } as React.CSSProperties}
                onClick={() => { setActiveTab("view"); setIsSidebarOpen(false); }}
                className={`w-full flex items-center px-6 py-3 text-xs font-semibold transition-all duration-150 text-left border-l-4 ${
                  activeTab === "view" 
                    ? "bg-slate-800/80 border-emerald-500 text-white font-bold" 
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                <Database className="w-4 h-4 mr-3 shrink-0" />
                <span className="menu-link" data-text="View Records">View Records</span>
              </button>
            </div>
          </div>

          <div>
            <div className="px-6 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Reports & Actions
            </div>
            <div className="space-y-1 menu-hover-fill">
              <button
                style={{ "--active-color": "#f59e0b" } as React.CSSProperties}
                onClick={() => { triggerExcelExportAll(); setIsSidebarOpen(false); }}
                className="w-full flex items-center px-6 py-3 text-xs font-semibold transition-all duration-150 text-left text-slate-400 hover:text-white border-l-4 border-transparent"
              >
                <FileSpreadsheet className="w-4 h-4 mr-3 shrink-0 text-emerald-500" />
                <span className="menu-link" data-text="Excel Summary Export">Excel Summary Export</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Sidebar bottom logged-in card */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center shrink-0 uppercase text-xs">
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{currentUser.role}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
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

            {/* Desktop Sidebar Expand Menu Button */}
            {isSidebarCollapsed && (
              <button 
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-1.5 -ml-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 hidden md:flex transition cursor-pointer animate-in fade-in duration-200"
                title="Expand Sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight font-display sm:text-base">
                {activeTab === "home" && "Home Dashboard"}
                {activeTab === "add" && (editingEmployee ? "Modify Employee Record" : "New Entry Wizard")}
                {activeTab === "view" && "Registered Learning Needs Directory"}
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                {formatHeaderDate()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 transition-all cursor-pointer animate-in fade-in duration-200"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
          </div>
        </header>

        {/* Scrollable panel area */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 sm:p-8 transition-colors duration-200">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Render Page 1: Home Dashboard */}
            <div className={`space-y-6 animate-in fade-in duration-200 ${activeTab === "home" ? "" : "hidden"}`}>
                {/* Welcome banner */}
                <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none"></div>

                  <div className="max-w-3xl space-y-3 relative z-10 flex-1">
                    <span className="bg-blue-600/30 text-blue-300 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-blue-500/20 backdrop-blur-md">
                      Pangasinan Provincial Portal
                    </span>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight font-display">
                      ILDP Learning Needs Encoding Portal
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                      Official workspace for the Provincial Government of Pangasinan. Manage employee learning requirements, streamline ILDP records with keyboard efficiency, and compile clean Excel summaries seamlessly.
                    </p>
                  </div>

                  <div className="relative z-10 shrink-0 hidden md:block">
                    <div className="bg-white/10 backdrop-blur-xs p-3 rounded-full border border-white/15 shadow-2xl">
                      <img
                        src="/pangasinan-logo.svg"
                        alt="Pangasinan Seal Logo"
                        className="h-24 w-24 object-contain"
                      />
                    </div>
                  </div>
                </div>

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
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6 transition-colors duration-200">
                  {/* Header Section */}
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg border dark:border-blue-900/40">
                        <HelpCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight font-display">
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
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6 space-y-4 hover:shadow-xs transition-all duration-200">
                      <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 font-display flex items-center gap-2 uppercase tracking-wider text-slate-450 dark:text-slate-450">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 text-[10px] font-bold">1</span>
                        How to Access the App (For All Users)
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        To access the employee database, please follow these steps:
                      </p>
                      <ol className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400">
                        <li className="flex gap-2">
                          <span className="text-blue-500 font-bold shrink-0">•</span>
                          <div>
                            <strong>Connect to the Network:</strong> Ensure your device is connected to the <span className="font-bold text-slate-850 dark:text-slate-200">CEEOD</span> office router.
                            <div className="mt-1 bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 text-[10px] px-2.5 py-1.5 rounded-lg border border-amber-200/25 dark:border-amber-900/30 flex items-start gap-1.5 leading-snug">
                              <Info className="h-3 w-3 shrink-0 mt-0.5" />
                              <span>This is a strictly local database. It is <strong>not</strong> accessible outside the office or on any other network.</span>
                            </div>
                          </div>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-blue-500 font-bold shrink-0">•</span>
                          <div>
                            <strong>Open the App:</strong> Once connected, open any web browser on your device and enter the following IP address in the address bar:
                            <div className="mt-1.5 font-mono text-xs text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/40 dark:bg-blue-950/20 py-1.5 px-3 rounded-lg border border-blue-200/50 dark:border-blue-800/40 inline-block shadow-2xs">
                              http://192.168.2.150
                            </div>
                          </div>
                        </li>
                      </ol>
                    </div>

                    {/* Security Notice Card & Admin Notes */}
                    <div className="space-y-6">
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6 space-y-3 hover:shadow-xs transition-all duration-200">
                        <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 font-display flex items-center gap-2 uppercase tracking-wider text-slate-450 dark:text-slate-450">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">2</span>
                          Why is the App Local? (Security Notice)
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          Because this application handles sensitive employee information, <strong>we do not use a cloud service provider</strong>.
                        </p>
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border dark:border-slate-800/80 leading-relaxed text-xs text-slate-600 dark:text-slate-400">
                          Keeping the database entirely offline and local to the office router ensures maximum security, data privacy, and complete protection against unauthorized external network access.
                        </div>
                      </div>

                      {/* Admin Card inside right column for better grid balance */}
                      <div className="bg-blue-50/30 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-900/20 rounded-2xl p-6 space-y-2 hover:shadow-xs transition-all duration-200">
                        <h4 className="text-xs font-bold text-blue-800 dark:text-blue-400 font-display flex items-center gap-2 uppercase tracking-wider">
                          <Server className="h-4.5 w-4.5" />
                          For the Host PC Administrator
                        </h4>
                        <ul className="space-y-2 text-xs text-slate-650 dark:text-slate-350 list-none pl-0">
                          <li className="flex gap-2 items-start">
                            <span className="text-blue-500 shrink-0">•</span>
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
                    className="bg-slate-900/60 backdrop-blur-lg border border-white/10 shadow-xl rounded-2xl p-6 relative overflow-hidden transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl"
                  >
                    <div 
                      className="absolute inset-0 bg-white/20 animate-pulse"
                    />
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                      
                      {/* Left: Branding & Developer Info */}
                      <div className="flex items-start gap-3.5">
                        <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-md shadow-blue-500/10 shrink-0 mt-0.5">
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
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 px-5 py-3 rounded-xl shadow-md transition-all duration-200 hover:scale-105 backdrop-blur-sm"
                          >
                            <Phone className="h-4 w-4 text-white shrink-0" />
                            <a href="tel:+639691637944" className="hover:text-white hover:underline font-mono font-semibold text-white/90">
                              +63 969 163 7944
                            </a>
                          </div>

                          <div 
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 px-5 py-3 rounded-xl shadow-md transition-all duration-200 hover:scale-105 backdrop-blur-sm"
                          >
                            <MapPin className="h-4 w-4 text-white shrink-0" />
                            <span className="text-white/90 font-medium">Libsong East, Lingayen, Pangasinan</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <a
                            href="https://www.facebook.com/Loche.Jimenez"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-600/30 hover:bg-blue-600/40 text-white font-semibold text-xs py-3 px-5 rounded-xl flex items-center justify-center gap-2 shadow-md transition duration-200 shrink-0 hover:scale-105 border border-white/10 backdrop-blur-sm"
                          >
                            <Facebook className="h-4 w-4 text-white" />
                            <span>Connect on Facebook</span>
                          </a>
                          <a
                            href="mailto:jimenezguillermojimz@gmail.com"
                            className="bg-red-600/30 hover:bg-red-600/40 text-white font-semibold text-xs py-3 px-5 rounded-xl flex items-center justify-center gap-2 shadow-md transition duration-200 shrink-0 hover:scale-105 border border-white/10 backdrop-blur-sm"
                          >
                            <Mail className="h-4 w-4 text-white" />
                            <span>Email Me</span>
                          </a>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>

            {/* Render Page 2: Add/Edit Record */}
            <div className={`animate-in fade-in duration-200 ${activeTab === "add" ? "" : "hidden"}`}>
              <EmployeeForm
                key={formKey}
                employee={editingEmployee}
                currentUser={currentUser}
                onSave={handleFormSaveRequest}
                onCancel={() => { setActiveTab("home"); setEditingEmployee(null); setFormKey((k) => k + 1); }}
                customOptionsVersion={customOptionsVersion}
                onCustomOptionsChange={handleCustomOptionsChange}
              />
            </div>

            {/* Render Page 3: View Records Table */}
            <div className={`animate-in fade-in duration-200 ${activeTab === "view" ? "" : "hidden"}`}>
              <RecordsTable
                onEditEmployee={handleEditEmployeeTrigger}
                onRefreshStats={fetchStats}
                customOptionsVersion={customOptionsVersion}
                onCustomOptionsChange={handleCustomOptionsChange}
              />
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
    </div>
  );
}
