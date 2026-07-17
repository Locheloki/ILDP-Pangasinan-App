import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import ExcelJS from "exceljs";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "database", "db.json");

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

const DEFAULT_OFFICES = [
  "Mapandan Community Hospital",
  "Manaoag Community Hospital",
  "Lingayen District Hospital",
  "Provincial Engineering Office",
  "Pangasinan Polytechnic College",
  "Capitol Resort Hotel",
  "Provincial Legal Office",
  "Western Pangasinan District Hospital",
  "Bayambang District Hospital",
  "Dasol Community Hospital"
];

const DEFAULT_POSITIONS = [
  "Nurse",
  "Nurse I",
  "Nurse II",
  "Nurse (Casual)",
  "Medical Technologist",
  "Medical Consultant",
  "Caregiver",
  "Admin. Aide/ Utility Worker (JO)",
  "Admin. Aide/IT Encoder",
  "Admin. Aide/ Ekonsulta Clerk",
  "Admin. Aide/ Philhealth Clerk",
  "Utility Worker",
  "Driver (Casual)",
  "Driver I",
  "HEO I",
  "Heavy Equipment Operator IE",
  "Engineer I",
  "Engineer II",
  "Engineer III",
  "Engineering Aide",
  "Attorney III",
  "Legal Assistant I",
  "Legal Researcher III",
  "Instructor III",
  "Associate Professor II",
  "Assistant Professor III",
  "Professor II",
  "Administrative Aide/ Housekeeping",
  "Administrative Aide/ Cook",
  "Administrative Aide/ Food & Beverages",
  "Administrative Aide/ Frontdesk Clerk",
  "Accounting Clerk (JO)",
  "Social Worker Officer I",
  "Pharmacist I",
  "Midwife",
  "Security Officer (Casual)",
  "Liaison Officer (Casual)",
  "Carpenter",
  "Draftsman I",
  "Administrative Assistant III",
  "Administrative Officer II",
  "Administrative Officer IV",
  "Supervising Administrative Officer"
];

const DEFAULT_LEARNING_NEEDS = [
  "Direct Sputum Smear Microscopy (DSSM)",
  "Basic Blood Banking Procedures",
  "Drug Testing Training",
  "Total Quality Management for Blood Services Facilities",
  "Lactation Management",
  "Infection Prevention and Control",
  "Vital Signs Taking",
  "Carrying out Doctor's Order",
  "Providing Nursing Care to Patients",
  "Operating Equipment",
  "Assisting Physicians with Diagnostic and Therapeutic Procedures",
  "Knowledge of the Operation of Different types of equipment",
  "Knowledge on Traffic Rules and Regulations",
  "Ability to Perform Pre-Post Equipment Operation",
  "Knowledge on Basic Safety Guidelines",
  "Ability in Operating Cleaning Equipment and Tools",
  "Customer Service Orientation",
  "Effective Written & Verbal Communication Skills",
  "Records & Archives Management",
  "Property, Supplies, and Equipment Procurement Management",
  "Financial Services (Budget, Accounting, Cashier Functions)",
  "Enhanced Computer Operations Skills",
  "People Management Skills",
  "Essential Driving and Vehicle Maintenance Skills",
  "General Maintenance & Repair Skills",
  "Liaising Skills",
  "Enhanced Administrative Skills",
  "Liaising Communications and Official Documents",
  "Managing Client Request",
  "Supply officer Planning",
  "Waste Management",
  "Social Work Case Management",
  "Pharmacy Planning",
  "Audit Report Writing",
  "Drafting Provincial Resolutions and Ordinances",
  "Preparing Transcript of Proceedings",
  "Maintaining Digital Records System"
];

const DEFAULT_BASES = [
  "Requirement of the position",
  "Competency Gap",
  "Licensing Requirement",
  "Update/Learning Requirement",
  "Succession Planning",
  "Competency Improvement",
  "N/A"
];

const DEFAULT_METHODOLOGIES = [
  "Seminar/Training",
  "Coaching & Mentoring",
  "Refresher Training",
  "Webinar",
  "Values Restoration Drive",
  "Job Rotation",
  "Shadowing",
  "N/A"
];

const DEFAULT_SCHEDULES = [
  "Immediately",
  "1st Quarter of 2024",
  "2nd Quarter of 2024",
  "3rd Quarter of 2024",
  "4th Quarter of 2024",
  "1st Quarter of 2025",
  "2nd Quarter of 2025",
  "3rd Quarter of 2025",
  "4th Quarter of 2025",
  "1st Quarter of 2026",
  "2nd Quarter of 2026",
  "3rd Quarter of 2026",
  "4th Quarter of 2026",
  "1st Quarter of 2027",
  "2nd Quarter of 2027",
  "3rd Quarter of 2027",
  "4th Quarter of 2027",
  "Quarterly"
];

