import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import ExcelJS from "exceljs";
import { computeChanges, changesDescription, formatBeforeAfter, TRACKED_FIELDS } from "./src/server/audit";

// Extend Express Request type to support our RBAC middleware
declare global {
  namespace Express {
    interface Request {
      _user?: { id: number; username: string; role: string; name: string };
    }
  }
}

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
let _dbCache: any = null;

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

    // Return cached copy if available (invalidated by writeDatabase)
    if (_dbCache) return _dbCache;

    if (!fs.existsSync(DB_FILE)) {
      return { 
        users: [], 
        employees: [], 
        learningNeeds: [], 
        seminars: [],
        seminarAttendees: [],
        seminarYears: [],
        auditLogs: [],
        customOptions: { ...defaults } 
      };
    }

    const data = fs.readFileSync(DB_FILE, "utf-8");
    const db = JSON.parse(data);
    if (!db.seminars) db.seminars = [];
    if (!db.seminarAttendees) db.seminarAttendees = [];
    if (!db.seminarYears) db.seminarYears = [];
    if (!db.auditLogs) db.auditLogs = [];
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

    _dbCache = db;
    return db;
  } catch (error) {
    console.error("Error reading database:", error);
    return { 
      users: [], 
      employees: [], 
      learningNeeds: [], 
      seminars: [],
      seminarAttendees: [],
      auditLogs: [],
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
    // Invalidate cache so next read picks up changes
    _dbCache = null;
  } catch (error) {
    console.error("Error writing database:", error);
  }
}