// Helper functions for DB reading & writing
function readDatabase() {
  try {
    const defaults = {
      basis: DEFAULT_BASES,
      methodology: DEFAULT_METHODOLOGIES,
      office: DEFAULT_OFFICES,
      position: DEFAULT_POSITIONS,
      learningNeed: DEFAULT_LEARNING_NEEDS,
      schedule: DEFAULT_SCHEDULES
    };

    if (!fs.existsSync(DB_FILE)) {
      return { 
        users: [], 
        employees: [], 
        learningNeeds: [], 
        customOptions: { ...defaults } 
      };
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    const db = JSON.parse(data);
    if (!db.customOptions) {
      db.customOptions = { ...defaults };
    } else {
      // Ensure all required keys exist and are seeded if empty
      Object.keys(defaults).forEach(key => {
        const k = key as keyof typeof defaults;
        if (!db.customOptions[k] || !Array.isArray(db.customOptions[k]) || db.customOptions[k].length === 0) {
          db.customOptions[k] = [...defaults[k]];
        }
      });
    }
    return db;
  } catch (error) {
    console.error("Error reading database:", error);
    return { 
      users: [], 
      employees: [], 
      learningNeeds: [], 
      customOptions: { 
        basis: [], 
        methodology: [],
        office: [],
        position: [],
        learningNeed: [],
        schedule: []
      } 
    };
  }
}

function writeDatabase(data: any) {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing database:", error);
  }
}

function formatName(val: string): string {
  if (!val) return "";
  return val
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function formatMiddleInitial(val: string): string {
  const cleaned = (val || "").trim().toUpperCase();
  if (!cleaned) return "";
  if (cleaned.length === 1) {
    return cleaned + ".";
  }
  if (cleaned.length === 2 && cleaned.endsWith(".")) {
    return cleaned;
  }
  return cleaned.charAt(0) + ".";
}

function ensureCustomOptionsExist(employee: any, needs: any[], db: any) {
  if (!db.customOptions) {
    db.customOptions = { basis: [], methodology: [], office: [], position: [], learningNeed: [], schedule: [] };
  }

  const addOption = (type: string, val: string) => {
    if (!val) return;
    const trimmed = val.trim();
    if (!trimmed || trimmed.toLowerCase() === "n/a") return;
    
    const list = db.customOptions[type];
    if (Array.isArray(list)) {
      const exists = list.some((item: string) => item.toLowerCase() === trimmed.toLowerCase());
      if (!exists) {
        list.push(trimmed);
      }
    }
  };

  // 1. Office & Position
  if (employee.Office) addOption("office", employee.Office);
  if (employee.Position) addOption("position", employee.Position);

  // 2. Learning needs
  if (Array.isArray(needs)) {
    needs.forEach((need: any) => {
      if (need.LearningNeed) addOption("learningNeed", need.LearningNeed);
      if (need.TargetSchedule) addOption("schedule", need.TargetSchedule);

      // Basis and Methodology can be array or comma-separated string
      const parseList = (val: any) => {
        if (Array.isArray(val)) {
          return val.map(item => (item || "").trim()).filter(Boolean);
        } else if (typeof val === "string") {
          return val.split(",").map(item => item.trim()).filter(Boolean);
        }
        return [];
      };

      parseList(need.Basis).forEach(b => addOption("basis", b));
      parseList(need.Methodology).forEach(m => addOption("methodology", m));
    });
  }
}

// Check for similarity helper
function findSimilarEmployees(firstName: string, lastName: string, db: any) {
  const normFirst = firstName.trim().toLowerCase().replace(/\s+/g, " ");
  const normLast = lastName.trim().toLowerCase().replace(/\s+/g, " ");

  if (normFirst.length < 2 || normLast.length < 2) {
    return [];
  }

  return db.employees.filter((emp: any) => {
    const dbFirst = emp.FirstName.trim().toLowerCase().replace(/\s+/g, " ");
    const dbLast = emp.LastName.trim().toLowerCase().replace(/\s+/g, " ");

    const firstMatches =
      dbFirst === normFirst ||
      dbFirst.startsWith(`${normFirst} `) ||
      normFirst.startsWith(`${dbFirst} `);

    return dbLast === normLast && firstMatches;
  });
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// API routes go here FIRST

// API routes go here FIRST

// Custom Options Management
const VALID_TYPES = ["basis", "methodology", "office", "position", "learningNeed", "schedule"];

app.get("/api/options/:type", (req, res) => {
  const { type } = req.params;
  if (!VALID_TYPES.includes(type)) return res.status(400).json({ message: "Invalid type" });
  const db = readDatabase();
  return res.json(db.customOptions[type as keyof typeof db.customOptions]);
});

app.post("/api/options/:type", (req, res) => {
  const { type } = req.params;
  const { value } = req.body;
  if (!VALID_TYPES.includes(type)) return res.status(400).json({ message: "Invalid type" });
  if (!value) return res.status(400).json({ message: "Value required" });

  const db = readDatabase();
  const normalizedValue = value.trim();
  const exists = db.customOptions[type as keyof typeof db.customOptions].some((v: string) => v.toLowerCase() === normalizedValue.toLowerCase());
  
  if (exists) return res.status(400).json({ message: "Duplicate entry" });

  db.customOptions[type as keyof typeof db.customOptions].push(normalizedValue);
  writeDatabase(db);
  return res.status(201).json({ value: normalizedValue });
});

app.delete("/api/options/:type/:value", (req, res) => {
  const { type, value } = req.params;
  if (!VALID_TYPES.includes(type)) return res.status(400).json({ message: "Invalid type" });

  const db = readDatabase();
  db.customOptions[type as keyof typeof db.customOptions] = db.customOptions[type as keyof typeof db.customOptions].filter((v: string) => v.toLowerCase() !== value.toLowerCase());
  writeDatabase(db);
  return res.json({ message: "Deleted" });
});

// 1. Auth Endpoint
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  const db = readDatabase();
  const user = db.users.find(
    (u: any) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  // Return user info (role: Encoder / Administrator)
  return res.json({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  });
});

// 1b. Change Password Endpoint
app.post("/api/auth/change-password", (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  if (!username || !oldPassword || !newPassword) {
    return res.status(400).json({ message: "Username, old password, and new password are required" });
  }

  const db = readDatabase();
  const userIndex = db.users.findIndex(
    (u: any) => u.username.toLowerCase() === username.trim().toLowerCase()
  );

  if (userIndex === -1 || db.users[userIndex].password !== oldPassword) {
    return res.status(401).json({ message: "Incorrect current password" });
  }

  db.users[userIndex].password = newPassword;
  writeDatabase(db);

  return res.json({ message: "Password updated successfully" });
});

// 1c. Reset Password (Forgot Password) Endpoint using Developer Code
app.post("/api/auth/reset-password", (req, res) => {
  const { username, devCode, newPassword } = req.body;
  if (!username || !devCode || !newPassword) {
    return res.status(400).json({ message: "Username, developer code, and new password are required" });
  }

  if (devCode.trim() !== "101819") {
    return res.status(403).json({ message: "Invalid developer code. Contact developer." });
  }

  const db = readDatabase();
  const userIndex = db.users.findIndex(
    (u: any) => u.username.toLowerCase() === username.trim().toLowerCase()
  );

  if (userIndex === -1) {
    return res.status(404).json({ message: "Username not found" });
  }

  db.users[userIndex].password = newPassword;
  writeDatabase(db);

  return res.json({ message: "Password reset successfully" });
});

// 1d. Sign Up / Register New User Endpoint
app.post("/api/auth/signup", (req, res) => {
  const { username, password, devCode } = req.body;
  if (!username || !password || !devCode) {
    return res.status(400).json({ message: "Username, password, and developer code are required" });
  }

  if (devCode.trim() !== "101819") {
    return res.status(403).json({ message: "Invalid developer code. Contact developer." });
  }

  const db = readDatabase();
  const exists = db.users.some(
    (u: any) => u.username.toLowerCase() === username.trim().toLowerCase()
  );

  if (exists) {
    return res.status(400).json({ message: "Username already exists" });
  }

  const maxId = db.users.reduce((max: number, u: any) => (u.id > max ? u.id : max), 0);
  const newUser = {
    id: maxId + 1,
    username: username.trim(),
    password: password,
    name: username.trim(),
    role: "Encoder",
  };

  db.users.push(newUser);
  writeDatabase(db);

  return res.status(201).json({
    id: newUser.id,
    username: newUser.username,
    name: newUser.name,
    role: newUser.role,
  });
});

// 1e. Upload Profile Picture Endpoint
app.post("/api/users/profile-pic", (req, res) => {
  const { userId, profilePic } = req.body;
  if (!userId || !profilePic) {
    return res.status(400).json({ message: "userId and profilePic are required" });
  }

  const db = readDatabase();
  const userIndex = db.users.findIndex((u: any) => String(u.id) === String(userId));

  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found" });
  }

  db.users[userIndex].profilePic = profilePic;
  writeDatabase(db);

  return res.json({ message: "Profile picture updated successfully" });
});