// Audit Log Helper
function createAuditLog(params: {
  module: string;
  action: string;
  entity_type: string;
  entity_id?: string | number;
  entity_name?: string;
  description?: string;
  before_data?: any;
  after_data?: any;
  performed_by?: string;
}) {
  const db = readDatabase();
  const maxId = db.auditLogs.reduce((max: number, log: any) => (log.id > max ? log.id : max), 0);
  const logEntry = {
    id: maxId + 1,
    timestamp: new Date().toISOString(),
    module: params.module,
    action: params.action,
    entity_type: params.entity_type,
    entity_id: params.entity_id != null ? String(params.entity_id) : null,
    entity_name: params.entity_name || null,
    description: params.description || null,
    before_data: params.before_data != null ? JSON.stringify(params.before_data) : null,
    after_data: params.after_data != null ? JSON.stringify(params.after_data) : null,
    performed_by: params.performed_by || "System (Development Mode)",
    created_at: new Date().toISOString(),
  };
  db.auditLogs.push(logEntry);
  writeDatabase(db);
  return logEntry;
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

// Text normalization for fuzzy matching
function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    .replace(/[\t\n\r]+/g, " ")
    .replace(/[-_\/,.(）]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const NON_PERSON_KEYWORDS = new Set([
  "office", "department", "division", "section", "unit", "team",
  "position", "designation", "title", "remarks", "signature", "date",
  "training", "seminar", "workshop", "conference", "meeting",
  "participants", "participant", "employee", "employees", "attendee", "attendees",
  "name", "names", "no", "number", "total", "subtotal", "grand total",
  "page", "prepared", "approved", "noted", "attested", "received",
  "submitted", "reviewed", "checked", "verified", "validated",
  "confirmed", "copied", "distributed", "filename", "schedule",
  "location", "venue", "speaker", "facilitator", "trainor", "trainer",
  "inclusive", "duration", "time", "subject", "topic", "agenda",
  "objective", "rationale", "background", "reference",
  "summary", "list", "attendance", "sheet", "form",
  "republic", "province", "municipality", "city", "barangay",
  "human", "resource", "resources", "administrative", "finance",
  "accounting", "budget", "planning", "development",
  "education", "health", "agriculture", "engineering",
  "general", "services", "support", "management",
  "regional", "national", "local", "field",
  "action", "order", "memorandum", "advisory",
  "certification", "accreditation", "registration",
  "male", "female", "sex", "gender", "age",
  "address", "contact", "phone", "email", "status",
  "regular", "casual", "contractual", "job", "order",
  "grade", "step", "salary", "rate",
  "row", "column", "cell", "table", "header", "footer",
  "answer", "question", "instruction", "direction",
  "note", "notes", "important", "warning",
  "sample", "example", "template", "format",
  "code", "id", "reference", "slug"
]);

function isLikelyPersonName(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const cleaned = text.trim();
  if (cleaned.length < 4) return false;

  const lower = cleaned.toLowerCase();

  // Skip rows that contain signature/identification blocks
  if (/^(prepared|approved|noted|attested|certified|verified|received|submitted|checked|reviewed|validated|confirmed|copied|distributed|requested|endorsed|recommended)\s*(by|for)?[:：]/i.test(cleaned)) return false;
  if (/^(prepared|approved|noted|attested|certified|verified|received|submitted|checked|reviewed)\s+by$/i.test(cleaned)) return false;

  // Skip obvious metadata phrases
  if (/^(attendance\s*sheet|training\s*title|seminar\s*title|list\s*of\s*participants|employee\s*name|employee\s*list|name\s*of\s*employee|republic\s*of\s*the\s*philippines|province\s*of|human\s*resource|administrative\s*officer|management\s*officer)$/i.test(cleaned)) return false;

  // Skip if it's a known non-person keyword (exact single word match)
  if (!cleaned.includes(" ") && NON_PERSON_KEYWORDS.has(lower)) return false;

  // Skip if it looks like a column header section (all caps, single word, non-person meaning)
  if (/^[A-Z\s]{4,30}$/.test(cleaned) && !cleaned.includes(" ")) {
    // Single word all-caps: check if it contains mostly consonants (suggests label)
    const vowelCount = (cleaned.match(/[AEIOU]/g) || []).length;
    if (vowelCount === 0 && cleaned.length > 4) return false;
    // Common label pattern: all caps, short, no vowels
    if (NON_PERSON_KEYWORDS.has(lower)) return false;
  }

  // Skip single-word values that are common labels (longer than typical name length)
  if (!cleaned.includes(" ")) {
    if (NON_PERSON_KEYWORDS.has(lower)) return false;
    // Skip if it's a common office/position label disguised as a name
    if (/^(office|division|section|unit|department|position|designation|title|remarks)$/i.test(cleaned)) return false;
  }

  // Skip multi-word values where every word is a known non-person keyword
  if (cleaned.includes(" ")) {
    const words = cleaned.split(/\s+/).filter(Boolean);
    const nonPersonCount = words.filter((w) => NON_PERSON_KEYWORDS.has(w.toLowerCase())).length;
    // If ALL words in a multi-word value are non-person keywords, skip
    if (nonPersonCount === words.length && words.length >= 2) return false;
  }

  // Must contain at least one alphabetic character
  if (!/[A-Za-z]/.test(cleaned)) return false;

  // If it contains numbers (other than roman numerals or ordinals), it's probably not a name
  const numberPattern = /\d/;
  if (numberPattern.test(cleaned.replace(/[IVXLCDM]+/g, ""))) return false;

  return true;
}

function matchEmployees(
  rawEmployees: { rawName: string; office: string; position?: string; employeeId?: string; manualEmployeeId?: number; _key?: string }[],
  dbEmployees: any[]
): { matched: any[]; matchedDiff: any[]; unmatched: any[] } {
  const matched: any[] = [];
  const matchedDiff: any[] = [];
  const unmatched: any[] = [];

  // Names map for fast exact lookup (normalized)
  const namesMap = new Map<string, any>();
  dbEmployees.forEach((emp: any) => {
    const full = normalizeText(`${emp.FirstName} ${emp.MiddleInitial || ""} ${emp.LastName}`);
    namesMap.set(full, emp);
    const commaFull = normalizeText(`${emp.LastName}, ${emp.FirstName} ${emp.MiddleInitial || ""}`);
    namesMap.set(commaFull, emp);
  });

  // Build EmployeeID lookup map
  const employeeByIdMap = new Map<string, any>();
  dbEmployees.forEach((emp: any) => {
    if (emp.EmployeeID) employeeByIdMap.set(String(emp.EmployeeID).trim(), emp);
  });

  const parsedNames = new Set<string>();

  for (const entry of rawEmployees) {
    const { rawName: nameVal, office: officeVal, position: positionVal, employeeId, manualEmployeeId, _key } = entry;
    if (!nameVal) continue;
    if (nameVal.toLowerCase().includes("page") || nameVal.toLowerCase().includes("total") || nameVal.toLowerCase() === "names") continue;

    const normName = normalizeText(nameVal);
    if (parsedNames.has(normName)) continue;
    parsedNames.add(normName);

    let match: any = null;
    let matchedByManual = false;

    // Priority 0: Manual match override
    if (manualEmployeeId) {
      const manualEmp = employeeByIdMap.get(String(manualEmployeeId));
      if (manualEmp) {
        match = manualEmp;
        matchedByManual = true;
      }
    }

    // Priority 1: Employee ID match (if available)
    if (!match) {
      const rawId = employeeId?.trim();
      if (rawId) {
        match = employeeByIdMap.get(rawId) || null;
      }
    }

    // Priority 2: Full name match via normalized namesMap
    if (!match) {
      match = namesMap.get(normName);
    }

    // Priority 3: Without middle initials (normalized)
    if (!match) {
      const cleanName = normalizeText(normName.replace(/\b\w\.\b/g, "").replace(/\s+/g, " ").trim());
      for (const emp of dbEmployees) {
        if (match) break;
        const empFull = normalizeText(`${emp.FirstName} ${emp.LastName}`);
        if (empFull === cleanName) {
          match = emp;
        }
      }
    }

    // Priority 4: First name + Last name (any order, normalized)
    if (!match) {
      const parts = normalizeText(nameVal).split(/\s+/).filter(Boolean);
      for (const emp of dbEmployees) {
        if (match) break;
        const empFirst = normalizeText(emp.FirstName || "");
        const empLast = normalizeText(emp.LastName || "");
        if (parts.length >= 2) {
          if ((parts[0] === empFirst && parts[parts.length - 1] === empLast) ||
              (parts[0] === empLast && parts[parts.length - 1] === empFirst)) {
            match = emp;
          }
        }
      }
    }

    // Priority 5: Last name + office match (normalized)
    if (!match && officeVal) {
      const normOffice = normalizeText(officeVal);
      const excelLast = normalizeText(nameVal).split(/\s+/).pop() || "";
      for (const emp of dbEmployees) {
        if (match) break;
        const empLast = normalizeText(emp.LastName || "");
        const empOffice = normalizeText(emp.Office || "");
        if (empLast === excelLast && empOffice === normOffice) {
          match = emp;
        }
      }
    }

    if (match) {
      const differences: string[] = [];
      const matchReasons: string[] = [];
      let confidence = 0;
      let matchedByName = false;

      if (matchedByManual) {
        confidence = 100;
        matchReasons.push("Manually matched by user");
      } else if (employeeId?.trim() && String(match.EmployeeID).trim() === employeeId.trim()) {
        confidence = 100;
        matchReasons.push("Exact Employee ID match");
      } else {
        // Calculate confidence based on match priority
        const normParts = normalizeText(nameVal).split(/\s+/).filter(Boolean);
        const empFirst = normalizeText(match.FirstName || "");
        const empLast = normalizeText(match.LastName || "");
        const empMI = normalizeText(match.MiddleInitial || "");

        // Check name component matches
        const firstNameMatch = normParts.some(p => p === empFirst);
        const lastNameMatch = normParts.some(p => p === empLast);
        const miMatch = empMI && normParts.some(p => p === empMI || p === empMI + ".");

        if (firstNameMatch && lastNameMatch && miMatch) {
          confidence = 98;
          matchedByName = true;
          matchReasons.push("First name, last name, and middle initial match");
        } else if (firstNameMatch && lastNameMatch) {
          confidence = 95;
          matchedByName = true;
          matchReasons.push("First name and last name match");
        } else if (lastNameMatch && officeVal && match.Office && normalizeText(officeVal) === normalizeText(match.Office)) {
          confidence = 85;
          matchReasons.push("Last name and office match");
        } else if (lastNameMatch) {
          confidence = 75;
          matchReasons.push("Last name matches");
        } else {
          confidence = 60;
          matchReasons.push("Partial name match");
        }

        // Check office difference
        if (officeVal && match.Office && normalizeText(officeVal) !== normalizeText(match.Office)) {
          differences.push("Office");
          confidence = Math.max(confidence - 10, 50);
        }

        // Check position difference
        const positionVal = (entry as any).position || "";
        if (positionVal && match.Position && normalizeText(positionVal) !== normalizeText(match.Position)) {
          differences.push("Position");
          confidence = Math.max(confidence - 5, 50);
        }
      }

      const base = {
        _key: _key || "",
        rawName: nameVal,
        office: officeVal,
        position: (entry as any).position || "",
        EmployeeID: String(match.EmployeeID),
        LastName: match.LastName,
        FirstName: match.FirstName,
        MiddleInitial: match.MiddleInitial,
        Office: match.Office,
        Position: match.Position,
        confidence,
        matchReasons
      };

      // Name-based matches always go to matched, even with metadata differences
      if (differences.length > 0 && matchedByName) {
        matched.push({ ...base, differences, excelOffice: officeVal, dbOffice: match.Office, excelPosition: (entry as any).position || "", dbPosition: match.Position });
      } else if (differences.length > 0) {
        matchedDiff.push({ ...base, differences, excelOffice: officeVal, dbOffice: match.Office, excelPosition: (entry as any).position || "", dbPosition: match.Position });
      } else {
        matched.push(base);
      }
    } else {
      unmatched.push({
        _key: _key || "",
        rawName: nameVal,
        office: officeVal,
        position: positionVal || ""
      });
    }
  }

  return { matched, matchedDiff, unmatched };
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

// ── RBAC Permission Helper ──────────────────────────────────────────────
const PERMISSION_MAP: Record<string, string[]> = {
  Encoder: [
    "employee:view", "employee:create", "employee:edit",
    "seminar:view", "seminar:create", "seminar:edit", "seminar:import",
  ],
  Administrator: [
    "employee:view", "employee:create", "employee:edit", "employee:delete",
    "seminar:view", "seminar:create", "seminar:edit", "seminar:delete",
    "seminar:import", "seminar:year:delete", "seminar:attendee:delete",
    "import:data", "audit:view",
  ],
  "System developer": [
    "employee:view", "employee:create", "employee:edit", "employee:delete",
    "seminar:view", "seminar:create", "seminar:edit", "seminar:delete",
    "seminar:import", "seminar:year:delete", "seminar:attendee:delete",
    "import:data", "audit:view",
    "user:manage", "user:assign_role", "user:delete",
  ],
};

function getUserFromRequest(req: any): any {
  const userId = req.headers["x-user-id"] || req.body?._userId;
  if (!userId) return null;
  const db = readDatabase();
  const user = db.users.find((u: any) => String(u.id) === String(userId));
  if (!user || user.isActive === false) return null;
  return { id: user.id, username: user.username, role: user.role, name: user.name };
}

function requirePermission(...permissions: string[]) {
  return (req: any, res: any, next: any) => {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const userPerms = PERMISSION_MAP[user.role] || [];
    const hasAny = permissions.some(p => userPerms.includes(p));
    if (!hasAny) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    req._user = user;
    next();
  };
}

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

  if (user.isActive === false) {
    return res.status(403).json({ message: "Account is disabled. Contact an administrator." });
  }

  // Return user info
  return res.json({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    isActive: user.isActive !== false,
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

  createAuditLog({
    module: "User Management",
    action: "Password Changed",
    entity_type: "user",
    entity_id: db.users[userIndex].id,
    entity_name: db.users[userIndex].username,
    description: `User "${username}" changed their password`,
    performed_by: username,
  });

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

  createAuditLog({
    module: "User Management",
    action: "Password Reset",
    entity_type: "user",
    entity_id: db.users[userIndex].id,
    entity_name: db.users[userIndex].username,
    description: `Password reset for user "${username}" via developer code`,
    performed_by: "System (Dev Code)",
  });

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
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  writeDatabase(db);

  createAuditLog({
    module: "User Management",
    action: "User Registered",
    entity_type: "user",
    entity_id: newUser.id,
    entity_name: newUser.username,
    description: `New user registration: "${newUser.username}" (role: ${newUser.role})`,
    after_data: { username: newUser.username, role: newUser.role, isActive: true },
    performed_by: newUser.username,
  });

  return res.status(201).json({
    id: newUser.id,
    username: newUser.username,
    name: newUser.name,
    role: newUser.role,
    isActive: newUser.isActive,
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

  createAuditLog({
    module: "User Management",
    action: "Profile Picture Updated",
    entity_type: "user",
    entity_id: userId,
    entity_name: db.users[userIndex].username,
    description: `Profile picture updated for user "${db.users[userIndex].username}"`,
    performed_by: db.users[userIndex].username,
  });

  return res.json({ message: "Profile picture updated successfully" });
});

// ── User Management (System Developer only) ──────────────────────────────

// GET /api/users — List all users (exclude passwords)
app.get("/api/users", requirePermission("user:manage"), (req, res) => {
  const db = readDatabase();
  const users = db.users.map((u: any) => ({
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    profilePic: u.profilePic || null,
    isActive: u.isActive !== false,
    createdAt: u.createdAt || null,
  }));
  return res.json(users);
});

// GET /api/users/:id — Single user (exclude password)
app.get("/api/users/:id", requirePermission("user:manage"), (req, res) => {
  const db = readDatabase();
  const user = db.users.find((u: any) => String(u.id) === String(req.params.id));
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    profilePic: user.profilePic || null,
    isActive: user.isActive !== false,
    createdAt: user.createdAt || null,
  });
});

// POST /api/users — Create new user
app.post("/api/users", requirePermission("user:manage"), (req, res) => {
  const { username, password, name, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }
  const db = readDatabase();
  if (db.users.some((u: any) => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(400).json({ error: "Username already exists" });
  }
  const validRoles = ["Encoder", "Administrator", "System developer"];
  const assignedRole = validRoles.includes(role) ? role : "Encoder";
  const maxId = db.users.reduce((max: number, u: any) => (Math.max(max, u.id)), 0);
  const newUser = {
    id: maxId + 1,
    username: username.trim(),
    password,
    name: name || username.trim(),
    role: assignedRole,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  db.users.push(newUser);
  writeDatabase(db);
  createAuditLog({
    module: "User Management",
    action: "CREATE",
    entity_type: "user",
    entity_id: newUser.id,
    entity_name: newUser.username,
    description: `Created user "${newUser.username}" with role "${newUser.role}"`,
    after_data: { username: newUser.username, role: newUser.role, isActive: true },
    performed_by: req._user?.name || "System",
  });
  return res.status(201).json({
    id: newUser.id,
    username: newUser.username,
    name: newUser.name,
    role: newUser.role,
    isActive: newUser.isActive,
  });
});

// PUT /api/users/:id — Update user (name, role, password, isActive)
app.put("/api/users/:id", requirePermission("user:manage", "user:assign_role"), (req, res) => {
  const db = readDatabase();
  const idx = db.users.findIndex((u: any) => String(u.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "User not found" });
  const user = db.users[idx];
  const before = { ...user };

  if (req.body.name !== undefined) user.name = req.body.name;
  if (req.body.password !== undefined) user.password = req.body.password;
  if (req.body.isActive !== undefined) user.isActive = req.body.isActive;

  // Role change requires user:assign_role permission
  if (req.body.role !== undefined) {
    const userPerms = PERMISSION_MAP[req._user?.role] || [];
    if (!userPerms.includes("user:assign_role")) {
      return res.status(403).json({ error: "Insufficient permissions to change role" });
    }
    const validRoles = ["Encoder", "Administrator", "System developer"];
    if (!validRoles.includes(req.body.role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    user.role = req.body.role;
  }

  db.users[idx] = user;
  writeDatabase(db);
  createAuditLog({
    module: "User Management",
    action: "UPDATE",
    entity_type: "user",
    entity_id: user.id,
    entity_name: user.username,
    description: `Updated user "${user.username}"`,
    before_data: { username: before.username, role: before.role, isActive: before.isActive !== false },
    after_data: { username: user.username, role: user.role, isActive: user.isActive !== false },
    performed_by: req._user?.name || "System",
  });
  return res.json({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    isActive: user.isActive !== false,
  });
});

// DELETE /api/users/:id — Delete user
app.delete("/api/users/:id", requirePermission("user:delete"), (req, res) => {
  const db = readDatabase();
  const idx = db.users.findIndex((u: any) => String(u.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "User not found" });
  const user = db.users[idx];
  if (String(user.id) === String(req._user?.id)) {
    return res.status(400).json({ error: "Cannot delete your own account" });
  }
  db.users.splice(idx, 1);
  writeDatabase(db);
  createAuditLog({
    module: "User Management",
    action: "DELETE",
    entity_type: "user",
    entity_id: user.id,
    entity_name: user.username,
    description: `Deleted user "${user.username}"`,
    before_data: { username: user.username, role: user.role },
    performed_by: req._user?.name || "System",
  });
  return res.json({ message: "User deleted successfully" });
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
  const { search = "", office = "", limit = "" } = req.query;

  let results = [...db.employees];

  if (search) {
    const terms = (search as string).toLowerCase().split(/\s+/).filter(t => t.length > 0);
    if (terms.length > 0) {
      results = results.filter((emp) => {
        const searchString = `${emp.FirstName} ${emp.MiddleInitial || ""} ${emp.LastName} ${emp.Office || ""} ${emp.Position || ""}`.toLowerCase();
        const commaName = `${emp.LastName}, ${emp.FirstName}`.toLowerCase();
        const empId = String(emp.EmployeeID);
        return terms.every(term => searchString.includes(term) || commaName.includes(term) || empId.includes(term));
      });
    }
  }

  if (office) {
    const o = (office as string).toLowerCase();
    results = results.filter((emp) => emp.Office && emp.Office.toLowerCase().includes(o));
  }

  // Apply result limit if specified (e.g. ?limit=30)
  const maxResults = limit ? Math.min(parseInt(limit as string) || 50, 100) : 0;
  if (maxResults > 0) {
    results = results.slice(0, maxResults);
  }

  // Map employee with learning need count
  const resultsWithCount = results.map((emp) => {
    const needs = db.learningNeeds.filter((ln: any) => ln.EmployeeID === emp.EmployeeID);
    return {
      ...emp,
      needsCount: needs.length,
    };
  });

  return res.json({ employees: resultsWithCount });
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
  const attendeeRecords = (db.seminarAttendees || []).filter((sa: any) => sa.employeeId === id);
  const seminars = attendeeRecords.map((sa: any) => {
    const sem = (db.seminars || []).find((s: any) => s.id === sa.seminarId);
    return sem ? { id: sem.id, title: sem.title, year: sem.year, quarter: sem.quarter, date: sem.date } : null;
  }).filter(Boolean);

  return res.json({
    ...employee,
    needs,
    seminars,
  });
});

// 6. Create New Employee
app.post("/api/employees", (req, res) => {
  const { firstName, middleInitial, lastName, office, position, employmentType, employmentStatus, gender, dateOfAssumption, newlyHired, username = "system" } = req.body;

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
    NewlyHired: newlyHired || "N/A",
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

  createAuditLog({
    module: "Employee Management",
    action: "Employee Created",
    entity_type: "employee",
    entity_id: newEmployee.EmployeeID,
    entity_name: `${cleanLast}, ${cleanFirst}`,
    description: `Created employee ${cleanLast}, ${cleanFirst}`,
    after_data: newEmployee,
    performed_by: username,
  });

  return res.status(201).json(newEmployee);
});

// 7. Update Employee and Learning Needs in one transaction (Sync)
app.put("/api/employees/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { firstName, middleInitial, lastName, office, position, employmentType, employmentStatus, gender, dateOfAssumption, newlyHired, needs = [], username = "system" } = req.body;

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
    NewlyHired: newlyHired || oldEmp.NewlyHired || "N/A",
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

  // Build description of changes
  const changes: string[] = [];
  if (oldEmp.Office !== updatedEmployee.Office) changes.push(`Office changed: ${oldEmp.Office} → ${updatedEmployee.Office}`);
  if (oldEmp.Position !== updatedEmployee.Position) changes.push(`Position changed: ${oldEmp.Position} → ${updatedEmployee.Position}`);
  if (oldEmp.EmploymentStatus !== updatedEmployee.EmploymentStatus) changes.push(`Employment status changed: ${oldEmp.EmploymentStatus} → ${updatedEmployee.EmploymentStatus}`);
  createAuditLog({
    module: "Employee Management",
    action: "Employee Updated",
    entity_type: "employee",
    entity_id: id,
    entity_name: `${updatedEmployee.LastName}, ${updatedEmployee.FirstName}`,
    description: changes.length > 0 ? changes.join("; ") : `Updated employee ${updatedEmployee.LastName}, ${updatedEmployee.FirstName}`,
    before_data: oldEmp,
    after_data: updatedEmployee,
    performed_by: username,
  });

  return res.json({
    ...db.employees[employeeIndex],
    needs: db.learningNeeds.filter((ln: any) => ln.EmployeeID === id),
  });
});

// 8. Delete Employee (and cascade delete learning needs)
app.delete("/api/employees/:id", requirePermission("employee:delete"), (req, res) => {
  const id = parseInt(req.params.id);
  const db = readDatabase();

  const deletedEmp = db.employees.find((emp: any) => emp.EmployeeID === id);
  if (!deletedEmp) {
    return res.status(404).json({ message: "Employee not found" });
  }

  db.employees = db.employees.filter((emp: any) => emp.EmployeeID !== id);
  db.learningNeeds = db.learningNeeds.filter((ln: any) => ln.EmployeeID !== id);

  writeDatabase(db);

  createAuditLog({
    module: "Employee Management",
    action: "Employee Deleted",
    entity_type: "employee",
    entity_id: id,
    entity_name: `${deletedEmp.LastName}, ${deletedEmp.FirstName}`,
    description: `Deleted employee ${deletedEmp.LastName}, ${deletedEmp.FirstName}`,
    before_data: deletedEmp,
    performed_by: req.body?.username || "system",
  });

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
  const { search = "", office = "", learningNeed = "", employmentType = "", employmentStatus = "", newlyHired = "", hasNeeds = "", sortBy = "LastName", sortOrder = "asc" } = req.query;

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
          NewlyHired: emp.NewlyHired || "N/A",
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
        NewlyHired: emp.NewlyHired || "N/A",
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

  if (newlyHired) {
    const nh = (newlyHired as string).toLowerCase();
    results = results.filter((item) => item.NewlyHired && item.NewlyHired.toLowerCase() === nh);
  }

  if (hasNeeds === "true") {
    results = results.filter((item) => item.LearningNeedID !== null);
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

  const deletedLN = db.learningNeeds[lnIndex];
  db.learningNeeds.splice(lnIndex, 1);
  writeDatabase(db);

  const emp = db.employees.find((e: any) => e.EmployeeID === deletedLN.EmployeeID);
  createAuditLog({
    module: "Employee Management",
    action: "Learning Need Deleted",
    entity_type: "learning_need",
    entity_id: id,
    entity_name: deletedLN.LearningNeed,
    description: `Deleted learning need "${deletedLN.LearningNeed}" for employee ${emp ? `${emp.LastName}, ${emp.FirstName}` : `#${deletedLN.EmployeeID}`}`,
    before_data: deletedLN,
    performed_by: req.body?.username || "system",
  });

  return res.json({ message: "Learning need deleted successfully" });

  return res.json({ message: "Learning need deleted successfully" });
});

// 12. Excel Export using ExcelJS
app.get("/api/export/excel", async (req, res) => {
  const { employeeId, office, search, learningNeed, startDate, endDate, employmentType, employmentStatus, newlyHired, hasNeeds } = req.query;
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

  if (search) {
    const terms = (search as string).toLowerCase().split(/\s+/).filter((t: string) => t.length > 0);
    if (terms.length > 0) {
      results = results.filter((item) => {
        const searchString = `${item.FirstName} ${item.LastName} ${item.Office || ""} ${item.Position || ""}`.toLowerCase();
        return terms.every((term: string) => searchString.includes(term));
      });
    }
  }

  if (office) {
    const o = (office as string).toLowerCase();
    results = results.filter((item) => item.Office && item.Office.toLowerCase().includes(o));
  }

  if (learningNeed) {
    const lnVal = (learningNeed as string).toLowerCase();
    results = results.filter((item) => item.LearningNeed && item.LearningNeed.toLowerCase().includes(lnVal));
  }

  if (employmentType) {
    const et = (employmentType as string).toLowerCase();
    results = results.filter((item) => item.EmploymentType && item.EmploymentType.toLowerCase() === et);
  }

  if (employmentStatus) {
    const es = (employmentStatus as string).toLowerCase();
    results = results.filter((item) => item.EmploymentStatus && item.EmploymentStatus.toLowerCase() === es);
  }

  if (newlyHired) {
    const nh = (newlyHired as string).toLowerCase();
    const matchingEmpIds = db.employees
      .filter((emp: any) => emp.NewlyHired && emp.NewlyHired.toLowerCase() === nh)
      .map((emp: any) => emp.EmployeeID);
    results = results.filter((item) => matchingEmpIds.includes(item.EmployeeID));
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

  if (hasNeeds === "true") {
    results = results.filter((item) => item.LearningNeed !== "N/A");
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

// 13. Styled Excel Export (client sends filtered data, server formats it)
app.post("/api/export/excel-custom", async (req, res) => {
  const { records, title } = req.body;
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: "No records provided" });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ILDP Pangasinan";
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet("ILDP Records", {
    views: [{ state: "frozen", ySplit: 4 }],
  });

  // --- TITLE ROW ---
  const numCols = 12;
  const lastCol = String.fromCharCode(64 + numCols); // L for 12 cols
  worksheet.mergeCells(`A1`, `${lastCol}1`);
  const titleCell = worksheet.getCell("A1");
  titleCell.value = title || "INDIVIDUAL LEARNING AND DEVELOPMENT PLAN (ILDP) RECORDS";
  titleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
  worksheet.getRow(1).height = 40;

  // --- SUBTITLE ROW ---
  worksheet.mergeCells(`A2`, `${lastCol}2`);
  const subCell = worksheet.getCell("A2");
  const totalNeeds = records.reduce((sum: number, r: any) => sum + (r.needs?.length || (r.learningNeed ? 1 : 0)), 0);
  subCell.value = `Exported on: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} | Employees: ${records.length} | Total Learning Needs: ${totalNeeds}`;
  subCell.font = { name: "Arial", size: 10, italic: true, color: { argb: "FF64748B" } };
  subCell.alignment = { horizontal: "center", vertical: "middle" };
  subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  worksheet.getRow(2).height = 24;

  // --- SPACER ---
  worksheet.getRow(3).height = 6;

  // --- HEADER ROW ---
  const headers = [
    "No.", "Employee Name", "Office/Department", "Position",
    "Employment Type", "Employment Status", "Gender",
    "Date of Assumption", "Learning Need", "Basis",
    "Methodology", "Target Schedule",
  ];
  const headerRow = worksheet.addRow(headers);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3B82F6" } };
    cell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "medium" },
      right: { style: "thin" },
    };
  });

  // --- DATA ROWS ---
  let rowNum = 0;
  records.forEach((emp: any) => {
    const fullName = emp.name || `${emp.lastName || ""}, ${emp.firstName || ""} ${emp.middleInitial || ""}`.trim();
    const needs = emp.needs || (emp.learningNeed ? [{ learningNeed: emp.learningNeed, basis: emp.basis, methodology: emp.methodology, targetSchedule: emp.targetSchedule }] : []);

    if (needs.length === 0) {
      rowNum++;
      const row = worksheet.addRow([
        rowNum, fullName, emp.office || "", emp.position || "",
        emp.employmentType || "", emp.employmentStatus || "",
        emp.gender || "", emp.dateOfAssumption || "",
        "", "", "", "",
      ]);
      styleRow(row, rowNum);
    } else {
      needs.forEach((need: any) => {
        rowNum++;
        const row = worksheet.addRow([
          rowNum, fullName, emp.office || "", emp.position || "",
          emp.employmentType || "", emp.employmentStatus || "",
          emp.gender || "", emp.dateOfAssumption || "",
          need.learningNeed || "", need.basis || "",
          need.methodology || "", need.targetSchedule || "",
        ]);
        styleRow(row, rowNum);
      });
    }
  });

  function styleRow(row: ExcelJS.Row, idx: number) {
    row.height = 22;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
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
      if (idx % 2 === 0) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
      }
    });
  }

  // --- COLUMN WIDTHS ---
  worksheet.getColumn(1).width = 6;   // No.
  worksheet.getColumn(2).width = 30;  // Name
  worksheet.getColumn(3).width = 32;  // Office
  worksheet.getColumn(4).width = 28;  // Position
  worksheet.getColumn(5).width = 18;  // Employment Type
  worksheet.getColumn(6).width = 18;  // Employment Status
  worksheet.getColumn(7).width = 10;  // Gender
  worksheet.getColumn(8).width = 18;  // Date of Assumption
  worksheet.getColumn(9).width = 40;  // Learning Need
  worksheet.getColumn(10).width = 30; // Basis
  worksheet.getColumn(11).width = 30; // Methodology
  worksheet.getColumn(12).width = 22; // Target Schedule

  // --- AUTO-FILTER ---
  worksheet.autoFilter = { from: "A4", to: `${lastCol}4` };

  // Send file
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename=ILDP_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  await workbook.xlsx.write(res);
  res.end();
});

// ----------------------------------------------------
// EXCEL IMPORT ENDPOINTS
// ----------------------------------------------------
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

function cleanImportStr(str: string | null | undefined): string {
  if (!str) return "";
  return str.toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").replace(/\s+/g, "");
}

function normField(val: string | null | undefined): string {
  if (!val) return "";
  return val.toString().trim();
}

function parseExcelName(fullName: string) {
  const parts = fullName.split(",");
  if (parts.length < 2) {
    return { lastName: fullName.trim(), firstName: "", middleInitial: "", fullAfterComma: "" };
  }
  const lastName = parts[0].trim();
  const fullAfterComma = parts.slice(1).join(",").trim();
  const words = fullAfterComma.split(/\s+/);
  if (words.length > 1) {
    const lastWord = words[words.length - 1];
    if (lastWord.length === 1 || (lastWord.length === 2 && lastWord.endsWith("."))) {
      const mi = lastWord.replace(".", "") + ".";
      const first = words.slice(0, -1).join(" ");
      return { lastName, firstName: first, middleInitial: mi, fullAfterComma };
    } else {
      const mi = lastWord.charAt(0).toUpperCase() + ".";
      const first = words.slice(0, -1).join(" ");
      return { lastName, firstName: first, middleInitial: mi, fullMiddleName: lastWord, fullAfterComma };
    }
  } else {
    return { lastName, firstName: fullAfterComma, middleInitial: "", fullAfterComma };
  }
}

function isWordBoundaryPrefix(longer: string, shorter: string) {
  if (!longer.startsWith(shorter)) return false;
  return longer.length === shorter.length || longer.charAt(shorter.length) === " ";
}

interface ParsedExcelRow {
  lastName: string;
  firstName: string;
  middleInitial: string;
  position: string;
  employmentStatus: string;
  employmentType: string;
  office: string;
  gender: string;
  dateOfAssumption: string | undefined;
  rawName: string;
}

async function parseExcelBuffer(buffer: Buffer): Promise<ParsedExcelRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  const results: ParsedExcelRow[] = [];
  const processedNames = new Set<string>();
  let currentOffice = "";
  let currentCategory = "";

  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    const cell1 = row.getCell(1).value;
    const cell2 = row.getCell(2).value;

    if (cell1 !== null && cell1 !== undefined && typeof cell1 !== "number" && cell1 !== "No") {
      const text = cell1.toString().trim();
      const lower = text.toLowerCase();
      if (
        lower === "casual" ||
        lower.includes("permanent") ||
        lower === "consultant" ||
        lower.includes("job order") ||
        lower.includes("coterminous")
      ) {
        currentCategory = text;
      } else {
        currentOffice = text;
      }
    } else if (typeof cell1 === "number") {
      const rawName = cell2?.toString().trim();
      if (!rawName) continue;
      const lowerFullName = rawName.toLowerCase();
      if (processedNames.has(lowerFullName)) continue;
      processedNames.add(lowerFullName);

      const parsed = parseExcelName(rawName);
      const catLower = currentCategory.toLowerCase();
      let employmentType = "Undefined (Pending Review)";
      if (catLower.includes("job order")) employmentType = "Job Order";
      else if (catLower.includes("casual")) employmentType = "Casual";
      else if (catLower.includes("consultant")) employmentType = "Consultant";
      else if (catLower.includes("permanent")) employmentType = "Permanent";

      const position = row.getCell(3).value?.toString().trim() || "Undefined (Pending Review)";
      const employmentStatus = row.getCell(4).value?.toString().trim() || "Undefined (Pending Review)";
      const rawGender = row.getCell(5).value?.toString().trim();
      const gender = rawGender ? (rawGender === "Female" || rawGender === "Male" ? rawGender : "Undefined (Pending Review)") : "Undefined (Pending Review)";
      const rawDoa = row.getCell(7).value;
      const dateOfAssumption = (rawDoa instanceof Date) ? rawDoa.toISOString() : (rawDoa ? new Date(rawDoa as any).toISOString() : undefined);

      results.push({
        lastName: parsed.lastName,
        firstName: parsed.firstName,
        middleInitial: parsed.middleInitial,
        position,
        employmentStatus,
        employmentType,
        office: currentOffice,
        gender,
        dateOfAssumption,
        rawName,
      });
    }
  }
  return results;
}

function matchScore(dbEmp: any, excelRow: ParsedExcelRow): number {
  const dbLast = cleanImportStr(dbEmp.LastName);
  const excelLast = cleanImportStr(excelRow.lastName);
  if (dbLast !== excelLast) return 0;
  const dbFirst = cleanImportStr(dbEmp.FirstName);
  const excelFirst = cleanImportStr(excelRow.firstName);
  let nameScore = 0;
  if (dbFirst === excelFirst) nameScore = 100;
  else if (isWordBoundaryPrefix(dbFirst, excelFirst) || isWordBoundaryPrefix(excelFirst, dbFirst)) nameScore = 50;
  if (nameScore === 0) return 0;
  const dbOffice = cleanImportStr(dbEmp.Office);
  const excelOffice = cleanImportStr(excelRow.office);
  if (dbOffice === excelOffice) return nameScore + 10;
  const officePartial = dbOffice.startsWith(excelOffice) || excelOffice.startsWith(dbOffice);
  if (officePartial) return nameScore + 5;
  if (nameScore >= 50) {
    const dbPos = cleanImportStr(dbEmp.Position);
    const excelPos = cleanImportStr(excelRow.position);
    if (dbPos === excelPos) return nameScore;
    const dbES = cleanImportStr(dbEmp.EmploymentStatus);
    const excelES = cleanImportStr(excelRow.employmentStatus);
    if (dbES === excelES && (dbPos.startsWith(excelPos) || excelPos.startsWith(dbPos))) return nameScore;
    return 0;
  }
  return nameScore;
}

function findBestDbMatch(dbEmployees: any[], excelRow: ParsedExcelRow): any | null {
  let best: any = null;
  let bestScore = 0;
  for (const emp of dbEmployees) {
    const score = matchScore(emp, excelRow);
    if (score > bestScore) {
      bestScore = score;
      best = emp;
    }
  }
  if (bestScore === 0) return null;
  return best;
}

function fieldsDiffer(a: string | undefined, b: string | undefined): boolean {
  return normField(a) !== normField(b);
}

app.post("/api/import/preview", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const excelRows = await parseExcelBuffer(req.file.buffer);
    const db = readDatabase();
    const dbEmployees: any[] = db.employees || [];

    const matchedDbIds = new Set<number>();
    const toAdd: ParsedExcelRow[] = [];
    const toUpdate: any[] = [];

    for (const exRow of excelRows) {
      const match = findBestDbMatch(dbEmployees, exRow);
      if (match) {
        matchedDbIds.add(match.EmployeeID);
        const changes: any = {};
        if (fieldsDiffer(match.Position, exRow.position)) changes.Position = { old: match.Position || "", new: exRow.position };
        if (fieldsDiffer(match.EmploymentStatus, exRow.employmentStatus)) changes.EmploymentStatus = { old: match.EmploymentStatus || "", new: exRow.employmentStatus };
        if (fieldsDiffer(match.Office, exRow.office)) changes.Office = { old: match.Office || "", new: exRow.office };
        if (fieldsDiffer(match.Gender, exRow.gender)) changes.Gender = { old: match.Gender || "", new: exRow.gender };
        if (fieldsDiffer(match.EmploymentType, exRow.employmentType)) changes.EmploymentType = { old: match.EmploymentType || "", new: exRow.employmentType };
        if (exRow.dateOfAssumption && match.DateOfAssumption !== exRow.dateOfAssumption) {
          changes.DateOfAssumption = { old: match.DateOfAssumption || "", new: exRow.dateOfAssumption };
        }
        if (Object.keys(changes).length > 0) {
          toUpdate.push({
            employeeId: match.EmployeeID,
            name: `${match.LastName}, ${match.FirstName} ${match.MiddleInitial || ""}`.trim(),
            office: match.Office,
            changes,
          });
        }
      } else {
        toAdd.push(exRow);
      }
    }

    const toDelete = dbEmployees
      .filter((emp: any) => !matchedDbIds.has(emp.EmployeeID))
      .map((emp: any) => {
        const needsCount = (db.learningNeeds || []).filter((ln: any) => ln.EmployeeID === emp.EmployeeID).length;
        return {
          employeeId: emp.EmployeeID,
          name: `${emp.LastName}, ${emp.FirstName} ${emp.MiddleInitial || ""}`.trim(),
          office: emp.Office,
          needsCount,
        };
      });

    res.json({
      totalInExcel: excelRows.length,
      totalInDb: dbEmployees.length,
      stats: { toAdd: toAdd.length, toUpdate: toUpdate.length, toDelete: toDelete.length },
      toAdd,
      toUpdate,
      toDelete,
    });
  } catch (error: any) {
    console.error("Import preview error:", error);
    res.status(500).json({ error: "Failed to parse Excel file: " + error.message });
  }
});