// 2. Get Dashboard Stats
app.get("/api/dashboard/stats", (req, res) => {
  const db = readDatabase();
  const totalEmployees = db.employees.length;
  const totalLearningNeeds = db.learningNeeds.length;

  // Added today calculations
  const todayStr = new Date().toISOString().split("T")[0];
  const addedToday = db.learningNeeds.filter((ln: any) => {
    return ln.CreatedAt && ln.CreatedAt.startsWith(todayStr);
  }).length;

  // Upcoming Training Schedules estimation (e.g., target schedules starting in 2026/2027/2028 or Immediate)
  const upcomingSchedules = db.learningNeeds.filter((ln: any) => {
    const sched = ln.TargetSchedule || "";
    return (
      sched.includes("2026") ||
      sched.includes("2027") ||
      sched.includes("2028") ||
      sched.toLowerCase().includes("immediately")
    );
  }).length;

  // Calculate status review alerts (employees in status for 1+ year)
  const alertEmployees: any[] = [];
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  db.employees.forEach((emp: any) => {
    const status = emp.EmploymentStatus || "Undefined (Pending Review)";
    const changedAt = emp.StatusChangedAt;
    if (!changedAt) return;

    const changedDate = new Date(changedAt);
    if (changedDate <= oneYearAgo) {
      if (status === "Newly Hired" || status === "Re-employed") {
        alertEmployees.push({
          id: emp.EmployeeID,
          name: `${emp.FirstName} ${emp.LastName}`,
          office: emp.Office,
          status,
          message: "Not yet declared as Casual (1+ year in status)"
        });
      } else if (status === "Casual") {
        alertEmployees.push({
          id: emp.EmployeeID,
          name: `${emp.FirstName} ${emp.LastName}`,
          office: emp.Office,
          status,
          message: "Not yet declared as Permanent (1+ year in status)"
        });
      }
    }
  });

  return res.json({
    totalEmployees,
    totalLearningNeeds,
    addedToday,
    upcomingSchedules,
    alertEmployees,
  });
});

// 3. Search Similar Employees
app.post("/api/employees/check-similar", (req, res) => {
  const { firstName, lastName } = req.body;
  if (!firstName || !lastName) {
    return res.json({ similar: [] });
  }

  const db = readDatabase();
  const similar = findSimilarEmployees(firstName, lastName, db);
  return res.json({ similar });
});

// 4. Get All Employees with filter & search
app.get("/api/employees", (req, res) => {
  const db = readDatabase();
  const { search = "", office = "" } = req.query;

  let results = [...db.employees];

  if (search) {
    const q = (search as string).toLowerCase();
    results = results.filter((emp) =>
      `${emp.FirstName} ${emp.MiddleInitial || ""} ${emp.LastName}`.toLowerCase().includes(q)
    );
  }

  if (office) {
    const o = (office as string).toLowerCase();
    results = results.filter((emp) => emp.Office && emp.Office.toLowerCase().includes(o));
  }

  // Map employee with learning need count
  const resultsWithCount = results.map((emp) => {
    const needs = db.learningNeeds.filter((ln: any) => ln.EmployeeID === emp.EmployeeID);
    return {
      ...emp,
      needsCount: needs.length,
    };
  });

  return res.json(resultsWithCount);
});

// 4. Get Employees with custom filters (pending/custom encoding queue)
app.get("/api/employees/pending", (req, res) => {
  const db = readDatabase();
  const search = req.query.search ? (req.query.search as string).toLowerCase() : "";
  const office = req.query.office ? (req.query.office as string).toLowerCase() : "";
  const employmentType = req.query.employmentType ? (req.query.employmentType as string).toLowerCase() : "";
  const employmentStatus = req.query.employmentStatus ? (req.query.employmentStatus as string).toLowerCase() : "";
  const mode = req.query.mode ? (req.query.mode as string) : "no_needs";

  // Find IDs of all employees who have at least one learning need
  const hasNeedsIds = new Set(db.learningNeeds.map((ln: any) => ln.EmployeeID));
  
  // Apply base queue mode filter
  let pending = db.employees;
  if (mode === "no_needs") {
    pending = db.employees.filter((emp: any) => !hasNeedsIds.has(emp.EmployeeID));
  } else if (mode === "has_needs") {
    pending = db.employees.filter((emp: any) => hasNeedsIds.has(emp.EmployeeID));
  }

  // Apply search
  if (search) {
    const terms = search.split(/\s+/).filter(t => t.length > 0);
    if (terms.length > 0) {
      pending = pending.filter((emp: any) => {
        const searchString = `${emp.FirstName} ${emp.MiddleInitial || ""} ${emp.LastName} ${emp.Office || ""} ${emp.Position || ""}`.toLowerCase();
        const commaName = `${emp.LastName}, ${emp.FirstName}`.toLowerCase();
        return terms.every(term => searchString.includes(term) || commaName.includes(term));
      });
    }
  }

  // Apply custom filters
  if (office) {
    pending = pending.filter((emp: any) => emp.Office && emp.Office.toLowerCase() === office);
  }
  if (employmentType) {
    pending = pending.filter((emp: any) => emp.EmploymentType && emp.EmploymentType.toLowerCase() === employmentType);
  }
  if (employmentStatus) {
    pending = pending.filter((emp: any) => emp.EmploymentStatus && emp.EmploymentStatus.toLowerCase() === employmentStatus);
  }

  // Sort alphabetically by last name
  pending.sort((a: any, b: any) => a.LastName.localeCompare(b.LastName));

  return res.json({
    total: pending.length,
    employees: pending.slice(0, 100),
  });
});

// 5. Get Single Employee and their learning needs
app.get("/api/employees/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const db = readDatabase();
  const employee = db.employees.find((emp: any) => emp.EmployeeID === id);

  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }

  const needs = db.learningNeeds.filter((ln: any) => ln.EmployeeID === id);
  return res.json({
    ...employee,
    needs,
  });
});

// 6. Create New Employee
app.post("/api/employees", (req, res) => {
  const { firstName, middleInitial, lastName, office, position, employmentType, employmentStatus, gender, dateOfAssumption, username = "system" } = req.body;

  if (!firstName || !lastName || !office || !position) {
    return res.status(400).json({ message: "First name, last name, office, and position are required" });
  }

  const db = readDatabase();

  // Clean data
  const cleanFirst = formatName(firstName);
  const cleanMiddle = formatMiddleInitial(middleInitial);
  const cleanLast = formatName(lastName);
  const cleanOffice = office.trim();
  const cleanPosition = position.trim();
  const type = employmentType || "Undefined (Pending Review)";
  const status = employmentStatus || "Undefined (Pending Review)";

  // Create employee ID
  const maxId = db.employees.reduce((max: number, emp: any) => (emp.EmployeeID > max ? emp.EmployeeID : max), 0);
  const newEmployee: any = {
    EmployeeID: maxId + 1,
    FirstName: cleanFirst,
    MiddleInitial: cleanMiddle,
    LastName: cleanLast,
    Office: cleanOffice,
    Position: cleanPosition,
    EmploymentType: type,
    EmploymentStatus: status,
    StatusChangedAt: ["Newly Hired", "Re-employed", "Casual"].includes(status) ? new Date().toISOString() : null,
    Gender: gender || "Undefined (Pending Review)",
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
    CreatedBy: username,
    UpdatedBy: username,
  };

  if (dateOfAssumption) {
    newEmployee.DateOfAssumption = dateOfAssumption;
  }

  db.employees.push(newEmployee);
  ensureCustomOptionsExist(newEmployee, [], db);
  writeDatabase(db);

  return res.status(201).json(newEmployee);
});

// 7. Update Employee and Learning Needs in one transaction (Sync)
app.put("/api/employees/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { firstName, middleInitial, lastName, office, position, employmentType, employmentStatus, gender, dateOfAssumption, needs = [], username = "system" } = req.body;

  if (!firstName || !lastName || !office || !position) {
    return res.status(400).json({ message: "First name, last name, office, and position are required" });
  }

  const db = readDatabase();
  const employeeIndex = db.employees.findIndex((emp: any) => emp.EmployeeID === id);

  if (employeeIndex === -1) {
    return res.status(404).json({ message: "Employee not found" });
  }

  const oldEmp = db.employees[employeeIndex];
  const oldStatus = oldEmp.EmploymentStatus || "Undefined (Pending Review)";
  const newStatus = employmentStatus || "Undefined (Pending Review)";
  let statusChangedAt = oldEmp.StatusChangedAt;

  if (oldStatus !== newStatus) {
    statusChangedAt = ["Newly Hired", "Re-employed", "Casual"].includes(newStatus) ? new Date().toISOString() : null;
  }

  const hasDateOfAssumption = Object.prototype.hasOwnProperty.call(req.body, "dateOfAssumption");

  // Update employee info
  const updatedEmployee: any = {
    ...oldEmp,
    FirstName: formatName(firstName),
    MiddleInitial: formatMiddleInitial(middleInitial),
    LastName: formatName(lastName),
    Office: office.trim(),
    Position: position.trim(),
    EmploymentType: employmentType || "Undefined (Pending Review)",
    EmploymentStatus: newStatus,
    StatusChangedAt: statusChangedAt,
    Gender: gender || oldEmp.Gender || "Undefined (Pending Review)",
    UpdatedAt: new Date().toISOString(),
    UpdatedBy: username,
    CreatedBy: oldEmp.CreatedBy || username,
  };

  if (hasDateOfAssumption) {
    if (dateOfAssumption) {
      updatedEmployee.DateOfAssumption = dateOfAssumption;
    } else {
      delete updatedEmployee.DateOfAssumption;
    }
  }

  db.employees[employeeIndex] = updatedEmployee;

  // Sync learning needs
  const previousNeedsById = new Map<number, any>(
    db.learningNeeds
      .filter((ln: any) => ln.EmployeeID === id && ln.LearningNeedID)
      .map((ln: any) => [ln.LearningNeedID, ln])
  );

  // First, remove existing learning needs for this employee
  db.learningNeeds = db.learningNeeds.filter((ln: any) => ln.EmployeeID !== id);

  // Then, insert new learning needs
  let maxLNId = [...db.learningNeeds, ...previousNeedsById.values()].reduce((max: number, ln: any) => (ln.LearningNeedID > max ? ln.LearningNeedID : max), 0);

  needs.forEach((need: any) => {
    const existingNeed = need.LearningNeedID ? previousNeedsById.get(need.LearningNeedID) : null;
    const learningNeedId = existingNeed ? existingNeed.LearningNeedID : ++maxLNId;

    db.learningNeeds.push({
      LearningNeedID: learningNeedId,
      EmployeeID: id,
      LearningNeed: need.LearningNeed.trim(),
      Basis: Array.isArray(need.Basis) ? need.Basis.filter(item => item && item.trim() !== "").join(", ").trim() : (need.Basis || "N/A").trim(),
      Methodology: Array.isArray(need.Methodology) ? need.Methodology.filter(item => item && item.trim() !== "").join(", ").trim() : (need.Methodology || "N/A").trim(),
      TargetSchedule: (need.TargetSchedule || "N/A").trim(),
      CreatedAt: existingNeed?.CreatedAt || need.CreatedAt || new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
      CreatedBy: existingNeed?.CreatedBy || need.CreatedBy || username,
      UpdatedBy: username,
    });
  });

  ensureCustomOptionsExist(db.employees[employeeIndex], needs, db);
  writeDatabase(db);
  return res.json({
    ...db.employees[employeeIndex],
    needs: db.learningNeeds.filter((ln: any) => ln.EmployeeID === id),
  });
});