app.post("/api/import/execute", requirePermission("import:data"), express.json({ limit: "50mb" }), async (req, res) => {
  try {
    const { toAdd, toUpdate, toDelete } = req.body;
    if (!Array.isArray(toAdd) || !Array.isArray(toUpdate) || !Array.isArray(toDelete)) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const db = readDatabase();
    const backupPath = DB_FILE + ".backup-" + Date.now();
    fs.copyFileSync(DB_FILE, backupPath);

    const currentTime = new Date().toISOString();
    const deleteIds = new Set<number>(toDelete.map((d: any) => d.employeeId));
    const updateMap = new Map<number, any>();
    for (const u of toUpdate) updateMap.set(u.employeeId, u);

    let createdCount = 0;
    let updatedCount = 0;
    let deletedCount = 0;

    // 1. Delete employees and their learning needs
    if (deleteIds.size > 0) {
      db.employees = db.employees.filter((emp: any) => {
        if (deleteIds.has(emp.EmployeeID)) { deletedCount++; return false; }
        return true;
      });
      db.learningNeeds = (db.learningNeeds || []).filter((ln: any) => !deleteIds.has(ln.EmployeeID));
    }

    // 2. Apply updates
    for (const emp of db.employees) {
      const update = updateMap.get(emp.EmployeeID);
      if (update) {
        if (update.changes.Position) emp.Position = update.changes.Position.new;
        if (update.changes.EmploymentStatus) emp.EmploymentStatus = update.changes.EmploymentStatus.new;
        if (update.changes.Office) emp.Office = update.changes.Office.new;
        if (update.changes.Gender) emp.Gender = update.changes.Gender.new;
        if (update.changes.EmploymentType) emp.EmploymentType = update.changes.EmploymentType.new;
        if (update.changes.DateOfAssumption) emp.DateOfAssumption = update.changes.DateOfAssumption.new;
        emp.UpdatedAt = currentTime;
        emp.UpdatedBy = "Excel Import";
        updatedCount++;
      }
    }

    // 3. Create new employees
    let maxId = db.employees.reduce((max: number, emp: any) => (emp.EmployeeID > max ? emp.EmployeeID : max), 0);
    for (const addRow of toAdd) {
      maxId++;
      const newEmp = {
        EmployeeID: maxId,
        FirstName: addRow.firstName,
        MiddleInitial: addRow.middleInitial,
        LastName: addRow.lastName,
        Office: addRow.office,
        Position: addRow.position,
        EmploymentType: addRow.employmentType,
        EmploymentStatus: addRow.employmentStatus,
        Gender: addRow.gender,
        DateOfAssumption: addRow.dateOfAssumption,
        CreatedAt: currentTime,
        UpdatedAt: currentTime,
        CreatedBy: "Excel Import",
        UpdatedBy: "Excel Import",
        StatusChangedAt: null,
        NewlyHired: "N/A",
      };
      db.employees.push(newEmp);
      ensureCustomOptionsExist(newEmp, [], db);
      createdCount++;
    }

    // 4. Update custom options for updated employees
    for (const u of toUpdate) {
      const emp = db.employees.find((e: any) => e.EmployeeID === u.employeeId);
      if (emp) ensureCustomOptionsExist(emp, [], db);
    }

    writeDatabase(db);

    createAuditLog({
      module: "Employee Import",
      action: "Excel Imported",
      entity_type: "employee_import",
      entity_id: null,
      entity_name: `Excel Import (${currentTime.slice(0, 10)})`,
      description: `Employee import completed: ${createdCount} created, ${updatedCount} updated, ${deletedCount} deleted`,
      after_data: { createdCount, updatedCount, deletedCount, timestamp: currentTime },
      performed_by: "Excel Import",
    });

    res.json({
      success: true,
      created: createdCount,
      updated: updatedCount,
      deleted: deletedCount,
      totalNow: db.employees.length,
      backup: backupPath,
    });
  } catch (error: any) {
    console.error("Import execute error:", error);
    res.status(500).json({ error: "Failed to execute import: " + error.message });
  }
});