// 8. Delete Employee (and cascade delete learning needs)
app.delete("/api/employees/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const db = readDatabase();

  const employeeExists = db.employees.some((emp: any) => emp.EmployeeID === id);
  if (!employeeExists) {
    return res.status(404).json({ message: "Employee not found" });
  }

  db.employees = db.employees.filter((emp: any) => emp.EmployeeID !== id);
  db.learningNeeds = db.learningNeeds.filter((ln: any) => ln.EmployeeID !== id);

  writeDatabase(db);
  return res.json({ message: "Employee and associated learning needs successfully deleted" });
});

// 9. Create/Add Learning Need for Employee
app.post("/api/employees/:id/learning-needs", (req, res) => {
  const employeeId = parseInt(req.params.id);
  const { learningNeed, basis, methodology, targetSchedule, username = "system" } = req.body;

  if (!learningNeed) {
    return res.status(400).json({ message: "Learning Need description is required" });
  }

  const db = readDatabase();
  const employeeExists = db.employees.some((emp: any) => emp.EmployeeID === employeeId);
  if (!employeeExists) {
    return res.status(404).json({ message: "Employee not found" });
  }

  const maxId = db.learningNeeds.reduce((max: number, ln: any) => (ln.LearningNeedID > max ? ln.LearningNeedID : max), 0);
  const newNeed = {
    LearningNeedID: maxId + 1,
    EmployeeID: employeeId,
    LearningNeed: learningNeed.trim(),
    Basis: Array.isArray(basis) ? basis.filter(item => item && item.trim() !== "").join(", ").trim() : (basis || "N/A").trim(),
    Methodology: Array.isArray(methodology) ? methodology.filter(item => item && item.trim() !== "").join(", ").trim() : (methodology || "N/A").trim(),
    TargetSchedule: (targetSchedule || "N/A").trim(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
    CreatedBy: username,
    UpdatedBy: username,
  };

  db.learningNeeds.push(newNeed);
  writeDatabase(db);

  return res.status(201).json(newNeed);
});

// 10. Get All Learning Need Records in tabular format (joined with Employee details)
app.get("/api/learning-needs", (req, res) => {
  const db = readDatabase();
  const { search = "", office = "", learningNeed = "", employmentType = "", employmentStatus = "", sortBy = "LastName", sortOrder = "asc" } = req.query;

  let results: any[] = [];

  // Re-create the View: Left Join Employee + Learning Needs
  db.employees.forEach((emp: any) => {
    const empNeeds = db.learningNeeds.filter((ln: any) => ln.EmployeeID === emp.EmployeeID);
    if (empNeeds.length > 0) {
      empNeeds.forEach((ln: any) => {
        results.push({
          LearningNeedID: ln.LearningNeedID,
          EmployeeID: emp.EmployeeID,
          FirstName: emp.FirstName,
          MiddleInitial: emp.MiddleInitial,
          LastName: emp.LastName,
          Office: emp.Office,
          Position: emp.Position,
          EmploymentType: emp.EmploymentType || "Undefined (Pending Review)",
          EmploymentStatus: emp.EmploymentStatus || "Undefined (Pending Review)",
          StatusChangedAt: emp.StatusChangedAt,
          LearningNeed: ln.LearningNeed,
          Basis: ln.Basis,
          Methodology: ln.Methodology,
          TargetSchedule: ln.TargetSchedule,
          CreatedAt: ln.CreatedAt,
          UpdatedAt: ln.UpdatedAt,
          CreatedBy: ln.CreatedBy,
          UpdatedBy: ln.UpdatedBy,
          EmployeeCreatedBy: emp.CreatedBy,
          EmployeeCreatedAt: emp.CreatedAt,
          EmployeeUpdatedBy: emp.UpdatedBy,
          Gender: emp.Gender,
          DateOfAssumption: emp.DateOfAssumption,
        });
      });
    } else {
      // Add employee with no learning needs
      results.push({
        LearningNeedID: null,
        EmployeeID: emp.EmployeeID,
        FirstName: emp.FirstName,
        MiddleInitial: emp.MiddleInitial,
        LastName: emp.LastName,
        Office: emp.Office,
        Position: emp.Position,
        EmploymentType: emp.EmploymentType || "Undefined (Pending Review)",
        EmploymentStatus: emp.EmploymentStatus || "Undefined (Pending Review)",
        StatusChangedAt: emp.StatusChangedAt,
        LearningNeed: null,
        Basis: null,
        Methodology: null,
        TargetSchedule: null,
        CreatedAt: emp.CreatedAt,
        UpdatedAt: emp.UpdatedAt,
        CreatedBy: null,
        UpdatedBy: null,
        EmployeeCreatedBy: emp.CreatedBy,
        EmployeeCreatedAt: emp.CreatedAt,
        EmployeeUpdatedBy: emp.UpdatedBy,
        Gender: emp.Gender,
        DateOfAssumption: emp.DateOfAssumption,
      });
    }
  });

  // Apply searching/filtering
  if (search) {
    const terms = (search as string).toLowerCase().split(/\s+/).filter(t => t.length > 0);
    if (terms.length > 0) {
      results = results.filter((item) => {
        const searchString = `${item.FirstName} ${item.MiddleInitial || ""} ${item.LastName} ${item.Office || ""} ${item.Position || ""}`.toLowerCase();
        const commaName = `${item.LastName}, ${item.FirstName}`.toLowerCase();
        return terms.every(term => searchString.includes(term) || commaName.includes(term));
      });
    }
  }

  if (office) {
    const o = (office as string).toLowerCase();
    results = results.filter((item) => item.Office && item.Office.toLowerCase().includes(o));
  }

  if (learningNeed) {
    const lnVal = (learningNeed as string).toLowerCase();
    if (lnVal === "undefined (pending review)") {
      results = results.filter((item) => !item.LearningNeed || item.LearningNeed.toLowerCase().includes(lnVal));
    } else {
      results = results.filter((item) => item.LearningNeed && item.LearningNeed.toLowerCase().includes(lnVal));
    }
  }

  if (employmentType) {
    const et = (employmentType as string).toLowerCase();
    results = results.filter((item) => item.EmploymentType && item.EmploymentType.toLowerCase() === et);
  }

  if (employmentStatus) {
    const es = (employmentStatus as string).toLowerCase();
    results = results.filter((item) => item.EmploymentStatus && item.EmploymentStatus.toLowerCase() === es);
  }

  // Sorting
  results.sort((a, b) => {
    let valA = a[sortBy as string] || "";
    let valB = b[sortBy as string] || "";

    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  return res.json(results);
});

// 11. Delete a learning need
app.delete("/api/learning-needs/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const db = readDatabase();

  const lnIndex = db.learningNeeds.findIndex((ln: any) => ln.LearningNeedID === id);
  if (lnIndex === -1) {
    return res.status(404).json({ message: "Learning need not found" });
  }

  db.learningNeeds.splice(lnIndex, 1);
  writeDatabase(db);
  return res.json({ message: "Learning need deleted successfully" });
});

// 12. Excel Export using ExcelJS
app.get("/api/export/excel", async (req, res) => {
  const { employeeId, office, startDate, endDate, employmentType, employmentStatus } = req.query;
  const db = readDatabase();

  let results: any[] = [];

  // Fetch flat joined data using LEFT JOIN
  db.employees.forEach((emp: any) => {
    const empNeeds = db.learningNeeds.filter((ln: any) => ln.EmployeeID === emp.EmployeeID);
    if (empNeeds.length > 0) {
      empNeeds.forEach((ln: any) => {
        results.push({
          EmployeeID: emp.EmployeeID,
          FirstName: emp.FirstName,
          MiddleInitial: emp.MiddleInitial,
          LastName: emp.LastName,
          Office: emp.Office,
          Position: emp.Position,
          EmploymentType: emp.EmploymentType || "Undefined (Pending Review)",
          EmploymentStatus: emp.EmploymentStatus || "Undefined (Pending Review)",
          LearningNeed: ln.LearningNeed,
          Basis: ln.Basis,
          Methodology: ln.Methodology,
          TargetSchedule: ln.TargetSchedule,
          CreatedAt: ln.CreatedAt,
          Gender: emp.Gender,
          DateOfAssumption: emp.DateOfAssumption,
        });
      });
    } else {
      results.push({
        EmployeeID: emp.EmployeeID,
        FirstName: emp.FirstName,
        MiddleInitial: emp.MiddleInitial,
        LastName: emp.LastName,
        Office: emp.Office,
        Position: emp.Position,
        EmploymentType: emp.EmploymentType || "Undefined (Pending Review)",
        EmploymentStatus: emp.EmploymentStatus || "Undefined (Pending Review)",
        LearningNeed: "N/A",
        Basis: "N/A",
        Methodology: "N/A",
        TargetSchedule: "N/A",
        CreatedAt: emp.CreatedAt,
        Gender: emp.Gender,
        DateOfAssumption: emp.DateOfAssumption,
      });
    }
  });

  // Filter based on parameters
  if (employeeId) {
    const empId = parseInt(employeeId as string);
    results = results.filter((item) => item.EmployeeID === empId);
  }

  if (office) {
    const o = (office as string).toLowerCase();
    results = results.filter((item) => item.Office && item.Office.toLowerCase().includes(o));
  }

  if (employmentType) {
    const et = (employmentType as string).toLowerCase();
    results = results.filter((item) => item.EmploymentType && item.EmploymentType.toLowerCase() === et);
  }

  if (employmentStatus) {
    const es = (employmentStatus as string).toLowerCase();
    results = results.filter((item) => item.EmploymentStatus && item.EmploymentStatus.toLowerCase() === es);
  }

  if (startDate) {
    const sDate = new Date(startDate as string);
    results = results.filter((item) => new Date(item.CreatedAt) >= sDate);
  }

  if (endDate) {
    const eDate = new Date(endDate as string);
    // Include the whole day of end date
    eDate.setHours(23, 59, 59, 999);
    results = results.filter((item) => new Date(item.CreatedAt) <= eDate);
  }

  // Create Excel workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Learning Needs Summary");

  // Title Row
  worksheet.mergeCells("A1", "L1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = "INDIVIDUAL LEARNING AND DEVELOPMENT PLAN (ILDP) LEARNING NEEDS SUMMARY";
  titleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E3A8A" }, // Navy blue brand color
  };
  worksheet.getRow(1).height = 40;

  // Subtitle / Meta Row
  worksheet.mergeCells("A2", "L2");
  const subCell = worksheet.getCell("A2");
  subCell.value = `Exported on: ${new Date().toLocaleDateString()} | Total Records: ${results.length}`;
  subCell.font = { name: "Arial", size: 10, italic: true };
  subCell.alignment = { horizontal: "center" };
  worksheet.getRow(2).height = 20;

  worksheet.addRow([]); // Blank spacer

  // Table Headers
  const headerRow = worksheet.addRow([
    "ID",
    "Employee Name",
    "Gender",
    "Date of Assumption",
    "Office/Department",
    "Position",
    "Employment Type",
    "Employment Status",
    "Learning Need / Competency",
    "Basis of L&D Needs",
    "Proposed Action / Methodology",
    "Target Schedule",
  ]);

  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF3B82F6" }, // Accent Blue
    };
    cell.alignment = { horizontal: "left", vertical: "middle" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "medium" },
      right: { style: "thin" },
    };
  });

  // Data rows
  results.forEach((item, index) => {
    const fullName = `${item.LastName}, ${item.FirstName} ${item.MiddleInitial || ""}`.trim();
    const formattedDoa = item.DateOfAssumption ? new Date(item.DateOfAssumption).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "N/A";
    const row = worksheet.addRow([
      index + 1,
      fullName,
      item.Gender || "N/A",
      formattedDoa,
      item.Office,
      item.Position,
      item.EmploymentType,
      item.EmploymentStatus,
      item.LearningNeed,
      item.Basis,
      item.Methodology,
      item.TargetSchedule,
    ]);

    row.height = 20;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: "Arial", size: 10 };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
      cell.alignment = {
        horizontal: colNumber === 1 ? "center" : "left",
        vertical: "middle",
        wrapText: true,
      };
      // Zebra striping
      if (index % 2 === 1) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8FAFC" }, // very light slate
        };
      }
    });
  });

  // Adjust Column Widths
  worksheet.columns.forEach((column, i) => {
    let maxLength = 0;
    column.eachCell!({ includeEmpty: false }, (cell) => {
      const value = cell.value ? cell.value.toString() : "";
      if (value.length > maxLength && cell.address !== "A1" && cell.address !== "A2") {
        maxLength = value.length;
      }
    });
    // Set customized widths with standard boundaries
    if (i === 0) column.width = 6; // ID
    else if (i === 1) column.width = 25; // Name
    else if (i === 2) column.width = 30; // Office
    else if (i === 3) column.width = 25; // Position
    else if (i === 4) column.width = 40; // Learning Need
    else if (i === 5) column.width = 25; // Basis
    else if (i === 6) column.width = 25; // Methodology
    else if (i === 7) column.width = 20; // Schedule
  });

  // Set response headers and send Excel file
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=ILDP_Learning_Needs_Summary.xlsx"
  );

  await workbook.xlsx.write(res);
  res.end();
});

// ----------------------------------------------------
// VITE CLIENT DEV SERVER INTEGRATION
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