// ----------------------------------------------------
// SEMINARS MODULE ENDPOINTS
// ----------------------------------------------------

// 1. Get all seminars
app.get("/api/seminars", (req, res) => {
  try {
    const db = readDatabase();
    const seminars = (db.seminars || []).map((sem: any) => {
      const attendeeMappings = (db.seminarAttendees || []).filter((sa: any) => sa.seminarId === sem.id);
      return { ...sem, attendees: attendeeMappings.map((sa: any) => ({ EmployeeID: sa.employeeId })) };
    });
    res.json(seminars);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 1b. Get all distinct seminar years with quarter and seminar counts
app.get("/api/seminars/years", (req, res) => {
  try {
    const db = readDatabase();
    const yearsMap = new Map<number, Record<string, number>>();
    // Include explicitly created years (even if no seminars)
    (db.seminarYears || []).forEach((yr: number) => {
      if (!yearsMap.has(yr)) yearsMap.set(yr, { Q1: 0, Q2: 0, Q3: 0, Q4: 0 });
    });
    // Aggregate years from actual seminars
    (db.seminars || []).forEach((sem: any) => {
      const yr = sem.year;
      if (!yearsMap.has(yr)) yearsMap.set(yr, { Q1: 0, Q2: 0, Q3: 0, Q4: 0 });
      const quarters = yearsMap.get(yr)!;
      if (sem.quarter && quarters[sem.quarter] !== undefined) {
        quarters[sem.quarter]++;
      }
    });
    const years = Array.from(yearsMap.entries())
      .map(([year, quarters]) => ({ year, quarters }))
      .sort((a, b) => b.year - a.year);
    res.json({ years });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 1c. Create a new seminar year
app.post("/api/seminars/years", (req, res) => {
  try {
    const { year } = req.body;
    if (!year || typeof year !== "number") {
      return res.status(400).json({ error: "Valid numeric 'year' is required." });
    }
    if (year < 2020 || year > 2100) {
      return res.status(400).json({ error: "Year must be between 2020 and 2100." });
    }
    const db = readDatabase();
    if (!db.seminarYears) db.seminarYears = [];
    if (db.seminarYears.includes(year)) {
      return res.status(409).json({ error: `Year ${year} already exists.` });
    }
    db.seminarYears.push(year);
    db.seminarYears.sort((a: number, b: number) => b - a);
    writeDatabase(db);

    createAuditLog({
      module: "Seminar Module",
      action: "Year Created",
      entity_type: "seminar_year",
      entity_id: year,
      entity_name: `Year ${year}`,
      description: `Created seminar year ${year}`,
      performed_by: req.body?.username,
    });

    res.json({ success: true, year });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 1d. Delete a seminar year and all its seminars + attendees
app.delete("/api/seminars/years/:year", requirePermission("seminar:year:delete"), (req, res) => {
  try {
    const year = parseInt(req.params.year);
    if (isNaN(year)) return res.status(400).json({ error: "Invalid year." });

    const db = readDatabase();
    const seminarsToRemove = (db.seminars || []).filter((s: any) => s.year === year);
    const semIds = seminarsToRemove.map((s: any) => s.id);
    const attendeeCount = (db.seminarAttendees || []).filter((sa: any) => semIds.includes(sa.seminarId)).length;

    db.seminars = (db.seminars || []).filter((s: any) => s.year !== year);
    db.seminarAttendees = (db.seminarAttendees || []).filter((sa: any) => !semIds.includes(sa.seminarId));
    db.seminarYears = (db.seminarYears || []).filter((y: number) => y !== year);
    writeDatabase(db);

    createAuditLog({
      module: "Seminar Module",
      action: "Year Deleted",
      entity_type: "seminar_year",
      entity_id: year,
      entity_name: `Year ${year}`,
      description: `Deleted year ${year} with ${seminarsToRemove.length} seminars and ${attendeeCount} attendee associations`,
      before_data: { year, seminarsRemoved: seminarsToRemove.length, attendeeAssociationsRemoved: attendeeCount },
      performed_by: req.body?.username,
    });

    res.json({
      success: true,
      year,
      seminarsRemoved: seminarsToRemove.length,
      attendeeAssociationsRemoved: attendeeCount,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 1e. Get year details with seminar count
app.get("/api/seminars/years/:year", (req, res) => {
  try {
    const year = parseInt(req.params.year);
    if (isNaN(year)) return res.status(400).json({ error: "Invalid year." });
    const db = readDatabase();
    const seminarsInYear = (db.seminars || []).filter((s: any) => s.year === year);
    const semIds = seminarsInYear.map((s: any) => s.id);
    const attendeeCount = (db.seminarAttendees || []).filter((sa: any) => semIds.includes(sa.seminarId)).length;
    res.json({
      year,
      seminarsRemoved: seminarsInYear.length,
      attendeeAssociationsRemoved: attendeeCount,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get specific seminar and its attendee list with full employee details
app.get("/api/seminars/:id", (req, res) => {
  try {
    const db = readDatabase();
    const sem = (db.seminars || []).find((s: any) => s.id === req.params.id);
    if (!sem) {
      res.status(404).json({ error: "Seminar not found" });
      return;
    }

    const attendeeMappings = (db.seminarAttendees || []).filter((sa: any) => sa.seminarId === sem.id);
    const attendees = attendeeMappings.map((sa: any) => {
      if (sa.participantType === "external") {
        return {
          id: sa.id,
          EmployeeID: null,
          participantType: "external",
          displayName: sa.displayName || "External Participant",
          organization: sa.organization || "",
          role: sa.role || "",
          remarks: sa.remarks || "",
          FirstName: sa.displayName || "External",
          MiddleInitial: "",
          LastName: "Participant",
          Office: sa.organization || "External",
          Position: sa.role || ""
        };
      }
      const emp = (db.employees || []).find((e: any) => e.EmployeeID === sa.employeeId);
      return {
        id: sa.id,
        EmployeeID: sa.employeeId,
        participantType: "employee",
        displayName: "",
        organization: "",
        role: "",
        remarks: "",
        FirstName: emp ? emp.FirstName : "Unknown",
        MiddleInitial: emp ? emp.MiddleInitial : "",
        LastName: emp ? emp.LastName : "Employee",
        Office: emp ? emp.Office : "N/A",
        Position: emp ? emp.Position : "N/A"
      };
    });

    res.json({
      id: sem.id,
      title: sem.title,
      year: sem.year,
      quarter: sem.quarter,
      date: sem.date || "",
      location: sem.location || "",
      speaker: sem.speaker || "",
      remarks: sem.remarks || "",
      createdAt: sem.createdAt,
      attendees
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Delete seminar and associated mappings
app.delete("/api/seminars/:id", requirePermission("seminar:delete"), (req, res) => {
  try {
    const db = readDatabase();
    const deletedSem = (db.seminars || []).find((s: any) => s.id === req.params.id);
    const attendeeCount = (db.seminarAttendees || []).filter((sa: any) => sa.seminarId === req.params.id).length;
    db.seminars = (db.seminars || []).filter((s: any) => s.id !== req.params.id);
    db.seminarAttendees = (db.seminarAttendees || []).filter((sa: any) => sa.seminarId !== req.params.id);
    writeDatabase(db);

    if (deletedSem) {
      createAuditLog({
        module: "Seminar Module",
        action: "Seminar Deleted",
        entity_type: "seminar",
        entity_id: req.params.id,
        entity_name: deletedSem.title,
        description: `Deleted seminar "${deletedSem.title}" (${deletedSem.year} ${deletedSem.quarter}) with ${attendeeCount} attendees`,
        before_data: deletedSem,
        performed_by: req.body?.username,
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Excel Import Preview
app.post("/api/seminars/import-preview", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    // Load file and find sheet
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const sheet = workbook.worksheets[0];

    // Attempt to parse seminar metadata from sheet headers
    // Look at rows 1-6 for something like OVDS and March 23-24, 2026
    let parsedTitle = "";
    let parsedYear = 2026;
    let parsedDate = "";
    let parsedQuarter = "Q2"; // Default fallback

    // Fallback title from original filename
    const origName = req.file.originalname || "";
    const cleanOrigName = origName.replace(/\.xlsx$/i, "").replace(/[-_]+/g, " ");

    // Check path or filename first for Quarter indicators
    const lowerName = cleanOrigName.toLowerCase();
    if (lowerName.includes("1st quarter") || lowerName.includes("q1")) parsedQuarter = "Q1";
    else if (lowerName.includes("2nd quarter") || lowerName.includes("q2")) parsedQuarter = "Q2";
    else if (lowerName.includes("3rd quarter") || lowerName.includes("q3")) parsedQuarter = "Q3";
    else if (lowerName.includes("4th quarter") || lowerName.includes("q4")) parsedQuarter = "Q4";

    for (let r = 1; r <= Math.min(10, sheet.rowCount); r++) {
      const row = sheet.getRow(r);
      for (let c = 1; c <= 10; c++) {
        const val = row.getCell(c).value?.toString().trim();
        if (val) {
          if (val.includes("PROVINCE OF") || val.includes("HUMAN RESOURCE")) continue;
          if (val.length > 3 && val.length < 150) {
            // Find year in text
            const yrMatch = val.match(/\b(20\d{2})\b/);
            if (yrMatch) {
              parsedYear = parseInt(yrMatch[1], 10);
            }
            // Find month date to resolve Quarter
            // e.g. "MARCH 23-24.2026", "April 22-23 2026"
            const monthMatches = val.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\b/i);
            if (monthMatches) {
              const m = monthMatches[1].toLowerCase();
              if (["january", "february", "march", "jan", "feb", "mar"].some(x => m.startsWith(x))) parsedQuarter = "Q1";
              else if (["april", "may", "june", "apr", "jun"].some(x => m.startsWith(x))) parsedQuarter = "Q2";
              else if (["july", "august", "september", "jul", "aug", "sep"].some(x => m.startsWith(x))) parsedQuarter = "Q3";
              else if (["october", "november", "december", "oct", "nov", "dec"].some(x => m.startsWith(x))) parsedQuarter = "Q4";
            }
            if (!parsedTitle && val.length > 5) {
              parsedTitle = val;
            } else if (parsedTitle && parsedTitle !== val && val.length > 5) {
              parsedTitle = parsedTitle + " - " + val;
            }
          }
        }
      }
    }

    if (!parsedTitle) {
      parsedTitle = cleanOrigName;
    }

    // Find the header row (contains "NAMES", "No.", "EMPLOYEE", "ID", "NAME")
    let headerRowIdx = 7;
    let idCol = -1;
    let nameCol = -1;
    let officeCol = -1;
    let positionCol = -1;
    for (let i = 1; i <= Math.min(20, sheet.rowCount); i++) {
      const row = sheet.getRow(i);
      const vals = row.values;
      for (let c = 1; c <= Math.min(vals.length, 10); c++) {
        const v = vals[c]?.toString()?.toLowerCase()?.trim() || "";
        if (v.includes("employee") && v.includes("id")) idCol = c;
        if (v.includes("employee") && v.includes("no")) idCol = c;
        if (v === "id" && idCol < 0) idCol = c;
        if (v.includes("names") || v.includes("name of") || v === "name") nameCol = c;
        if (v.includes("office") || v.includes("department") || v.includes("division")) officeCol = c;
        if (v.includes("position") || v.includes("designation") || v.includes("title")) positionCol = c;
      }
      const isHeader = vals.some((v: any) => v && typeof v === "string" && v.toLowerCase().includes("names"));
      if (isHeader) {
        headerRowIdx = i;
        break;
      }
    }
    // If no explicit name column found, default to column 2
    if (nameCol < 0) nameCol = 2;

    const db = readDatabase();
    const dbEmployees: any[] = db.employees || [];
    const rawEmployees: { rawName: string; office: string; position?: string; employeeId?: string; _key: string }[] = [];

    // Detect where the data table ends: stop at 2+ consecutive empty rows
    // or a row whose name column contains a summary/signatory keyword
    let tableEndRow = sheet.rowCount;
    {
      let emptyRun = 0;
      for (let i = headerRowIdx + 1; i <= sheet.rowCount; i++) {
        const row = sheet.getRow(i);
        const trackedCols = [nameCol, idCol, officeCol].filter((c) => c > 0);
        const hasAnyContent = trackedCols.some((c) => {
            const v = row.getCell(c).value;
            return v !== null && v !== undefined && v !== "";
          });
        if (!hasAnyContent) {
          emptyRun++;
          if (emptyRun >= 2) {
            tableEndRow = i - emptyRun;
            break;
          }
        } else {
          emptyRun = 0;
          // Check for terminator rows (summary, signatory)
          const cn = row.getCell(nameCol).value;
          if (cn && typeof cn === "string") {
            const lower = cn.toString().toLowerCase().trim();
            if (/^(total|subtotal|grand\s*total|prepared\s+by|approved\s+by|noted\s+by|attested\s+by|certified\s+by|verified\s+by|received\s+by)/i.test(lower)) {
              tableEndRow = i - 1;
              break;
            }
          }
        }
      }
    }

    for (let i = headerRowIdx + 1; i <= tableEndRow; i++) {
      const row = sheet.getRow(i);
      const cellId = idCol > 0 ? row.getCell(idCol).value : null;
      const cellName = row.getCell(nameCol).value;
      const cellOffice = officeCol > 0 ? row.getCell(officeCol).value : null;
      const cellPosition = positionCol > 0 ? row.getCell(positionCol).value : null;

      // Only use the identified name column — no fallback scan of other cells
      let nameVal = "";
      let officeVal = "";
      let positionVal = "";

      if (cellName && typeof cellName === "string" && cellName.trim().length > 3) {
        nameVal = cellName.trim();
      }
      if (!nameVal) continue;

      if (cellOffice && typeof cellOffice === "string") officeVal = cellOffice.trim();
      if (cellPosition && typeof cellPosition === "string") positionVal = cellPosition.trim();

      // Reject values that don't look like real person names
      if (!isLikelyPersonName(nameVal)) continue;

      const normName = normalizeText(nameVal);
      // Deduplicate same normalized names within the same file
      const alreadyParsed = rawEmployees.some((r) => normalizeText(r.rawName) === normName);
      if (alreadyParsed) continue;

      rawEmployees.push({
        rawName: nameVal,
        office: officeVal,
        position: positionVal,
        employeeId: cellId?.toString()?.trim() || undefined,
        _key: `emp_${i}_${normalizeText(nameVal).slice(0, 20)}`
      });
    }

    const { matched, matchedDiff, unmatched } = matchEmployees(rawEmployees, dbEmployees);

    res.json({
      title: parsedTitle,
      year: parsedYear,
      quarter: parsedQuarter,
      date: parsedDate,
      totalParsed: matched.length + matchedDiff.length + unmatched.length,
      matched,
      matchedDiff,
      unmatched,
      rawEmployees,
      reviewRecommended: matchedDiff.length > 0 || unmatched.length > 0
    });
  } catch (error: any) {
    console.error("Seminar import preview error:", error);
    res.status(500).json({ error: "Failed to preview seminar Excel: " + error.message });
  }
});

// 4b. Re-run employee matching against current database (for live updates)
app.post("/api/seminars/import-reprocess", requirePermission("seminar:import"), (req, res) => {
  try {
    const { employees } = req.body;
    if (!Array.isArray(employees)) {
      res.status(400).json({ error: "Missing employees array" });
      return;
    }

    const db = readDatabase();
    const dbEmployees: any[] = db.employees || [];
    const { matched, matchedDiff, unmatched } = matchEmployees(employees, dbEmployees);

    createAuditLog({
      module: "Seminar Import",
      action: "Employee Matched",
      entity_type: "seminar_import",
      entity_id: null,
      entity_name: `Reprocessed matching (${matched.length + matchedDiff.length} matched, ${unmatched.length} unmatched)`,
      description: `Reprocessed employee matching: ${matched.length} exact matches, ${matchedDiff.length} with differences, ${unmatched.length} unmatched`,
      after_data: { matchedCount: matched.length, matchedDiffCount: matchedDiff.length, unmatchedCount: unmatched.length },
      performed_by: "System (Development Mode)",
    });

    res.json({
      totalParsed: matched.length + matchedDiff.length + unmatched.length,
      matched,
      matchedDiff,
      unmatched,
      reviewRecommended: matchedDiff.length > 0 || unmatched.length > 0
    });
  } catch (error: any) {
    console.error("Seminar import reprocess error:", error);
    res.status(500).json({ error: "Failed to reprocess employee matching: " + error.message });
  }
});

// 5. Excel Import Execute
app.post("/api/seminars/import-execute", requirePermission("seminar:import"), (req, res) => {
  try {
    const { title, year, quarter, date, location, remarks, matched, matchedDiff, unmatched, externalParticipants } = req.body;
    if (!title || !year || !quarter) {
      res.status(400).json({ error: "Title, year and quarter are required" });
      return;
    }

    const db = readDatabase();
    
    // Check for existing seminar with same name, year, and quarter to ensure idempotency
    let sem = (db.seminars || []).find((s: any) => s.title.toLowerCase().trim() === title.toLowerCase().trim() && s.year === Number(year) && s.quarter === quarter);
    if (!sem) {
      sem = {
        id: "sem_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        title,
        year: Number(year),
        quarter,
        date: date || "",
        location: location || "",
        remarks: remarks || "",
        createdAt: new Date().toISOString()
      };
      db.seminars.push(sem);
    }

    let attendeesAdded = 0;
    let duplicatesSkipped = 0;

    const addAttendee = (empId: number) => {
      const exists = (db.seminarAttendees || []).some((sa: any) => sa.seminarId === sem.id && sa.employeeId === empId);
      if (!exists) {
        db.seminarAttendees.push({
          id: "sa_" + Date.now() + "_" + Math.floor(Math.random() * 100000),
          seminarId: sem.id,
          employeeId: empId,
          participantType: "employee",
          displayName: "",
          organization: "",
          role: "",
          remarks: "",
          createdAt: new Date().toISOString()
        });
        attendeesAdded++;
      } else {
        duplicatesSkipped++;
      }
    };

    // 1. Process matched
    if (Array.isArray(matched)) {
      matched.forEach((m: any) => {
        if (m.EmployeeID) {
          addAttendee(Number(m.EmployeeID));
        }
      });
    }

    // 2. Process matched with differences
    if (Array.isArray(matchedDiff)) {
      matchedDiff.forEach((m: any) => {
        if (m.EmployeeID) {
          addAttendee(Number(m.EmployeeID));
        }
      });
    }

    // 3. Process unmatched containing administrative overrides
    if (Array.isArray(unmatched)) {
      unmatched.forEach((u: any) => {
        if (u.EmployeeID) {
          addAttendee(Number(u.EmployeeID));
        }
      });
    }

    // 4. Process external participants
    if (Array.isArray(externalParticipants)) {
      externalParticipants.forEach((ep: any) => {
        db.seminarAttendees.push({
          id: "sa_" + Date.now() + "_" + Math.floor(Math.random() * 100000),
          seminarId: sem.id,
          employeeId: null,
          participantType: "external",
          displayName: ep.displayName || ep.rawName || "External Participant",
          organization: ep.organization || "",
          role: ep.role || "",
          remarks: ep.remarks || "",
          createdAt: new Date().toISOString()
        });
        attendeesAdded++;
      });
    }

    // Audit log for name-matched-with-metadata-differences attendees
    if (Array.isArray(matched)) {
      matched.filter((m: any) => m.differences?.length > 0).forEach((m: any) => {
        const diffFields = (m.differences || []).join(", ");
        createAuditLog({
          module: "Seminar Import",
          action: "Name Match with Metadata Difference",
          entity_type: "employee",
          entity_id: m.EmployeeID,
          entity_name: `${m.LastName}, ${m.FirstName}`,
          description: `Seminar attendee "${m.rawName}" matched to employee by name despite differences in ${diffFields}.`,
          after_data: { seminar: sem.title, rawName: m.rawName, employeeId: m.EmployeeID, differences: m.differences, excelOffice: m.excelOffice, dbOffice: m.dbOffice, excelPosition: m.excelPosition, dbPosition: m.dbPosition },
          performed_by: req.body?.username,
        });
      });
    }

    writeDatabase(db);

    // Log the import event with details
    const externalCount = (externalParticipants || []).length;
    const matchedCount = (matched || []).length;
    const matchedDiffCount = (matchedDiff || []).length;
    const unmatchedCount = (unmatched || []).length;
    const matchedWithWarningsCount = (matched || []).filter((m: any) => m.differences?.length > 0).length;
    let description = `Imported seminar "${sem.title}" — ${attendeesAdded} attendees added (${matchedCount} matched, ${matchedDiffCount} matched-diff, ${unmatchedCount} unmatched, ${externalCount} external)`;
    if (matchedWithWarningsCount > 0) {
      description += `. ${matchedWithWarningsCount} attendee(s) matched by name despite metadata differences (Office, Position, etc.).`;
    }
    createAuditLog({
      module: "Seminar Import",
      action: "Import Completed",
      entity_type: "seminar",
      entity_id: sem.id,
      entity_name: sem.title,
      description,
      after_data: { title: sem.title, year: sem.year, quarter: sem.quarter, attendeesAdded, duplicatesSkipped, matchedCount, matchedDiffCount, matchedWithWarningsCount, unmatchedCount, externalCount },
      performed_by: req.body?.username,
    });

    res.json({
      success: true,
      seminarId: sem.id,
      attendeesAdded,
      duplicatesSkipped,
      totalAttendees: (db.seminarAttendees || []).filter((sa: any) => sa.seminarId === sem.id).length
    });
  } catch (error: any) {
    console.error("Seminar import execute error:", error);
    res.status(500).json({ error: "Failed to execute seminar import: " + error.message });
  }
});

// 6. Manual Create Seminar
app.post("/api/seminars", (req, res) => {
  try {
    const { title, year, quarter, date, location, speaker, remarks } = req.body;
    if (!title || !year || !quarter) {
      res.status(400).json({ error: "Title, year, and quarter are required." });
      return;
    }

    const db = readDatabase();
    const sem = {
      id: "sem_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      title,
      year: Number(year),
      quarter,
      date: date || "",
      location: location || "",
      speaker: speaker || "",
      remarks: remarks || "",
      createdAt: new Date().toISOString()
    };
    db.seminars.push(sem);
    writeDatabase(db);

    createAuditLog({
      module: "Seminar Module",
      action: "Seminar Created",
      entity_type: "seminar",
      entity_id: sem.id,
      entity_name: sem.title,
      description: `Created seminar "${sem.title}" (${sem.year} ${sem.quarter})`,
      after_data: sem,
      performed_by: req.body?.username,
    });

    res.json(sem);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Update Seminar Metadata
app.put("/api/seminars/:id", (req, res) => {
  try {
    const { title, year, quarter, date, location, speaker, remarks } = req.body;
    const db = readDatabase();
    const sem = db.seminars.find((s: any) => s.id === req.params.id);
    if (!sem) {
      res.status(404).json({ error: "Seminar not found" });
      return;
    }

    const oldSem = { ...sem };
    if (title !== undefined) sem.title = title;
    if (year !== undefined) sem.year = Number(year);
    if (quarter !== undefined) sem.quarter = quarter;
    if (date !== undefined) sem.date = date;
    if (location !== undefined) sem.location = location;
    if (speaker !== undefined) sem.speaker = speaker;
    if (remarks !== undefined) sem.remarks = remarks;

    writeDatabase(db);

    createAuditLog({
      module: "Seminar Module",
      action: "Seminar Edited",
      entity_type: "seminar",
      entity_id: sem.id,
      entity_name: sem.title,
      description: `Edited seminar "${sem.title}"`,
      before_data: oldSem,
      after_data: { ...sem },
      performed_by: req.body?.username,
    });

    res.json(sem);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Add multiple attendees to a seminar (batch mapping link)
app.post("/api/seminars/:id/attendees", (req, res) => {
  try {
    const { employeeIds } = req.body;
    if (!Array.isArray(employeeIds)) {
      res.status(400).json({ error: "employeeIds array is required." });
      return;
    }

    const db = readDatabase();
    const sem = db.seminars.find((s: any) => s.id === req.params.id);
    if (!sem) {
      res.status(404).json({ error: "Seminar not found." });
      return;
    }

    let addedCount = 0;
    employeeIds.forEach((empId: number) => {
      const exists = db.seminarAttendees.some((sa: any) => sa.seminarId === sem.id && sa.employeeId === Number(empId));
      if (!exists) {
        db.seminarAttendees.push({
          id: "sa_" + Date.now() + "_" + Math.floor(Math.random() * 100000),
          seminarId: sem.id,
          employeeId: Number(empId),
          createdAt: new Date().toISOString()
        });
        addedCount++;
      }
    });

    writeDatabase(db);

    const empNames = employeeIds.map((eid: number) => {
      const emp = db.employees.find((e: any) => e.EmployeeID === eid);
      return emp ? `${emp.LastName}, ${emp.FirstName}` : `Employee #${eid}`;
    });
    createAuditLog({
      module: "Seminar Module",
      action: "Attendee Added",
      entity_type: "seminar",
      entity_id: req.params.id,
      entity_name: sem?.title || "Unknown",
      description: `Added ${addedCount} attendees to seminar "${sem?.title || "Unknown"}"`,
      after_data: { seminarId: req.params.id, employeeIds, employeeNames: empNames, addedCount },
      performed_by: req.body?.username,
    });

    res.json({ success: true, addedCount });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Remove single attendee association link
app.delete("/api/seminars/:id/attendees/:employeeId", requirePermission("seminar:attendee:delete"), (req, res) => {
  try {
    const db = readDatabase();
    const sem = db.seminars.find((s: any) => s.id === req.params.id);
    const removedAttendee = db.seminarAttendees.find(
      (sa: any) => sa.seminarId === req.params.id && sa.employeeId === Number(req.params.employeeId)
    );
    const emp = removedAttendee?.employeeId ? db.employees.find((e: any) => e.EmployeeID === removedAttendee.employeeId) : null;
    const beforeCount = db.seminarAttendees.length;
    db.seminarAttendees = db.seminarAttendees.filter(
      (sa: any) => !(sa.seminarId === req.params.id && sa.employeeId === Number(req.params.employeeId))
    );
    writeDatabase(db);

    if (beforeCount > db.seminarAttendees.length) {
      createAuditLog({
        module: "Seminar Module",
        action: "Attendee Removed",
        entity_type: "seminar",
        entity_id: req.params.id,
        entity_name: sem?.title || "Unknown",
        description: emp
          ? `Removed attendee ${emp.LastName}, ${emp.FirstName} from seminar "${sem?.title || "Unknown"}"`
          : `Removed attendee from seminar "${sem?.title || "Unknown"}"`,
        before_data: { attendeeId: removedAttendee?.id, employeeId: req.params.employeeId },
        performed_by: req.body?.username,
      });
    }

    res.json({ success: true, removed: beforeCount - db.seminarAttendees.length > 0 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Update attendee (participant type, name, organization, role, remarks)
app.put("/api/seminars/:id/attendees/:attendeeId", (req, res) => {
  try {
    const { participantType, displayName, organization, role, remarks, employeeId } = req.body;
    const db = readDatabase();
    const attendee = (db.seminarAttendees || []).find(
      (sa: any) => sa.seminarId === req.params.id && sa.id === req.params.attendeeId
    );
    if (!attendee) {
      res.status(404).json({ error: "Attendee not found" });
      return;
    }

    const oldAttendee = { ...attendee };
    if (participantType !== undefined) attendee.participantType = participantType;
    if (displayName !== undefined) attendee.displayName = displayName;
    if (organization !== undefined) attendee.organization = organization;
    if (role !== undefined) attendee.role = role;
    if (remarks !== undefined) attendee.remarks = remarks;
    if (employeeId !== undefined) attendee.employeeId = employeeId;

    writeDatabase(db);

    const sem = db.seminars.find((s: any) => s.id === req.params.id);
    const isExternalChange = oldAttendee.participantType !== attendee.participantType && attendee.participantType === "external";
    if (isExternalChange) {
      createAuditLog({
        module: "Seminar Import",
        action: "Employee Marked as External Participant",
        entity_type: "seminar",
        entity_id: req.params.id,
        entity_name: sem?.title || "Unknown",
        description: `Marked attendee "${attendee.displayName || oldAttendee.displayName || "Unknown"}" as External Participant in seminar "${sem?.title || "Unknown"}"`,
        before_data: oldAttendee,
        after_data: { ...attendee },
        performed_by: req.body?.username,
      });
    } else {
      createAuditLog({
        module: "Seminar Module",
        action: "Imported Attendee Edited",
        entity_type: "seminar",
        entity_id: req.params.id,
        entity_name: sem?.title || "Unknown",
        description: `Updated attendee in seminar "${sem?.title || "Unknown"}"`,
        before_data: oldAttendee,
        after_data: { ...attendee },
        performed_by: req.body?.username,
      });
    }

    res.json({ success: true, attendee });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 11. Remove attendee by attendee ID (not employee ID)
app.delete("/api/seminars/:id/attendees/by-attendee/:attendeeId", requirePermission("seminar:attendee:delete"), (req, res) => {
  try {
    const db = readDatabase();
    const sem = db.seminars.find((s: any) => s.id === req.params.id);
    const removedAttendee = (db.seminarAttendees || []).find(
      (sa: any) => sa.seminarId === req.params.id && sa.id === req.params.attendeeId
    );
    const beforeCount = db.seminarAttendees.length;
    db.seminarAttendees = db.seminarAttendees.filter(
      (sa: any) => !(sa.seminarId === req.params.id && sa.id === req.params.attendeeId)
    );
    writeDatabase(db);

    if (beforeCount > db.seminarAttendees.length) {
      createAuditLog({
        module: "Seminar Module",
        action: "Attendee Removed",
        entity_type: "seminar",
        entity_id: req.params.id,
        entity_name: sem?.title || "Unknown",
        description: `Removed attendee from seminar "${sem?.title || "Unknown"}"`,
        before_data: { attendeeId: req.params.attendeeId },
        performed_by: req.body?.username,
      });
    }

    res.json({ success: true, removed: beforeCount - db.seminarAttendees.length > 0 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// AUDIT LOG API ENDPOINTS
// ----------------------------------------------------

// List audit logs with filters
app.get("/api/audit-logs", requirePermission("audit:view"), (req, res) => {
  try {
    const db = readDatabase();
    let logs = [...db.auditLogs];

    // Filter by module
    if (req.query.module) {
      logs = logs.filter((l: any) => l.module === req.query.module);
    }
    // Filter by action
    if (req.query.action) {
      logs = logs.filter((l: any) => l.action === req.query.action);
    }
    // Filter by entity_type
    if (req.query.entity_type) {
      logs = logs.filter((l: any) => l.entity_type === req.query.entity_type);
    }
    // Filter by date range (YYYY-MM-DD)
    if (req.query.date_from) {
      const from = new Date(req.query.date_from as string).getTime();
      logs = logs.filter((l: any) => new Date(l.timestamp).getTime() >= from);
    }
    if (req.query.date_to) {
      const to = new Date(req.query.date_to as string).getTime() + 86400000;
      logs = logs.filter((l: any) => new Date(l.timestamp).getTime() <= to);
    }
    // Filter by performed_by
    if (req.query.performed_by) {
      logs = logs.filter((l: any) =>
        (l.performed_by || "").toLowerCase().includes((req.query.performed_by as string).toLowerCase())
      );
    }
    // Search keyword across entity_name, description, entity_type
    if (req.query.search) {
      const q = (req.query.search as string).toLowerCase();
      logs = logs.filter((l: any) =>
        (l.entity_name || "").toLowerCase().includes(q) ||
        (l.description || "").toLowerCase().includes(q) ||
        (l.entity_type || "").toLowerCase().includes(q) ||
        (l.action || "").toLowerCase().includes(q)
      );
    }

    // Sort newest first
    logs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const total = logs.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedLogs = logs.slice(offset, offset + limit);

    // Parse JSON before_data/after_data for client
    const parsedLogs = paginatedLogs.map((l: any) => ({
      ...l,
      before_data: l.before_data ? JSON.parse(l.before_data) : null,
      after_data: l.after_data ? JSON.parse(l.after_data) : null,
    }));

    res.json({
      logs: parsedLogs,
      pagination: { page, limit, total, totalPages },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single audit log
app.get("/api/audit-logs/:id", requirePermission("audit:view"), (req, res) => {
  try {
    const db = readDatabase();
    const log = db.auditLogs.find((l: any) => l.id === parseInt(req.params.id));
    if (!log) return res.status(404).json({ error: "Log not found" });
    res.json({
      ...log,
      before_data: log.before_data ? JSON.parse(log.before_data) : null,
      after_data: log.after_data ? JSON.parse(log.after_data) : null,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create audit log (internal endpoint)
app.post("/api/audit-logs", (req, res) => {
  try {
    const { module, action, entity_type, entity_id, entity_name, description, before_data, after_data, performed_by } = req.body;
    const logEntry = createAuditLog({ module, action, entity_type, entity_id, entity_name, description, before_data, after_data, performed_by });
    res.status(201).json(logEntry);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
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
