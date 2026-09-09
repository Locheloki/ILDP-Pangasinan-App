// server.ts
import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import ExcelJS from "exceljs";
var app = express();
var PORT = 3e3;
var DB_FILE = path.join(process.cwd(), "database", "db.json");
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));
app.use((req, _res, next) => {
  if (req.url.startsWith("/api")) {
    console.log(`[API] ${req.method} ${req.url}`);
  }
  next();
});
var DEFAULT_OFFICES = [
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
var DEFAULT_POSITIONS = [
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
var DEFAULT_LEARNING_NEEDS = [
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
var DEFAULT_BASES = [
  "Requirement of the position",
  "Competency Gap",
  "Licensing Requirement",
  "Update/Learning Requirement",
  "Succession Planning",
  "Competency Improvement",
  "N/A"
];
var DEFAULT_METHODOLOGIES = [
  "Seminar/Training",
  "Coaching & Mentoring",
  "Refresher Training",
  "Webinar",
  "Values Restoration Drive",
  "Job Rotation",
  "Shadowing",
  "N/A"
];
var DEFAULT_SCHEDULES = [
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
var _searchIndex = null;
var _searchIndexGeneration = 0;
function getSearchIndex(db) {
  if (_searchIndex) return _searchIndex;
  _searchIndex = /* @__PURE__ */ new Map();
  for (const emp of db.employees) {
    const firstName = normalizeSearchString(emp.FirstName || "");
    const lastName = normalizeSearchString(emp.LastName || "");
    const mi = normalizeSearchString(emp.MiddleInitial || "");
    const empId = String(emp.EmployeeID);
    const office = normalizeSearchString(emp.Office || "");
    _searchIndex.set(emp.EmployeeID, {
      firstName,
      lastName,
      mi,
      empId,
      office,
      firstNameTokens: firstName.split(/\s+/).filter((t) => t),
      lastNameTokens: lastName.split(/\s+/).filter((t) => t),
      fullNameFlat: `${firstName} ${lastName}`,
      lastNameFirstName: `${lastName} ${firstName}`,
      firstNameLastName: `${firstName} ${lastName}`,
      displayName: `${lastName}, ${firstName} ${mi ? mi + "." : ""}`.trim(),
      searchableText: `${firstName} ${lastName} ${mi} ${empId}`
    });
  }
  return _searchIndex;
}
function readDatabase(retries = 3) {
  const defaults = {
    basis: DEFAULT_BASES,
    methodology: DEFAULT_METHODOLOGIES,
    office: DEFAULT_OFFICES,
    position: DEFAULT_POSITIONS,
    learningNeed: DEFAULT_LEARNING_NEEDS,
    schedule: DEFAULT_SCHEDULES
  };
  const emptyDb = {
    users: [],
    employees: [],
    learningNeeds: [],
    seminars: [],
    seminarAttendees: [],
    seminarYears: [],
    auditLogs: [],
    deletionRequests: [],
    customOptions: { ...defaults }
  };
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (!fs.existsSync(DB_FILE)) {
        console.error(`Database file not found: ${DB_FILE}`);
        return emptyDb;
      }
      const data = fs.readFileSync(DB_FILE, "utf-8");
      const db = JSON.parse(data);
      if (!db.seminars) db.seminars = [];
      if (!db.seminarAttendees) db.seminarAttendees = [];
      if (!db.seminarYears) db.seminarYears = [];
      if (!db.auditLogs) db.auditLogs = [];
      if (!db.deletionRequests) db.deletionRequests = [];
      if (!db.customOptions) {
        db.customOptions = { ...defaults };
      } else {
        Object.keys(defaults).forEach((key) => {
          const k = key;
          if (!db.customOptions[k] || !Array.isArray(db.customOptions[k]) || db.customOptions[k].length === 0) {
            db.customOptions[k] = [...defaults[k]];
          }
        });
      }
      if (!db.employees || !Array.isArray(db.employees) || db.employees.length === 0) {
        console.error(`[readDatabase] WARNING: db.employees is empty or invalid on attempt ${attempt + 1}`);
        if (attempt < retries - 1) {
          _searchIndex = null;
          continue;
        }
      }
      return db;
    } catch (error) {
      console.error(`Error reading database (attempt ${attempt + 1}/${retries}):`, error);
      if (attempt < retries - 1) {
        _searchIndex = null;
        continue;
      }
    }
  }
  console.error("All readDatabase retries failed, returning empty database");
  return emptyDb;
}
function writeDatabase(data) {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    _searchIndex = null;
    _searchIndexGeneration++;
  } catch (error) {
    console.error("Error writing database:", error);
  }
}
function createAuditLog(params) {
  const db = readDatabase();
  const maxId = db.auditLogs.reduce((max, log) => log.id > max ? log.id : max, 0);
  const logEntry = {
    id: maxId + 1,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    module: params.module,
    action: params.action,
    entity_type: params.entity_type,
    entity_id: params.entity_id != null ? String(params.entity_id) : null,
    entity_name: params.entity_name || null,
    description: params.description || null,
    before_data: params.before_data != null ? JSON.stringify(params.before_data) : null,
    after_data: params.after_data != null ? JSON.stringify(params.after_data) : null,
    performed_by: params.performed_by || "System (Development Mode)",
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.auditLogs.push(logEntry);
  writeDatabase(db);
  return logEntry;
}
function formatName(val) {
  if (!val) return "";
  return val.toLowerCase().replace(/\s+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()).trim();
}
function formatMiddleInitial(val) {
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
function buildEmployeeName(emp) {
  const parts = [emp.LastName + ","];
  if (emp.Suffix) parts.push(emp.Suffix);
  parts.push(emp.FirstName);
  if (emp.MiddleInitial) parts.push(emp.MiddleInitial.endsWith(".") ? emp.MiddleInitial : emp.MiddleInitial + ".");
  return parts.join(" ");
}
function ensureCustomOptionsExist(employee, needs, db) {
  if (!db.customOptions) {
    db.customOptions = { basis: [], methodology: [], office: [], position: [], learningNeed: [], schedule: [] };
  }
  const addOption = (type, val) => {
    if (!val) return;
    const trimmed = val.trim();
    if (!trimmed || trimmed.toLowerCase() === "n/a") return;
    const list = db.customOptions[type];
    if (Array.isArray(list)) {
      const exists = list.some((item) => item.toLowerCase() === trimmed.toLowerCase());
      if (!exists) {
        list.push(trimmed);
      }
    }
  };
  if (employee.Office) addOption("office", employee.Office);
  if (employee.Position) addOption("position", employee.Position);
  if (Array.isArray(needs)) {
    needs.forEach((need) => {
      if (need.LearningNeed) addOption("learningNeed", need.LearningNeed);
      if (need.TargetSchedule) addOption("schedule", need.TargetSchedule);
      const parseList = (val) => {
        if (Array.isArray(val)) {
          return val.map((item) => (item || "").trim()).filter(Boolean);
        } else if (typeof val === "string") {
          return val.split(",").map((item) => item.trim()).filter(Boolean);
        }
        return [];
      };
      parseList(need.Basis).forEach((b) => addOption("basis", b));
      parseList(need.Methodology).forEach((m) => addOption("methodology", m));
    });
  }
}
function findSimilarEmployees(firstName, lastName, db) {
  const normFirst = firstName.trim().toLowerCase().replace(/\s+/g, " ");
  const normLast = lastName.trim().toLowerCase().replace(/\s+/g, " ");
  if (normFirst.length < 2 || normLast.length < 2) {
    return [];
  }
  return db.employees.filter((emp) => {
    if (emp.isActive === false) return false;
    const dbFirst = emp.FirstName.trim().toLowerCase().replace(/\s+/g, " ");
    const dbLast = emp.LastName.trim().toLowerCase().replace(/\s+/g, " ");
    const firstMatches = dbFirst === normFirst || dbFirst.startsWith(`${normFirst} `) || normFirst.startsWith(`${dbFirst} `);
    return dbLast === normLast && firstMatches;
  });
}
var NON_PERSON_KEYWORDS = /* @__PURE__ */ new Set([
  "office",
  "department",
  "division",
  "section",
  "unit",
  "team",
  "position",
  "designation",
  "title",
  "remarks",
  "signature",
  "date",
  "training",
  "seminar",
  "workshop",
  "conference",
  "meeting",
  "participants",
  "participant",
  "employee",
  "employees",
  "attendee",
  "attendees",
  "name",
  "names",
  "no",
  "number",
  "total",
  "subtotal",
  "grand total",
  "page",
  "prepared",
  "approved",
  "noted",
  "attested",
  "received",
  "submitted",
  "reviewed",
  "checked",
  "verified",
  "validated",
  "confirmed",
  "copied",
  "distributed",
  "filename",
  "schedule",
  "location",
  "venue",
  "speaker",
  "facilitator",
  "trainor",
  "trainer",
  "inclusive",
  "duration",
  "time",
  "subject",
  "topic",
  "agenda",
  "objective",
  "rationale",
  "background",
  "reference",
  "summary",
  "list",
  "attendance",
  "sheet",
  "form",
  "republic",
  "province",
  "municipality",
  "city",
  "barangay",
  "human",
  "resource",
  "resources",
  "administrative",
  "finance",
  "accounting",
  "budget",
  "planning",
  "development",
  "education",
  "health",
  "agriculture",
  "engineering",
  "general",
  "services",
  "support",
  "management",
  "regional",
  "national",
  "local",
  "field",
  "action",
  "order",
  "memorandum",
  "advisory",
  "certification",
  "accreditation",
  "registration",
  "male",
  "female",
  "sex",
  "gender",
  "age",
  "address",
  "contact",
  "phone",
  "email",
  "status",
  "regular",
  "casual",
  "contractual",
  "job",
  "order",
  "grade",
  "step",
  "salary",
  "rate",
  "row",
  "column",
  "cell",
  "table",
  "header",
  "footer",
  "answer",
  "question",
  "instruction",
  "direction",
  "note",
  "notes",
  "important",
  "warning",
  "sample",
  "example",
  "template",
  "format",
  "code",
  "id",
  "reference",
  "slug"
]);
function isLikelyPersonName(text) {
  if (!text || typeof text !== "string") return false;
  const cleaned = text.trim().replace(/\(\d+\)/g, "").trim();
  if (cleaned.length < 3) return false;
  const lower = cleaned.toLowerCase();
  if (/^(prepared|approved|noted|attested|certified|verified|received|submitted|checked|reviewed|validated|confirmed|copied|distributed|requested|endorsed|recommended)\s*(by|for)?[:：]/i.test(cleaned)) return false;
  if (/^(prepared|approved|noted|attested|certified|verified|received|submitted|checked|reviewed)\s+by$/i.test(cleaned)) return false;
  if (/^(attendance\s*sheet|training\s*title|seminar\s*title|list\s*of\s*participants|employee\s*name|employee\s*list|name\s*of\s*employee|republic\s*of\s*the\s*philippines|province\s*of|human\s*resource|administrative\s*officer|management\s*officer)$/i.test(cleaned)) return false;
  if (!cleaned.includes(" ") && NON_PERSON_KEYWORDS.has(lower)) return false;
  if ((cleaned.match(/[A-Za-z]/g) || []).length < 2) return false;
  return true;
}
function getComparisonKey(text) {
  if (!text) return "";
  return text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[\t\n\r]+/g, " ").replace(/['"‘’“”`’]+/g, "").replace(/[—–-]/g, " ").replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ").replace(/\s+/g, " ").trim();
}
function getEmployeeComparisonKeys(emp) {
  const keys = /* @__PURE__ */ new Set();
  const fn = getComparisonKey(emp.FirstName || "");
  const ln = getComparisonKey(emp.LastName || "");
  const mi = getComparisonKey(emp.MiddleInitial || emp.MiddleName || "");
  const suffix = getComparisonKey(emp.Suffix || "");
  const addPermutations = (f, m, l, s) => {
    keys.add(`${f} ${m} ${l} ${s}`.replace(/\s+/g, " ").trim());
    keys.add(`${f} ${l} ${s}`.replace(/\s+/g, " ").trim());
    keys.add(`${f} ${m} ${l}`.replace(/\s+/g, " ").trim());
    keys.add(`${f} ${l}`.replace(/\s+/g, " ").trim());
    keys.add(`${l} ${f} ${m} ${s}`.replace(/\s+/g, " ").trim());
    keys.add(`${l} ${f} ${s}`.replace(/\s+/g, " ").trim());
    keys.add(`${l} ${f} ${m}`.replace(/\s+/g, " ").trim());
    keys.add(`${l} ${f}`.replace(/\s+/g, " ").trim());
  };
  addPermutations(fn, mi, ln, suffix);
  if (ln.includes(" ")) {
    const words = ln.split(/\s+/);
    const lastWord = words[words.length - 1];
    const prefixWords = words.slice(0, -1).join(" ");
    const newFn = `${fn} ${prefixWords}`.replace(/\s+/g, " ").trim();
    addPermutations(newFn, mi, lastWord, suffix);
  }
  return keys;
}
function normalizeText(text) {
  return getComparisonKey(text);
}
function normalizeName(name) {
  return getComparisonKey(name);
}
function normalizeSearchString(str) {
  return (str || "").toLowerCase().replace(/[,\.;:]/g, "").replace(/['']/g, "'").replace(/\s+/g, " ").trim();
}
function searchEmployees(employees, query, opts) {
  const rawQuery = (query || "").trim();
  if (!rawQuery) return employees;
  const normQuery = normalizeSearchString(rawQuery);
  const queryTokens = normQuery.split(/\s+/).filter((t) => t.length > 0);
  if (queryTokens.length === 0) return employees;
  const db = readDatabase();
  const index = getSearchIndex(db);
  function tokenMatches(qt, nameToken) {
    if (qt === nameToken) return true;
    if (nameToken.startsWith(qt) || qt.startsWith(nameToken)) return true;
    return false;
  }
  function tokenContains(qt, nameToken) {
    if (qt === nameToken) return true;
    if (nameToken.startsWith(qt) || qt.startsWith(nameToken)) return true;
    if (nameToken.includes(qt)) return true;
    return false;
  }
  const scored = [];
  for (const emp of employees) {
    const idx = index.get(emp.EmployeeID);
    if (!idx) continue;
    const { firstName, lastName, mi, empId, office, firstNameTokens, lastNameTokens, fullNameFlat, lastNameFirstName, firstNameLastName, displayName, searchableText } = idx;
    const isExactId = rawQuery === empId;
    const isExactFullName = rawQuery === fullNameFlat || rawQuery === displayName;
    const isExactLastFirst = rawQuery === lastNameFirstName;
    const isExactFirstLast = rawQuery === firstNameLastName;
    const isExactLast = rawQuery === lastName;
    const isExactFirst = rawQuery === firstName;
    if (isExactId || isExactFullName || isExactLastFirst || isExactFirstLast || isExactLast || isExactFirst) {
      let rank = 0;
      if (isExactId) rank = 0;
      else if (isExactFullName) rank = 1;
      else if (isExactLastFirst) rank = 2;
      else if (isExactFirstLast) rank = 3;
      else if (isExactLast) rank = 4;
      else rank = 5;
      scored.push({ emp, rank });
      continue;
    }
    const firstTokenExact = queryTokens.some((qt) => firstNameTokens.includes(qt));
    const lastTokenExact = queryTokens.some((qt) => lastNameTokens.includes(qt));
    const allTokensMatch = queryTokens.every(
      (qt) => firstNameTokens.some((ft) => tokenMatches(qt, ft)) || lastNameTokens.some((lt) => tokenMatches(qt, lt)) || qt === empId
    );
    if (allTokensMatch) {
      let rank = 9;
      if (firstTokenExact && lastTokenExact) rank = 6;
      else if (firstTokenExact) rank = 7;
      else if (lastTokenExact) rank = 8;
      scored.push({ emp, rank });
      continue;
    }
    const allTokensContain = queryTokens.every(
      (qt) => firstNameTokens.some((ft) => tokenContains(qt, ft)) || lastNameTokens.some((lt) => tokenContains(qt, lt)) || empId.includes(qt)
    );
    if (allTokensContain) {
      scored.push({ emp, rank: 10 });
      continue;
    }
    if (searchableText.includes(normQuery)) {
      scored.push({ emp, rank: 11 });
      continue;
    }
  }
  scored.sort((a, b) => a.rank - b.rank);
  let results = scored.map((s) => s.emp);
  if (opts?.limit && opts.limit > 0) {
    results = results.slice(0, opts.limit);
  }
  return results;
}
function matchEmployees(rawEmployees, dbEmployees) {
  const attendees = [];
  const parsedNames = /* @__PURE__ */ new Set();
  const comparisonKeyToEmployee = /* @__PURE__ */ new Map();
  const employeeById = /* @__PURE__ */ new Map();
  for (const emp of dbEmployees) {
    employeeById.set(emp.EmployeeID, emp);
    const keys = getEmployeeComparisonKeys(emp);
    for (const key of keys) {
      if (!comparisonKeyToEmployee.has(key)) {
        comparisonKeyToEmployee.set(key, []);
      }
      comparisonKeyToEmployee.get(key).push(emp);
    }
  }
  const mergedRawEmployees = [];
  let skipNext = false;
  for (let i = 0; i < rawEmployees.length; i++) {
    if (skipNext) {
      skipNext = false;
      continue;
    }
    const current = rawEmployees[i];
    if (!current.rawName) continue;
    if (i < rawEmployees.length - 1) {
      const next = rawEmployees[i + 1];
      if (next.rawName) {
        const normCurrent = getComparisonKey(current.rawName);
        const normNext = getComparisonKey(next.rawName);
        const currentMatches = comparisonKeyToEmployee.has(normCurrent) || current.employeeId && employeeById.has(Number(current.employeeId)) || current.manualEmployeeId;
        const nextMatches = comparisonKeyToEmployee.has(normNext) || next.employeeId && employeeById.has(Number(next.employeeId)) || next.manualEmployeeId;
        if (!currentMatches && !nextMatches) {
          const combinedName = `${current.rawName}, ${next.rawName}`;
          if (comparisonKeyToEmployee.has(getComparisonKey(combinedName))) {
            mergedRawEmployees.push({
              ...current,
              rawName: combinedName,
              office: current.office || next.office,
              _key: current._key || next._key
            });
            skipNext = true;
            continue;
          }
        }
      }
    }
    mergedRawEmployees.push(current);
  }
  for (const entry of mergedRawEmployees) {
    const { rawName: nameVal, office: officeVal, position: positionVal, employeeId, manualEmployeeId, _key } = entry;
    if (!nameVal) continue;
    if (nameVal.toLowerCase().includes("page") || nameVal.toLowerCase().includes("total") || nameVal.toLowerCase() === "names") continue;
    const normInput = getComparisonKey(nameVal);
    if (parsedNames.has(normInput)) continue;
    parsedNames.add(normInput);
    let match = null;
    let matchReason = "";
    let allMatchedIds = /* @__PURE__ */ new Set();
    if (manualEmployeeId) {
      match = employeeById.get(manualEmployeeId) || null;
      if (match) {
        matchReason = "Manually matched by user";
        allMatchedIds.add(manualEmployeeId);
      }
    }
    if (!match && employeeId?.trim()) {
      const parsedId = Number(employeeId.trim());
      match = employeeById.get(parsedId) || null;
      if (match) {
        matchReason = "Employee ID match";
        allMatchedIds.add(match.EmployeeID);
      }
    }
    if (!match) {
      const candidates = comparisonKeyToEmployee.get(normInput) || [];
      if (candidates.length === 1) {
        match = candidates[0];
        matchReason = "Name match";
        allMatchedIds.add(match.EmployeeID);
      } else if (candidates.length > 1) {
        for (const c of candidates) {
          allMatchedIds.add(c.EmployeeID);
        }
        matchReason = `${allMatchedIds.size} possible matches \u2014 manual selection required`;
      }
    }
    if (match && allMatchedIds.size === 1) {
      const differences = [];
      if (officeVal && match.Office && getComparisonKey(officeVal) !== getComparisonKey(match.Office)) {
        differences.push("Office");
      }
      if (positionVal && match.Position && getComparisonKey(positionVal) !== getComparisonKey(match.Position)) {
        differences.push("Position");
      }
      attendees.push({
        _key: _key || "",
        rawName: nameVal,
        // Preserves original display name from excel
        office: officeVal,
        position: positionVal || "",
        status: "matched",
        reviewReason: void 0,
        confidence: 100,
        confidenceLevel: "HIGH",
        EmployeeID: String(match.EmployeeID),
        // Use EXACT casing and formatting from database fields!
        LastName: match.LastName,
        FirstName: match.FirstName,
        MiddleInitial: match.MiddleInitial || "",
        Suffix: match.Suffix || "",
        Office: match.Office,
        Position: match.Position,
        matchReasons: [matchReason],
        differences,
        excelOffice: officeVal,
        dbOffice: match.Office,
        excelPosition: positionVal || "",
        dbPosition: match.Position,
        manualEmployeeId: manualEmployeeId || void 0
      });
    } else {
      if (allMatchedIds.size >= 1) {
        const firstId = [...allMatchedIds][0];
        const firstEmp = employeeById.get(firstId);
        attendees.push({
          _key: _key || "",
          rawName: nameVal,
          office: officeVal,
          position: positionVal || "",
          status: "review",
          reviewReason: "AMBIGUOUS",
          confidence: 0,
          confidenceLevel: "LOW",
          EmployeeID: String(firstId),
          LastName: firstEmp.LastName,
          FirstName: firstEmp.FirstName,
          MiddleInitial: firstEmp.MiddleInitial || "",
          Suffix: firstEmp.Suffix || "",
          Office: firstEmp.Office,
          Position: firstEmp.Position,
          matchReasons: allMatchedIds.size > 1 ? [`${allMatchedIds.size} possible matches`] : [matchReason],
          differences: [],
          excelOffice: officeVal,
          dbOffice: firstEmp.Office,
          excelPosition: positionVal || "",
          dbPosition: firstEmp.Position,
          manualEmployeeId: void 0
        });
      } else {
        attendees.push({
          _key: _key || "",
          rawName: nameVal,
          office: officeVal,
          position: positionVal || "",
          status: "unmatched",
          reviewReason: "NO_MATCH",
          confidence: 0,
          confidenceLevel: "LOW",
          matchReasons: [],
          differences: [],
          excelOffice: officeVal,
          dbOffice: "",
          excelPosition: positionVal || "",
          dbPosition: ""
        });
      }
    }
  }
  return { attendees };
}
var VALID_TYPES = ["basis", "methodology", "office", "position", "learningNeed", "schedule"];
app.get("/api/options/:type", (req, res) => {
  const { type } = req.params;
  if (!VALID_TYPES.includes(type)) return res.status(400).json({ message: "Invalid type" });
  const db = readDatabase();
  return res.json(db.customOptions[type]);
});
app.post("/api/options/:type", (req, res) => {
  const { type } = req.params;
  const { value } = req.body;
  if (!VALID_TYPES.includes(type)) return res.status(400).json({ message: "Invalid type" });
  if (!value) return res.status(400).json({ message: "Value required" });
  const db = readDatabase();
  const normalizedValue = value.trim();
  const exists = db.customOptions[type].some((v) => v.toLowerCase() === normalizedValue.toLowerCase());
  if (exists) return res.status(400).json({ message: "Duplicate entry" });
  db.customOptions[type].push(normalizedValue);
  writeDatabase(db);
  return res.status(201).json({ value: normalizedValue });
});
app.delete("/api/options/:type/:value", (req, res) => {
  const { type, value } = req.params;
  if (!VALID_TYPES.includes(type)) return res.status(400).json({ message: "Invalid type" });
  const db = readDatabase();
  db.customOptions[type] = db.customOptions[type].filter((v) => v.toLowerCase() !== value.toLowerCase());
  writeDatabase(db);
  return res.json({ message: "Deleted" });
});
var ALL_PERMISSIONS = [
  "employee:view",
  "employee:create",
  "employee:edit",
  "employee:delete",
  "seminar:view",
  "seminar:create",
  "seminar:edit",
  "seminar:delete",
  "seminar:import",
  "seminar:year:delete",
  "seminar:attendee:delete",
  "import:data",
  "audit:view",
  "user:manage",
  "user:assign_role",
  "user:delete",
  "user:activity:view"
];
var PERMISSION_MAP = {
  Encoder: [
    "employee:view",
    "seminar:view",
    "seminar:create",
    "seminar:edit",
    "seminar:delete",
    "seminar:import"
  ],
  Administrator: [
    "employee:view",
    "employee:create",
    "employee:edit",
    "employee:delete",
    "seminar:view",
    "seminar:create",
    "seminar:edit",
    "seminar:delete",
    "seminar:import",
    "seminar:year:delete",
    "seminar:attendee:delete",
    "user:activity:view"
  ],
  admin: [
    "employee:view",
    "employee:create",
    "employee:edit",
    "employee:delete",
    "seminar:view",
    "seminar:create",
    "seminar:edit",
    "seminar:delete",
    "seminar:import",
    "seminar:year:delete",
    "seminar:attendee:delete",
    "user:activity:view"
  ],
  "System developer": [...ALL_PERMISSIONS]
};
function getUserFromRequest(req) {
  const userId = req.headers["x-user-id"] || req.body?._userId;
  const db = readDatabase();
  if (!userId) {
    const admin = (db.users || []).find(
      (u) => (u.role === "admin" || u.role === "Administrator" || u.role === "System developer") && u.isActive !== false
    );
    if (admin) return { id: admin.id, username: admin.username, role: admin.role, name: admin.name };
    return null;
  }
  const user = db.users.find((u) => String(u.id) === String(userId));
  if (!user || user.isActive === false) return null;
  return { id: user.id, username: user.username, role: user.role, name: user.name };
}
function requirePermission(...permissions) {
  return (req, res, next) => {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const userPerms = PERMISSION_MAP[user.role] || [];
    const hasAny = permissions.some((p) => userPerms.includes(p));
    if (!hasAny) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    req._user = user;
    next();
  };
}
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }
  const db = readDatabase();
  const user = db.users.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
  );
  if (!user) {
    return res.status(401).json({ message: "Invalid username or password" });
  }
  if (user.isActive === false) {
    return res.status(403).json({ message: "Account is disabled. Contact an administrator." });
  }
  return res.json({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    isActive: user.isActive !== false
  });
});
app.post("/api/auth/change-password", (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  if (!username || !oldPassword || !newPassword) {
    return res.status(400).json({ message: "Username, old password, and new password are required" });
  }
  const db = readDatabase();
  const userIndex = db.users.findIndex(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase()
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
    performed_by: username
  });
  return res.json({ message: "Password updated successfully" });
});
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
    (u) => u.username.toLowerCase() === username.trim().toLowerCase()
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
    performed_by: "System (Dev Code)"
  });
  return res.json({ message: "Password reset successfully" });
});
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
    (u) => u.username.toLowerCase() === username.trim().toLowerCase()
  );
  if (exists) {
    return res.status(400).json({ message: "Username already exists" });
  }
  const maxId = db.users.reduce((max, u) => u.id > max ? u.id : max, 0);
  const newUser = {
    id: maxId + 1,
    username: username.trim(),
    password,
    name: username.trim(),
    role: "Encoder",
    isActive: true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
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
    performed_by: newUser.username
  });
  return res.status(201).json({
    id: newUser.id,
    username: newUser.username,
    name: newUser.name,
    role: newUser.role,
    isActive: newUser.isActive
  });
});
app.post("/api/users/profile-pic", (req, res) => {
  const { userId, profilePic } = req.body;
  if (!userId || !profilePic) {
    return res.status(400).json({ message: "userId and profilePic are required" });
  }
  const db = readDatabase();
  const userIndex = db.users.findIndex((u) => String(u.id) === String(userId));
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
    performed_by: db.users[userIndex].username
  });
  return res.json({ message: "Profile picture updated successfully" });
});
app.get("/api/users", requirePermission("user:manage"), (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  const db = readDatabase();
  const users = db.users.map((u) => ({
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    profilePic: u.profilePic || null,
    isActive: u.isActive !== false,
    createdAt: u.createdAt || null
  }));
  return res.json(users);
});
app.get("/api/users/:id", requirePermission("user:manage"), (req, res) => {
  const db = readDatabase();
  const user = db.users.find((u) => String(u.id) === String(req.params.id));
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    profilePic: user.profilePic || null,
    isActive: user.isActive !== false,
    createdAt: user.createdAt || null
  });
});
app.post("/api/users", requirePermission("user:manage"), (req, res) => {
  const { username, password, name, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }
  const db = readDatabase();
  if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(400).json({ error: "Username already exists" });
  }
  const validRoles = ["Encoder", "Administrator", "System developer"];
  const assignedRole = validRoles.includes(role) ? role : "Encoder";
  const maxId = db.users.reduce((max, u) => Math.max(max, u.id), 0);
  const newUser = {
    id: maxId + 1,
    username: username.trim(),
    password,
    name: name || username.trim(),
    role: assignedRole,
    isActive: true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
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
    performed_by: req._user?.name || "System"
  });
  return res.status(201).json({
    id: newUser.id,
    username: newUser.username,
    name: newUser.name,
    role: newUser.role,
    isActive: newUser.isActive
  });
});
app.put("/api/users/:id", requirePermission("user:manage", "user:assign_role"), (req, res) => {
  const db = readDatabase();
  const idx = db.users.findIndex((u) => String(u.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "User not found" });
  const user = db.users[idx];
  const before = { ...user };
  if (req.body.name !== void 0) user.name = req.body.name;
  if (req.body.password !== void 0) user.password = req.body.password;
  if (req.body.isActive !== void 0) user.isActive = req.body.isActive;
  if (req.body.role !== void 0) {
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
    performed_by: req._user?.name || "System"
  });
  return res.json({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    isActive: user.isActive !== false
  });
});
app.delete("/api/users/:id", requirePermission("user:delete"), (req, res) => {
  const db = readDatabase();
  const idx = db.users.findIndex((u) => String(u.id) === String(req.params.id));
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
    performed_by: req._user?.name || "System"
  });
  return res.json({ message: "User deleted successfully" });
});
app.post("/api/deletion-requests", (req, res) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Authentication required" });
  if (user.role !== "Encoder") {
    return res.status(400).json({ error: "Only encoders can submit deletion requests" });
  }
  const { entityType, entityId, entityName, reason } = req.body;
  if (!entityType || !entityId || !entityName) {
    return res.status(400).json({ error: "entityType, entityId, and entityName are required" });
  }
  if (entityType !== "employee") {
    return res.status(400).json({ error: "Only employee deletions require approval" });
  }
  const db = readDatabase();
  const request = {
    id: `dr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    entityType,
    entityId: String(entityId),
    entityName,
    requestedBy: String(user.id),
    requestedByName: user.name,
    requestedByRole: user.role,
    reason: reason || "",
    status: "pending",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.deletionRequests.push(request);
  writeDatabase(db);
  createAuditLog({
    module: "Deletion Request",
    action: "CREATE",
    entity_type: "deletion_request",
    entity_id: request.id,
    entity_name: entityName,
    description: `${user.name} requested deletion of ${entityType} "${entityName}"`,
    before_data: null,
    after_data: { entityType, entityId, status: "pending" },
    performed_by: user.name
  });
  return res.status(201).json(request);
});
app.get("/api/deletion-requests", (req, res) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Authentication required" });
  const db = readDatabase();
  let requests = db.deletionRequests || [];
  if (user.role === "Encoder") {
    requests = requests.filter((r) => r.requestedBy === String(user.id));
  }
  requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json(requests);
});
app.put("/api/deletion-requests/:id", requirePermission("employee:delete", "seminar:delete"), (req, res) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Authentication required" });
  const db = readDatabase();
  const idx = (db.deletionRequests || []).findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Request not found" });
  const request = db.deletionRequests[idx];
  if (request.status !== "pending") {
    return res.status(400).json({ error: "Request already reviewed" });
  }
  const { status } = req.body;
  if (status !== "approved" && status !== "denied") {
    return res.status(400).json({ error: "Status must be 'approved' or 'denied'" });
  }
  request.status = status;
  request.reviewedBy = String(user.id);
  request.reviewedByName = user.name;
  request.reviewedAt = (/* @__PURE__ */ new Date()).toISOString();
  db.deletionRequests[idx] = request;
  if (status === "approved") {
    if (request.entityType === "employee") {
      const empIdx = db.employees.findIndex((e) => String(e.EmployeeID) === request.entityId);
      if (empIdx !== -1) {
        db.employees.splice(empIdx, 1);
        db.learningNeeds = (db.learningNeeds || []).filter((ln) => String(ln.EmployeeID) !== request.entityId);
      }
    } else if (request.entityType === "seminar") {
      const semIdx = db.seminars.findIndex((s) => String(s.id) === request.entityId);
      if (semIdx !== -1) {
        db.seminars.splice(semIdx, 1);
        db.seminarAttendees = (db.seminarAttendees || []).filter((a) => a.seminarId !== request.entityId);
      }
    } else if (request.entityType === "learning-need") {
      const lnIdx = db.learningNeeds.findIndex((ln) => String(ln.LearningNeedID) === request.entityId);
      if (lnIdx !== -1) {
        db.learningNeeds.splice(lnIdx, 1);
      }
    }
  }
  writeDatabase(db);
  createAuditLog({
    module: "Deletion Request",
    action: status === "approved" ? "APPROVE" : "DENY",
    entity_type: "deletion_request",
    entity_id: request.id,
    entity_name: request.entityName,
    description: `${user.name} ${status} deletion of ${request.entityType} "${request.entityName}"`,
    before_data: { status: "pending" },
    after_data: { status, reviewedBy: user.name },
    performed_by: user.name
  });
  return res.json(request);
});
app.get("/api/dashboard/stats", (req, res) => {
  const db = readDatabase();
  const activeEmployees = db.employees.filter((emp) => emp.isActive !== false);
  const archivedEmployeesCount = db.employees.filter((emp) => emp.isActive === false).length;
  const totalEmployees = activeEmployees.length;
  const totalLearningNeeds = db.learningNeeds.length;
  const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const uniqueEmployeeIdsToday = /* @__PURE__ */ new Set();
  (db.learningNeeds || []).forEach((ln) => {
    if (ln.CreatedAt && ln.CreatedAt.startsWith(todayStr)) {
      uniqueEmployeeIdsToday.add(ln.EmployeeID);
    }
  });
  const learningNeedsTodayUnique = uniqueEmployeeIdsToday.size;
  const permanent = activeEmployees.filter((e) => e.EmploymentStatus === "Permanent").length;
  const casual = activeEmployees.filter((e) => e.EmploymentStatus === "Casual").length;
  const jobOrder = activeEmployees.filter((e) => e.EmploymentStatus === "Job Order").length;
  const consultant = activeEmployees.filter((e) => e.EmploymentStatus === "Consultant").length;
  const unidentified = activeEmployees.filter(
    (e) => e.EmploymentStatus !== "Permanent" && e.EmploymentStatus !== "Casual" && e.EmploymentStatus !== "Job Order" && e.EmploymentStatus !== "Consultant"
  ).length;
  const newlyHired = activeEmployees.filter((e) => e.NewlyHired === "Newly Hired" || e.EmploymentStatus === "Newly Hired").length;
  const lastLog = db.auditLogs && db.auditLogs.length > 0 ? db.auditLogs[db.auditLogs.length - 1] : null;
  const lastActivity = lastLog ? {
    action: lastLog.action || lastLog.description || "Activity logged",
    timestamp: lastLog.timestamp,
    performed_by: lastLog.performed_by
  } : null;
  const syncLogs = (db.auditLogs || []).filter(
    (log) => log.action && log.action.toLowerCase().includes("import") || log.module && log.module.toLowerCase().includes("import")
  );
  const lastSyncLog = syncLogs.length > 0 ? syncLogs[syncLogs.length - 1] : null;
  const lastSync = lastSyncLog ? {
    action: lastSyncLog.action || "Database Synchronized",
    timestamp: lastSyncLog.timestamp
  } : null;
  const recentActivity = [...db.auditLogs || []].reverse().slice(0, 10).map((log) => {
    const logObj = {
      id: log.id,
      action: log.action || log.description || "Action logged",
      description: log.description,
      performed_by: log.performed_by,
      timestamp: log.timestamp,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      entity_name: log.entity_name
    };
    if (log.entity_type === "seminar" && log.entity_id) {
      const sem = db.seminars.find((s) => s.id === log.entity_id);
      if (sem) {
        logObj.seminarYear = sem.year;
        logObj.seminarQuarter = sem.quarter;
      }
    }
    return logObj;
  });
  const alertEmployees = [];
  const oneYearAgo = /* @__PURE__ */ new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  activeEmployees.forEach((emp) => {
    const status = emp.EmploymentStatus || "Undefined (Pending Review)";
    const changedAt = emp.StatusChangedAt;
    if (!changedAt) return;
    const changedDate = new Date(changedAt);
    if (changedDate <= oneYearAgo) {
      if (status === "Newly Hired" || status === "Re-employed") {
        alertEmployees.push({
          id: emp.EmployeeID,
          name: buildEmployeeName(emp),
          office: emp.Office,
          status,
          message: "Not yet declared as Casual (1+ year in status)"
        });
      } else if (status === "Casual") {
        alertEmployees.push({
          id: emp.EmployeeID,
          name: buildEmployeeName(emp),
          office: emp.Office,
          status,
          message: "Not yet declared as Permanent (1+ year in status)"
        });
      }
    }
  });
  return res.json({
    totalEmployees,
    archivedEmployees: archivedEmployeesCount,
    totalLearningNeeds,
    learningNeedsTodayUnique,
    alertEmployees,
    workforceDistribution: {
      status: {
        permanent,
        casual,
        jobOrder,
        consultant,
        unidentified
      },
      activity: {
        newlyHired
      }
    },
    lastActivity,
    lastSync,
    recentActivity
  });
});
app.get("/api/search", (req, res) => {
  const db = readDatabase();
  const query = (req.query.q || "").toString().trim().toLowerCase();
  if (!query) {
    return res.json({ employees: [], seminars: [], learningNeeds: [], offices: [] });
  }
  const activeEmployees = db.employees.filter((emp) => emp.isActive !== false);
  const employeeResults = activeEmployees.filter((emp) => {
    const fullName = `${emp.FirstName} ${emp.LastName}`.toLowerCase();
    const reverseName = `${emp.LastName} ${emp.FirstName}`.toLowerCase();
    return fullName.includes(query) || reverseName.includes(query) || emp.EmployeeID && String(emp.EmployeeID).includes(query);
  }).slice(0, 10).map((emp) => ({
    id: emp.EmployeeID,
    name: buildEmployeeName(emp),
    office: emp.Office,
    position: emp.Position,
    type: "employee"
  }));
  const seminarResults = [];
  const seenSeminars = /* @__PURE__ */ new Set();
  (db.seminars || []).forEach((sem) => {
    if (sem.title && sem.title.toLowerCase().includes(query)) {
      const key = `${sem.year}_${sem.quarter}_${sem.id}`;
      if (!seenSeminars.has(key)) {
        seenSeminars.add(key);
        seminarResults.push({
          id: sem.id,
          title: sem.title,
          year: sem.year,
          quarter: sem.quarter,
          type: "seminar"
        });
      }
    }
  });
  const needsResults = [];
  const seenNeeds = /* @__PURE__ */ new Set();
  (db.learningNeeds || []).forEach((ln) => {
    if (ln.LearningNeed && ln.LearningNeed.toLowerCase().includes(query)) {
      const val = ln.LearningNeed.trim();
      const lower = val.toLowerCase();
      if (!seenNeeds.has(lower)) {
        seenNeeds.add(lower);
        needsResults.push({
          name: val,
          type: "learningNeed"
        });
      }
    }
  });
  const officeResults = [];
  const seenOffices = /* @__PURE__ */ new Set();
  activeEmployees.forEach((emp) => {
    if (emp.Office && emp.Office.toLowerCase().includes(query)) {
      const val = emp.Office.trim();
      const lower = val.toLowerCase();
      if (!seenOffices.has(lower)) {
        seenOffices.add(lower);
        officeResults.push({
          name: val,
          type: "office"
        });
      }
    }
  });
  res.json({
    employees: employeeResults,
    seminars: seminarResults.slice(0, 10),
    learningNeeds: needsResults.slice(0, 10),
    offices: officeResults.slice(0, 10)
  });
});
app.post("/api/employees/check-similar", (req, res) => {
  const { firstName, lastName } = req.body;
  if (!firstName || !lastName) {
    return res.json({ similar: [] });
  }
  const db = readDatabase();
  const similar = findSimilarEmployees(firstName, lastName, db);
  return res.json({ similar });
});
app.get("/api/employees", (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.set("Pragma", "no-cache");
  const db = readDatabase();
  const { search = "", office = "", limit = "", includeArchived = "" } = req.query;
  let results = [...db.employees];
  if (includeArchived !== "true") {
    results = results.filter((emp) => emp.isActive !== false);
  }
  if (search) {
    const maxResults = limit ? parseInt(limit) || 50 : 0;
    results = searchEmployees(results, search, { limit: maxResults > 0 ? maxResults : void 0 });
  }
  if (office) {
    const o = office.toLowerCase();
    results = results.filter((emp) => emp.Office && emp.Office.toLowerCase().includes(o));
  }
  if (!search) {
    const maxResults = limit ? Math.min(parseInt(limit) || 50, 100) : 0;
    if (maxResults > 0) {
      results = results.slice(0, maxResults);
    }
  }
  const needsCountMap = /* @__PURE__ */ new Map();
  (db.learningNeeds || []).forEach((ln) => {
    needsCountMap.set(ln.EmployeeID, (needsCountMap.get(ln.EmployeeID) || 0) + 1);
  });
  const resultsWithCount = results.map((emp) => {
    return {
      ...emp,
      needsCount: needsCountMap.get(emp.EmployeeID) || 0
    };
  });
  return res.json({ employees: resultsWithCount });
});
app.get("/api/employees/pending", (req, res) => {
  const db = readDatabase();
  const search = req.query.search ? req.query.search : "";
  const office = req.query.office ? req.query.office.toLowerCase() : "";
  const employmentType = req.query.employmentType ? req.query.employmentType.toLowerCase() : "";
  const employmentStatus = req.query.employmentStatus ? req.query.employmentStatus.toLowerCase() : "";
  const mode = req.query.mode ? req.query.mode : "no_needs";
  const hasNeedsIds = new Set(db.learningNeeds.map((ln) => ln.EmployeeID));
  const activeEmps = db.employees.filter((emp) => emp.isActive !== false);
  let pending = activeEmps;
  if (mode === "no_needs") {
    pending = activeEmps.filter((emp) => !hasNeedsIds.has(emp.EmployeeID));
  } else if (mode === "has_needs") {
    pending = activeEmps.filter((emp) => hasNeedsIds.has(emp.EmployeeID));
  }
  if (search) {
    pending = searchEmployees(pending, search);
  }
  if (office) {
    pending = pending.filter((emp) => emp.Office && emp.Office.toLowerCase() === office);
  }
  if (employmentType) {
    pending = pending.filter((emp) => emp.EmploymentType && emp.EmploymentType.toLowerCase() === employmentType);
  }
  if (employmentStatus) {
    pending = pending.filter((emp) => emp.EmploymentStatus && emp.EmploymentStatus.toLowerCase() === employmentStatus);
  }
  pending.sort((a, b) => a.LastName.localeCompare(b.LastName));
  return res.json({
    total: pending.length,
    employees: pending.slice(0, 100)
  });
});
app.get("/api/employees/archived", (req, res) => {
  const db = readDatabase();
  const { search = "" } = req.query;
  let results = (db.employees || []).filter((emp) => emp.isActive === false);
  if (search) {
    const terms = search.toLowerCase().split(/\s+/).filter((t) => t.length > 0);
    if (terms.length > 0) {
      results = results.filter((emp) => {
        const searchString = `${emp.FirstName} ${emp.MiddleInitial || ""} ${emp.LastName} ${emp.Office || ""}`.toLowerCase();
        const commaName = `${emp.LastName}, ${emp.FirstName}`.toLowerCase();
        const empId = String(emp.EmployeeID);
        return terms.every((term) => searchString.includes(term) || commaName.includes(term) || empId.includes(term));
      });
    }
  }
  const needsCountMap = /* @__PURE__ */ new Map();
  (db.learningNeeds || []).forEach((ln) => {
    needsCountMap.set(ln.EmployeeID, (needsCountMap.get(ln.EmployeeID) || 0) + 1);
  });
  const seminarCountMap = /* @__PURE__ */ new Map();
  (db.seminarAttendees || []).forEach((sa) => {
    seminarCountMap.set(sa.employeeId, (seminarCountMap.get(sa.employeeId) || 0) + 1);
  });
  const resultsWithCount = results.map((emp) => {
    return {
      ...emp,
      needsCount: needsCountMap.get(emp.EmployeeID) || 0,
      seminarCount: seminarCountMap.get(emp.EmployeeID) || 0
    };
  });
  return res.json({ employees: resultsWithCount });
});
app.get("/api/employees/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const db = readDatabase();
  const employee = db.employees.find((emp) => emp.EmployeeID === id);
  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }
  const needs = db.learningNeeds.filter((ln) => ln.EmployeeID === id);
  const attendeeRecords = (db.seminarAttendees || []).filter((sa) => sa.employeeId === id);
  const seminars = attendeeRecords.map((sa) => {
    const sem = (db.seminars || []).find((s) => s.id === sa.seminarId);
    return sem ? { id: sem.id, title: sem.title, year: sem.year, quarter: sem.quarter, date: sem.date } : null;
  }).filter(Boolean);
  return res.json({
    ...employee,
    needs,
    seminars
  });
});
app.post("/api/employees", (req, res) => {
  const { firstName, middleName, middleInitial, lastName, suffix, office, position, employmentType, employmentStatus, gender, dateOfAssumption, newlyHired, username = "system" } = req.body;
  if (!firstName || !lastName || !office || !position) {
    return res.status(400).json({ message: "First name, last name, office, and position are required" });
  }
  const db = readDatabase();
  const cleanFirst = formatName(firstName);
  const rawMiddle = middleName || middleInitial || "";
  const cleanMiddleName = rawMiddle ? formatName(rawMiddle) : "";
  const cleanMiddleInitial = formatMiddleInitial(rawMiddle);
  const cleanLast = formatName(lastName);
  const cleanSuffix = suffix ? suffix.trim().toUpperCase().replace(/^\.+|\.+$/g, "") : "";
  const cleanOffice = office.trim();
  const cleanPosition = position.trim();
  const type = employmentType || "Undefined (Pending Review)";
  const status = employmentStatus || "Undefined (Pending Review)";
  const maxId = db.employees.reduce((max, emp) => emp.EmployeeID > max ? emp.EmployeeID : max, 0);
  const newEmployee = {
    EmployeeID: maxId + 1,
    FirstName: cleanFirst,
    MiddleName: cleanMiddleName,
    MiddleInitial: cleanMiddleInitial,
    LastName: cleanLast,
    Suffix: cleanSuffix,
    Office: cleanOffice,
    Position: cleanPosition,
    EmploymentType: type,
    EmploymentStatus: status,
    StatusChangedAt: ["Newly Hired", "Re-employed", "Casual"].includes(status) ? (/* @__PURE__ */ new Date()).toISOString() : null,
    Gender: gender || "Undefined (Pending Review)",
    NewlyHired: newlyHired || "N/A",
    CreatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    UpdatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    CreatedBy: username,
    UpdatedBy: username
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
    entity_name: buildEmployeeName(newEmployee),
    description: `Created employee ${buildEmployeeName(newEmployee)}`,
    after_data: newEmployee,
    performed_by: username
  });
  return res.status(201).json(newEmployee);
});
app.put("/api/employees/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { firstName, middleName, middleInitial, lastName, suffix, office, position, employmentType, employmentStatus, gender, dateOfAssumption, newlyHired, needs = [], username = "system" } = req.body;
  if (!firstName || !lastName || !office || !position) {
    return res.status(400).json({ message: "First name, last name, office, and position are required" });
  }
  const db = readDatabase();
  const employeeIndex = db.employees.findIndex((emp) => emp.EmployeeID === id);
  if (employeeIndex === -1) {
    return res.status(404).json({ message: "Employee not found" });
  }
  const oldEmp = db.employees[employeeIndex];
  const oldStatus = oldEmp.EmploymentStatus || "Undefined (Pending Review)";
  const newStatus = employmentStatus || "Undefined (Pending Review)";
  let statusChangedAt = oldEmp.StatusChangedAt;
  if (oldStatus !== newStatus) {
    statusChangedAt = ["Newly Hired", "Re-employed", "Casual"].includes(newStatus) ? (/* @__PURE__ */ new Date()).toISOString() : null;
  }
  const hasDateOfAssumption = Object.prototype.hasOwnProperty.call(req.body, "dateOfAssumption");
  const rawMiddle = middleName !== void 0 ? middleName : middleInitial !== void 0 ? middleInitial : oldEmp.MiddleName || oldEmp.MiddleInitial || "";
  const cleanMiddleName = rawMiddle ? formatName(rawMiddle) : "";
  const cleanMiddleInitial = formatMiddleInitial(rawMiddle);
  const updatedEmployee = {
    ...oldEmp,
    FirstName: formatName(firstName),
    MiddleName: cleanMiddleName,
    MiddleInitial: cleanMiddleInitial,
    LastName: formatName(lastName),
    Suffix: suffix !== void 0 ? suffix ? suffix.trim().toUpperCase().replace(/^\.+|\.+$/g, "") : "" : oldEmp.Suffix || "",
    Office: office.trim(),
    Position: position.trim(),
    EmploymentType: employmentType || "Undefined (Pending Review)",
    EmploymentStatus: newStatus,
    StatusChangedAt: statusChangedAt,
    Gender: gender || oldEmp.Gender || "Undefined (Pending Review)",
    NewlyHired: newlyHired || oldEmp.NewlyHired || "N/A",
    UpdatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    UpdatedBy: username,
    CreatedBy: oldEmp.CreatedBy || username
  };
  if (hasDateOfAssumption) {
    if (dateOfAssumption) {
      updatedEmployee.DateOfAssumption = dateOfAssumption;
    } else {
      delete updatedEmployee.DateOfAssumption;
    }
  }
  db.employees[employeeIndex] = updatedEmployee;
  const previousNeedsById = new Map(
    db.learningNeeds.filter((ln) => ln.EmployeeID === id && ln.LearningNeedID).map((ln) => [ln.LearningNeedID, ln])
  );
  db.learningNeeds = db.learningNeeds.filter((ln) => ln.EmployeeID !== id);
  let maxLNId = [...db.learningNeeds, ...previousNeedsById.values()].reduce((max, ln) => ln.LearningNeedID > max ? ln.LearningNeedID : max, 0);
  needs.forEach((need) => {
    const existingNeed = need.LearningNeedID ? previousNeedsById.get(need.LearningNeedID) : null;
    const learningNeedId = existingNeed ? existingNeed.LearningNeedID : ++maxLNId;
    db.learningNeeds.push({
      LearningNeedID: learningNeedId,
      EmployeeID: id,
      LearningNeed: need.LearningNeed.trim(),
      Basis: Array.isArray(need.Basis) ? need.Basis.filter((item) => item && item.trim() !== "").join(", ").trim() : (need.Basis || "N/A").trim(),
      Methodology: Array.isArray(need.Methodology) ? need.Methodology.filter((item) => item && item.trim() !== "").join(", ").trim() : (need.Methodology || "N/A").trim(),
      TargetSchedule: (need.TargetSchedule || "N/A").trim(),
      CreatedAt: existingNeed?.CreatedAt || need.CreatedAt || (/* @__PURE__ */ new Date()).toISOString(),
      UpdatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      CreatedBy: existingNeed?.CreatedBy || need.CreatedBy || username,
      UpdatedBy: username
    });
  });
  ensureCustomOptionsExist(db.employees[employeeIndex], needs, db);
  writeDatabase(db);
  const changes = [];
  if (oldEmp.Office !== updatedEmployee.Office) changes.push(`Office changed: ${oldEmp.Office} \u2192 ${updatedEmployee.Office}`);
  if (oldEmp.Position !== updatedEmployee.Position) changes.push(`Position changed: ${oldEmp.Position} \u2192 ${updatedEmployee.Position}`);
  if (oldEmp.EmploymentStatus !== updatedEmployee.EmploymentStatus) changes.push(`Employment status changed: ${oldEmp.EmploymentStatus} \u2192 ${updatedEmployee.EmploymentStatus}`);
  if (oldEmp.NewlyHired !== updatedEmployee.NewlyHired) changes.push(`Newly hired changed: ${oldEmp.NewlyHired} \u2192 ${updatedEmployee.NewlyHired}`);
  if (oldEmp.Gender !== updatedEmployee.Gender) changes.push(`Gender changed: ${oldEmp.Gender} \u2192 ${updatedEmployee.Gender}`);
  createAuditLog({
    module: "Employee Management",
    action: "Employee Updated",
    entity_type: "employee",
    entity_id: id,
    entity_name: buildEmployeeName(updatedEmployee),
    description: changes.length > 0 ? changes.join("; ") : `Updated employee ${buildEmployeeName(updatedEmployee)}`,
    before_data: oldEmp,
    after_data: updatedEmployee,
    performed_by: username
  });
  return res.json({
    ...db.employees[employeeIndex],
    needs: db.learningNeeds.filter((ln) => ln.EmployeeID === id)
  });
});
app.delete("/api/employees/:id", requirePermission("employee:delete"), (req, res) => {
  const id = parseInt(req.params.id);
  const db = readDatabase();
  const deletedEmp = db.employees.find((emp) => emp.EmployeeID === id);
  if (!deletedEmp) {
    return res.status(404).json({ message: "Employee not found" });
  }
  db.employees = db.employees.filter((emp) => emp.EmployeeID !== id);
  db.learningNeeds = db.learningNeeds.filter((ln) => ln.EmployeeID !== id);
  writeDatabase(db);
  createAuditLog({
    module: "Employee Management",
    action: "Employee Deleted",
    entity_type: "employee",
    entity_id: id,
    entity_name: buildEmployeeName(deletedEmp),
    description: `Deleted employee ${buildEmployeeName(deletedEmp)}`,
    before_data: deletedEmp,
    performed_by: req.body?.username || "system"
  });
  return res.json({ message: "Employee and associated learning needs successfully deleted" });
});
app.post("/api/employees/:id/restore", (req, res) => {
  const db = readDatabase();
  const id = parseInt(req.params.id);
  const emp = db.employees.find((e) => e.EmployeeID === id);
  if (!emp) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }
  if (emp.isActive !== false) {
    res.status(400).json({ error: "Employee is not archived" });
    return;
  }
  emp.isActive = true;
  emp.UpdatedAt = (/* @__PURE__ */ new Date()).toISOString();
  emp.UpdatedBy = req.body?.performed_by || "Manual Restore";
  writeDatabase(db);
  createAuditLog({
    module: "Employee Management",
    action: "Employee Restored",
    entity_type: "employee",
    entity_id: id,
    entity_name: buildEmployeeName(emp),
    description: `Employee restored from archive`,
    before_data: { isActive: false },
    after_data: { isActive: true },
    performed_by: req.body?.performed_by || "Manual Restore"
  });
  return res.json({ message: "Employee restored successfully", employee: emp });
});
app.post("/api/employees/:id/learning-needs", (req, res) => {
  const employeeId = parseInt(req.params.id);
  const { learningNeed, basis, methodology, targetSchedule, username = "system" } = req.body;
  if (!learningNeed) {
    return res.status(400).json({ message: "Learning Need description is required" });
  }
  const db = readDatabase();
  const employeeExists = db.employees.some((emp) => emp.EmployeeID === employeeId);
  if (!employeeExists) {
    return res.status(404).json({ message: "Employee not found" });
  }
  const maxId = db.learningNeeds.reduce((max, ln) => ln.LearningNeedID > max ? ln.LearningNeedID : max, 0);
  const newNeed = {
    LearningNeedID: maxId + 1,
    EmployeeID: employeeId,
    LearningNeed: learningNeed.trim(),
    Basis: Array.isArray(basis) ? basis.filter((item) => item && item.trim() !== "").join(", ").trim() : (basis || "N/A").trim(),
    Methodology: Array.isArray(methodology) ? methodology.filter((item) => item && item.trim() !== "").join(", ").trim() : (methodology || "N/A").trim(),
    TargetSchedule: (targetSchedule || "N/A").trim(),
    CreatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    UpdatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    CreatedBy: username,
    UpdatedBy: username
  };
  db.learningNeeds.push(newNeed);
  writeDatabase(db);
  createAuditLog({
    module: "Employee Management",
    action: "Learning Need Created",
    entity_type: "learning_need",
    entity_id: newNeed.LearningNeedID,
    entity_name: newNeed.LearningNeed,
    description: `Added learning need "${newNeed.LearningNeed}" for employee ${employeeId}`,
    performed_by: username
  });
  return res.status(201).json(newNeed);
});
app.get("/api/learning-needs", (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.set("Pragma", "no-cache");
  const db = readDatabase();
  const { search = "", office = "", learningNeed = "", employmentType = "", employmentStatus = "", newlyHired = "", hasNeeds = "", archived = "", isArchived = "", sortBy = "LastName", sortOrder = "asc", targetSchedule = "" } = req.query;
  let results = [];
  const isArchivedRequested = archived === "true" || isArchived === "true";
  const targetEmployees = (db.employees || []).filter(
    (emp) => isArchivedRequested ? emp.isActive === false : emp.isActive !== false
  );
  const needsByEmployeeId = /* @__PURE__ */ new Map();
  (db.learningNeeds || []).forEach((ln) => {
    if (!needsByEmployeeId.has(ln.EmployeeID)) {
      needsByEmployeeId.set(ln.EmployeeID, []);
    }
    needsByEmployeeId.get(ln.EmployeeID).push(ln);
  });
  targetEmployees.forEach((emp) => {
    const empNeeds = needsByEmployeeId.get(emp.EmployeeID) || [];
    if (empNeeds.length > 0) {
      empNeeds.forEach((ln) => {
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
          NewlyHired: emp.NewlyHired || "N/A"
        });
      });
    } else {
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
        NewlyHired: emp.NewlyHired || "N/A"
      });
    }
  });
  if (search) {
    const terms = search.toLowerCase().split(/\s+/).filter((t) => t.length > 0);
    if (terms.length > 0) {
      results = results.filter((item) => {
        const searchString = `${item.FirstName} ${item.MiddleInitial || ""} ${item.LastName} ${item.Office || ""} ${item.Position || ""}`.toLowerCase();
        const commaName = `${item.LastName}, ${item.FirstName}`.toLowerCase();
        return terms.every((term) => searchString.includes(term) || commaName.includes(term));
      });
    }
  }
  if (office) {
    const o = office.toLowerCase();
    results = results.filter((item) => item.Office && item.Office.toLowerCase().includes(o));
  }
  if (learningNeed) {
    const lnVals = learningNeed.split("|").map((s) => s.toLowerCase().trim()).filter(Boolean);
    if (lnVals.length === 1 && lnVals[0] === "undefined (pending review)") {
      results = results.filter((item) => !item.LearningNeed || item.LearningNeed.toLowerCase().includes(lnVals[0]));
    } else if (lnVals.length > 0) {
      results = results.filter((item) => item.LearningNeed && lnVals.some((ln) => item.LearningNeed.toLowerCase().includes(ln)));
    }
  }
  if (employmentType) {
    const et = employmentType.toLowerCase();
    results = results.filter((item) => item.EmploymentType && item.EmploymentType.toLowerCase() === et);
  }
  if (employmentStatus) {
    const es = employmentStatus.toLowerCase();
    results = results.filter((item) => item.EmploymentStatus && item.EmploymentStatus.toLowerCase() === es);
  }
  if (newlyHired) {
    const nh = newlyHired.toLowerCase();
    results = results.filter((item) => item.NewlyHired && item.NewlyHired.toLowerCase() === nh);
  }
  if (hasNeeds === "true") {
    results = results.filter((item) => item.LearningNeedID !== null);
  }
  if (targetSchedule) {
    const selectedKeys = targetSchedule.split(",").map((s) => s.trim()).filter(Boolean);
    results = results.filter((item) => {
      if (!item.TargetSchedule) return false;
      const itemKeys = normalizeQuarterKeys(item.TargetSchedule);
      return selectedKeys.some((sk) => itemKeys.includes(sk));
    });
  }
  results.sort((a, b) => {
    let valA = a[sortBy] || "";
    let valB = b[sortBy] || "";
    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();
    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });
  return res.json(results);
});
function normalizeQuarterKeys(ts) {
  if (!ts) return [];
  const s = ts.trim();
  const keys = /* @__PURE__ */ new Set();
  const yearMatch = s.match(/(\d{4})/g);
  if (!yearMatch) return [];
  const years = [...new Set(yearMatch.map(Number))];
  const lower = s.toLowerCase().replace(/[^a-z0-9\s,\-]/g, " ").replace(/\s+/g, " ").trim();
  const qMap = { first: 1, second: 2, third: 3, fourth: 4, "1st": 1, "2nd": 2, "3rd": 3, "4th": 4 };
  const rangeMatch = lower.match(/(\d(?:st|nd|rd|th))\s*[-]\s*(\d(?:st|nd|rd|th))/);
  if (rangeMatch) {
    const start = qMap[rangeMatch[1]] || parseInt(rangeMatch[1]);
    const end = qMap[rangeMatch[2]] || parseInt(rangeMatch[2]);
    for (const y of years) for (let q = start; q <= end; q++) keys.add(`${y}-Q${q}`);
    return [...keys];
  }
  const parts = lower.split(/[,&]/);
  for (const part of parts) {
    let found = false;
    for (const [word, num] of Object.entries(qMap)) {
      if (part.includes(word)) {
        for (const y of years) keys.add(`${y}-Q${num}`);
        found = true;
      }
    }
    if (!found) {
      const digitMatch = part.match(/\b([1-4])\b/);
      if (digitMatch) {
        for (const y of years) keys.add(`${y}-Q${digitMatch[1]}`);
      }
    }
  }
  if (keys.size > 0) return [...keys];
  for (const [word, num] of Object.entries(qMap)) {
    if (lower.includes(word)) {
      for (const y of years) keys.add(`${y}-Q${num}`);
    }
  }
  if (lower.includes("quarter")) {
    const m = lower.match(/\b([1-4])\b/);
    if (m) for (const y of years) keys.add(`${y}-Q${m[1]}`);
  }
  return [...keys];
}
function quarterKeyToLabel(key) {
  const m = key.match(/^(\d{4})-Q(\d)$/);
  if (!m) return key;
  const qNames = ["", "1st", "2nd", "3rd", "4th"];
  return `${qNames[parseInt(m[2])]} Quarter ${m[1]}`;
}
app.get("/api/learning-needs/quarters", (_req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.set("Pragma", "no-cache");
  const db = readDatabase();
  const quarterMap = /* @__PURE__ */ new Map();
  const activeEmployeeIds = new Set((db.employees || []).filter((emp) => emp.isActive !== false).map((emp) => emp.EmployeeID));
  (db.learningNeeds || []).forEach((ln) => {
    if (!activeEmployeeIds.has(ln.EmployeeID)) return;
    const ts = (ln.TargetSchedule || "").trim();
    const keys = normalizeQuarterKeys(ts);
    for (const k of keys) {
      quarterMap.set(k, (quarterMap.get(k) || 0) + 1);
    }
  });
  const sorted = [...quarterMap.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([key, count]) => ({ key, label: quarterKeyToLabel(key), count }));
  return res.json(sorted);
});
app.delete("/api/learning-needs/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const db = readDatabase();
  const lnIndex = db.learningNeeds.findIndex((ln) => ln.LearningNeedID === id);
  if (lnIndex === -1) {
    return res.status(404).json({ message: "Learning need not found" });
  }
  const deletedLN = db.learningNeeds[lnIndex];
  db.learningNeeds.splice(lnIndex, 1);
  writeDatabase(db);
  const emp = db.employees.find((e) => e.EmployeeID === deletedLN.EmployeeID);
  createAuditLog({
    module: "Employee Management",
    action: "Learning Need Deleted",
    entity_type: "learning_need",
    entity_id: id,
    entity_name: deletedLN.LearningNeed,
    description: `Deleted learning need "${deletedLN.LearningNeed}" for employee ${emp ? buildEmployeeName(emp) : `#${deletedLN.EmployeeID}`}`,
    before_data: deletedLN,
    performed_by: req.body?.username || "system"
  });
  return res.json({ message: "Learning need deleted successfully" });
});
app.get("/api/export/excel", async (req, res) => {
  const { employeeId, office, search, learningNeed, startDate, endDate, employmentType, employmentStatus, newlyHired, hasNeeds } = req.query;
  const db = readDatabase();
  let results = [];
  db.employees.filter((emp) => emp.isActive !== false).forEach((emp) => {
    const empNeeds = db.learningNeeds.filter((ln) => ln.EmployeeID === emp.EmployeeID);
    if (empNeeds.length > 0) {
      empNeeds.forEach((ln) => {
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
          DateOfAssumption: emp.DateOfAssumption
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
        DateOfAssumption: emp.DateOfAssumption
      });
    }
  });
  if (employeeId) {
    const empId = parseInt(employeeId);
    results = results.filter((item) => item.EmployeeID === empId);
  }
  if (search) {
    const terms = search.toLowerCase().split(/\s+/).filter((t) => t.length > 0);
    if (terms.length > 0) {
      results = results.filter((item) => {
        const searchString = `${item.FirstName} ${item.LastName} ${item.Office || ""} ${item.Position || ""}`.toLowerCase();
        return terms.every((term) => searchString.includes(term));
      });
    }
  }
  if (office) {
    const o = office.toLowerCase();
    results = results.filter((item) => item.Office && item.Office.toLowerCase().includes(o));
  }
  if (learningNeed) {
    const lnVals = learningNeed.split("|").map((s) => s.toLowerCase().trim()).filter(Boolean);
    if (lnVals.length > 0) {
      results = results.filter((item) => item.LearningNeed && lnVals.some((ln) => item.LearningNeed.toLowerCase().includes(ln)));
    }
  }
  if (employmentType) {
    const et = employmentType.toLowerCase();
    results = results.filter((item) => item.EmploymentType && item.EmploymentType.toLowerCase() === et);
  }
  if (employmentStatus) {
    const es = employmentStatus.toLowerCase();
    results = results.filter((item) => item.EmploymentStatus && item.EmploymentStatus.toLowerCase() === es);
  }
  if (newlyHired) {
    const nh = newlyHired.toLowerCase();
    const matchingEmpIds = db.employees.filter((emp) => emp.NewlyHired && emp.NewlyHired.toLowerCase() === nh).map((emp) => emp.EmployeeID);
    results = results.filter((item) => matchingEmpIds.includes(item.EmployeeID));
  }
  if (startDate) {
    const sDate = new Date(startDate);
    results = results.filter((item) => new Date(item.CreatedAt) >= sDate);
  }
  if (endDate) {
    const eDate = new Date(endDate);
    eDate.setHours(23, 59, 59, 999);
    results = results.filter((item) => new Date(item.CreatedAt) <= eDate);
  }
  if (hasNeeds === "true") {
    results = results.filter((item) => item.LearningNeed !== "N/A");
  }
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Learning Needs Summary");
  worksheet.mergeCells("A1", "L1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = "INDIVIDUAL LEARNING AND DEVELOPMENT PLAN (ILDP) LEARNING NEEDS SUMMARY";
  titleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E3A8A" }
    // Navy blue brand color
  };
  worksheet.getRow(1).height = 40;
  worksheet.mergeCells("A2", "L2");
  const subCell = worksheet.getCell("A2");
  subCell.value = `Exported on: ${(/* @__PURE__ */ new Date()).toLocaleDateString()} | Total Records: ${results.length}`;
  subCell.font = { name: "Arial", size: 10, italic: true };
  subCell.alignment = { horizontal: "center" };
  worksheet.getRow(2).height = 20;
  worksheet.addRow([]);
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
    "Target Schedule"
  ]);
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF3B82F6" }
      // Accent Blue
    };
    cell.alignment = { horizontal: "left", vertical: "middle" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "medium" },
      right: { style: "thin" }
    };
  });
  results.forEach((item, index) => {
    const fullName = buildEmployeeName(item);
    const formattedDoa = item.DateOfAssumption ? new Date(item.DateOfAssumption).toLocaleDateString(void 0, { month: "short", day: "numeric", year: "numeric" }) : "N/A";
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
      item.TargetSchedule
    ]);
    row.height = 20;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: "Arial", size: 10 };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } }
      };
      cell.alignment = {
        horizontal: colNumber === 1 ? "center" : "left",
        vertical: "middle",
        wrapText: true
      };
      if (index % 2 === 1) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8FAFC" }
          // very light slate
        };
      }
    });
  });
  worksheet.columns.forEach((column, i) => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: false }, (cell) => {
      const value = cell.value ? cell.value.toString() : "";
      if (value.length > maxLength && cell.address !== "A1" && cell.address !== "A2") {
        maxLength = value.length;
      }
    });
    if (i === 0) column.width = 6;
    else if (i === 1) column.width = 25;
    else if (i === 2) column.width = 30;
    else if (i === 3) column.width = 25;
    else if (i === 4) column.width = 40;
    else if (i === 5) column.width = 25;
    else if (i === 6) column.width = 25;
    else if (i === 7) column.width = 20;
  });
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
app.post("/api/export/excel-custom", async (req, res) => {
  const { records, title } = req.body;
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: "No records provided" });
  }
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ILDP Pangasinan";
  workbook.created = /* @__PURE__ */ new Date();
  const worksheet = workbook.addWorksheet("ILDP Records", {
    views: [{ state: "frozen", ySplit: 4 }]
  });
  const numCols = 12;
  const lastCol = String.fromCharCode(64 + numCols);
  worksheet.mergeCells(`A1`, `${lastCol}1`);
  const titleCell = worksheet.getCell("A1");
  titleCell.value = title || "INDIVIDUAL LEARNING AND DEVELOPMENT PLAN (ILDP) RECORDS";
  titleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
  worksheet.getRow(1).height = 40;
  worksheet.mergeCells(`A2`, `${lastCol}2`);
  const subCell = worksheet.getCell("A2");
  const totalNeeds = records.reduce((sum, r) => sum + (r.needs?.length || (r.learningNeed ? 1 : 0)), 0);
  subCell.value = `Exported on: ${(/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} | Employees: ${records.length} | Total Learning Needs: ${totalNeeds}`;
  subCell.font = { name: "Arial", size: 10, italic: true, color: { argb: "FF64748B" } };
  subCell.alignment = { horizontal: "center", vertical: "middle" };
  subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  worksheet.getRow(2).height = 24;
  worksheet.getRow(3).height = 6;
  const headers = [
    "No.",
    "Employee Name",
    "Office/Department",
    "Position",
    "Employment Type",
    "Employment Status",
    "Gender",
    "Date of Assumption",
    "Learning Need",
    "Basis",
    "Methodology",
    "Target Schedule"
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
      right: { style: "thin" }
    };
  });
  let rowNum = 0;
  records.forEach((emp) => {
    const fullName = emp.name || `${emp.lastName || ""}, ${emp.firstName || ""} ${emp.middleInitial || ""}`.trim();
    const needs = emp.needs || (emp.learningNeed ? [{ learningNeed: emp.learningNeed, basis: emp.basis, methodology: emp.methodology, targetSchedule: emp.targetSchedule }] : []);
    if (needs.length === 0) {
      rowNum++;
      const row = worksheet.addRow([
        rowNum,
        fullName,
        emp.office || "",
        emp.position || "",
        emp.employmentType || "",
        emp.employmentStatus || "",
        emp.gender || "",
        emp.dateOfAssumption || "",
        "",
        "",
        "",
        ""
      ]);
      styleRow(row, rowNum);
    } else {
      needs.forEach((need) => {
        rowNum++;
        const row = worksheet.addRow([
          rowNum,
          fullName,
          emp.office || "",
          emp.position || "",
          emp.employmentType || "",
          emp.employmentStatus || "",
          emp.gender || "",
          emp.dateOfAssumption || "",
          need.learningNeed || "",
          need.basis || "",
          need.methodology || "",
          need.targetSchedule || ""
        ]);
        styleRow(row, rowNum);
      });
    }
  });
  function styleRow(row, idx) {
    row.height = 22;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: "Arial", size: 10 };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } }
      };
      cell.alignment = {
        horizontal: colNumber === 1 ? "center" : "left",
        vertical: "middle",
        wrapText: true
      };
      if (idx % 2 === 0) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
      }
    });
  }
  worksheet.getColumn(1).width = 6;
  worksheet.getColumn(2).width = 30;
  worksheet.getColumn(3).width = 32;
  worksheet.getColumn(4).width = 28;
  worksheet.getColumn(5).width = 18;
  worksheet.getColumn(6).width = 18;
  worksheet.getColumn(7).width = 10;
  worksheet.getColumn(8).width = 18;
  worksheet.getColumn(9).width = 40;
  worksheet.getColumn(10).width = 30;
  worksheet.getColumn(11).width = 30;
  worksheet.getColumn(12).width = 22;
  worksheet.autoFilter = { from: "A4", to: `${lastCol}4` };
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename=ILDP_Export_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.xlsx`);
  await workbook.xlsx.write(res);
  res.end();
});
var upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
var UPLOADS_DIR = path.join(process.cwd(), "uploads", "seminar-attachments");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
var diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    cb(null, `${req.params.id}_${Date.now()}${ext}`);
  }
});
var uploadDisk = multer({ storage: diskStorage, limits: { fileSize: 20 * 1024 * 1024 } });
function cleanImportStr(str) {
  if (!str) return "";
  return str.toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\b(jr|sr|ii|iii|iv|v)\b/gi, "").replace(/[^a-z0-9]/g, "").replace(/\s+/g, "");
}
function cleanImportWithSpaces(str) {
  if (!str) return "";
  return str.toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\b(jr|sr|ii|iii|iv|v)\b/gi, "").replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ");
}
function normField(val) {
  if (!val) return "";
  return val.toString().trim();
}
function parseExcelName(fullName) {
  if (!fullName || typeof fullName !== "string") {
    return { lastName: "", firstName: "", middleName: "", middleInitial: "", fullAfterComma: "" };
  }
  const rawParts = fullName.split(",").map((p) => p.trim()).filter((p) => p.length > 0);
  if (rawParts.length === 0) {
    return { lastName: "", firstName: "", middleName: "", middleInitial: "", fullAfterComma: "" };
  }
  let lastName = rawParts[0];
  let remainingParts = rawParts.slice(1);
  if (remainingParts.length > 0) {
    const p1Clean = remainingParts[0].replace(/\./g, "").trim().toLowerCase();
    if (["jr", "sr", "ii", "iii", "iv", "v", "1st", "2nd", "3rd"].includes(p1Clean)) {
      lastName = `${lastName}, ${remainingParts[0]}`;
      remainingParts = remainingParts.slice(1);
    }
  }
  const fullAfterComma = remainingParts.join(", ").trim();
  const words = fullAfterComma.split(/\s+/).filter((w) => w.length > 0);
  const cleanWords = [];
  let extractedSuffix = "";
  for (const w of words) {
    const wClean = w.replace(/[\.,]/g, "").trim().toLowerCase();
    if (["jr", "sr", "ii", "iii", "iv", "v"].includes(wClean)) {
      extractedSuffix = w.replace(/,/g, "").trim();
      if (!lastName.toLowerCase().includes(wClean)) {
        lastName = `${lastName}, ${extractedSuffix}`;
      }
    } else {
      cleanWords.push(w);
    }
  }
  let firstName = "";
  let middleName = "";
  let middleInitial = "";
  if (cleanWords.length === 1) {
    firstName = cleanWords[0];
  } else if (cleanWords.length > 1) {
    const lastWord = cleanWords[cleanWords.length - 1];
    const cleanLast = lastWord.replace(/\./g, "").trim();
    if (lastWord.endsWith(".") || cleanLast.length === 1 && /[A-Z]/i.test(cleanLast)) {
      middleInitial = cleanLast.toUpperCase() + ".";
      middleName = middleInitial;
      firstName = cleanWords.slice(0, -1).join(" ");
    } else {
      middleName = lastWord;
      middleInitial = cleanLast.charAt(0).toUpperCase() + ".";
      firstName = cleanWords.slice(0, -1).join(" ");
    }
  } else {
    firstName = fullAfterComma;
  }
  return {
    lastName,
    firstName,
    middleName,
    middleInitial,
    fullAfterComma
  };
}
function isWordBoundaryPrefix(longer, shorter) {
  if (!longer.startsWith(shorter)) return false;
  return longer.length === shorter.length || longer.charAt(shorter.length) === " ";
}
async function parseExcelBuffer(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  const results = [];
  const processedNames = /* @__PURE__ */ new Set();
  let currentOffice = "";
  let currentCategory = "";
  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    const cell1 = row.getCell(1).value;
    const cell2 = row.getCell(2).value;
    if (cell1 !== null && cell1 !== void 0 && typeof cell1 !== "number" && cell1 !== "No") {
      const text = cell1.toString().trim();
      const lower = text.toLowerCase();
      const lowerNoHyphen = lower.replace(/-/g, "");
      if (lower === "casual" || lower.includes("permanent") || lower === "consultant" || lower.includes("job order") || lowerNoHyphen.includes("coterminous") || lower.includes("elective official")) {
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
      const catLower = currentCategory.toLowerCase().replace(/-/g, "");
      const isCombinedCategory = catLower.includes("permanent") && catLower.includes("coterminous");
      const position = row.getCell(3).value?.toString().trim() || "Undefined (Pending Review)";
      const employmentStatus = row.getCell(4).value?.toString().trim() || "Undefined (Pending Review)";
      let employmentType = "Undefined (Pending Review)";
      if (isCombinedCategory) {
        const esLower = employmentStatus.toLowerCase().replace(/-/g, "");
        if (esLower.includes("coterminous")) employmentType = "Co-terminous";
        else if (esLower.includes("permanent")) employmentType = "Permanent";
        else if (esLower.includes("elective official")) employmentType = "Elective Official";
      } else {
        if (catLower.includes("job order")) employmentType = "Job Order";
        else if (catLower.includes("casual")) employmentType = "Casual";
        else if (catLower.includes("consultant")) employmentType = "Consultant";
        else if (catLower.includes("permanent")) employmentType = "Permanent";
        else if (catLower.includes("coterminous")) employmentType = "Co-terminous";
        else if (catLower.includes("elective official")) employmentType = "Elective Official";
      }
      const rawGender = row.getCell(5).value?.toString().trim();
      const gender = rawGender ? rawGender === "Female" || rawGender === "Male" ? rawGender : "Undefined (Pending Review)" : "Undefined (Pending Review)";
      const rawDoa = row.getCell(7).value;
      const dateOfAssumption = rawDoa instanceof Date ? rawDoa.toISOString() : rawDoa ? new Date(rawDoa).toISOString() : void 0;
      results.push({
        lastName: parsed.lastName,
        firstName: parsed.firstName,
        middleName: parsed.middleName,
        middleInitial: parsed.middleInitial,
        fullAfterComma: parsed.fullAfterComma,
        position,
        employmentStatus,
        employmentType,
        office: currentOffice,
        gender,
        dateOfAssumption,
        rawName
      });
    }
  }
  return results;
}
function matchScore(dbEmp, excelRow) {
  const dbLast = cleanImportStr(dbEmp.LastName);
  const excelLast = cleanImportStr(excelRow.lastName);
  if (dbLast !== excelLast && !dbLast.includes(excelLast) && !excelLast.includes(dbLast)) {
    return 0;
  }
  const dbFirst = cleanImportStr(dbEmp.FirstName);
  const excelFirst = cleanImportStr(excelRow.firstName);
  const dbAfterComma = cleanImportStr(`${dbEmp.FirstName} ${dbEmp.MiddleName || dbEmp.MiddleInitial || ""}`);
  const excelAfterComma = cleanImportStr(excelRow.fullAfterComma || excelRow.firstName);
  let nameScore = 0;
  if (dbFirst === excelFirst || dbAfterComma === excelAfterComma || dbFirst === excelAfterComma) {
    nameScore = 100;
  } else if (dbFirst === "" || excelFirst === "") {
    nameScore = 30;
  } else {
    const dbFirstWithSpace = cleanImportWithSpaces(dbEmp.FirstName);
    const excelFirstWithSpace = cleanImportWithSpaces(excelRow.firstName);
    if (isWordBoundaryPrefix(dbFirstWithSpace, excelFirstWithSpace) || isWordBoundaryPrefix(excelFirstWithSpace, dbFirstWithSpace)) {
      nameScore = 70;
    }
  }
  if (nameScore === 0) return 0;
  const dbMN = cleanImportStr(dbEmp.MiddleName);
  const excelMN = cleanImportStr(excelRow.middleName);
  const dbMI = cleanImportStr(dbEmp.MiddleInitial || (dbMN ? dbMN.charAt(0) : ""));
  const excelMI = cleanImportStr(excelRow.middleInitial || (excelMN ? excelMN.charAt(0) : ""));
  let middleScore = 0;
  if (dbMN && excelMN && dbMN.length > 1 && excelMN.length > 1) {
    if (dbMN === excelMN) {
      middleScore = 25;
    } else {
      return 0;
    }
  } else if (dbMI && excelMI) {
    if (dbMI === excelMI) {
      middleScore = 10;
    } else {
      return 0;
    }
  }
  let score = nameScore + middleScore;
  const dbOffice = cleanImportStr(dbEmp.Office);
  const excelOffice = cleanImportStr(excelRow.office);
  if (dbOffice && excelOffice) {
    if (dbOffice === excelOffice) score += 15;
    else if (dbOffice.includes(excelOffice) || excelOffice.includes(dbOffice)) score += 8;
  }
  const dbET = cleanImportStr(dbEmp.EmploymentType);
  const excelET = cleanImportStr(excelRow.employmentType);
  if (dbET && excelET && dbET === excelET) score += 15;
  return score;
}
function findBestDbMatch(dbEmployees, excelRow, debugName) {
  let best = null;
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
function fieldsDiffer(a, b) {
  return normField(a) !== normField(b);
}
app.post("/api/import/preview", requirePermission("import:data"), upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    const excelRows = await parseExcelBuffer(req.file.buffer);
    const db = readDatabase();
    const dbEmployees = db.employees || [];
    const matchedDbIds = /* @__PURE__ */ new Set();
    const toAdd = [];
    const toUpdate = [];
    for (const exRow of excelRows) {
      const match = findBestDbMatch(dbEmployees, exRow, `${exRow.lastName}, ${exRow.firstName}`);
      if (match) {
        matchedDbIds.add(match.EmployeeID);
        const changes = {};
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
            name: buildEmployeeName(match),
            office: match.Office,
            changes
          });
        }
      } else {
        toAdd.push(exRow);
      }
    }
    const toArchive = dbEmployees.filter((emp) => !matchedDbIds.has(emp.EmployeeID) && emp.isActive !== false).map((emp) => {
      const needsCount = (db.learningNeeds || []).filter((ln) => ln.EmployeeID === emp.EmployeeID).length;
      const seminarCount = (db.seminarAttendees || []).filter((sa) => sa.employeeId === emp.EmployeeID).length;
      return {
        employeeId: emp.EmployeeID,
        name: buildEmployeeName(emp),
        office: emp.Office,
        needsCount,
        seminarCount
      };
    });
    res.json({
      totalInExcel: excelRows.length,
      totalInDb: dbEmployees.filter((e) => e.isActive !== false).length,
      stats: { toAdd: toAdd.length, toUpdate: toUpdate.length, toArchive: toArchive.length },
      toAdd,
      toUpdate,
      toArchive
    });
  } catch (error) {
    console.error("Import preview error:", error);
    res.status(500).json({ error: "Failed to parse Excel file: " + error.message });
  }
});
app.post("/api/import/execute", requirePermission("import:data"), express.json({ limit: "50mb" }), async (req, res) => {
  try {
    const { toAdd, toUpdate, toArchive } = req.body;
    if (!Array.isArray(toAdd) || !Array.isArray(toUpdate) || !Array.isArray(toArchive)) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }
    const db = readDatabase();
    const backupPath = DB_FILE + ".backup-" + Date.now();
    fs.copyFileSync(DB_FILE, backupPath);
    const currentTime = (/* @__PURE__ */ new Date()).toISOString();
    const archiveIds = new Set(toArchive.map((d) => d.employeeId));
    const updateMap = /* @__PURE__ */ new Map();
    for (const u of toUpdate) updateMap.set(u.employeeId, u);
    let createdCount = 0;
    let updatedCount = 0;
    let archivedCount = 0;
    for (const emp of db.employees) {
      if (archiveIds.has(emp.EmployeeID)) {
        emp.isActive = false;
        emp.UpdatedAt = currentTime;
        emp.UpdatedBy = "Excel Import (Archived)";
        archivedCount++;
        createAuditLog({
          module: "Employee Import",
          action: "Employee Archived",
          entity_type: "employee",
          entity_id: emp.EmployeeID,
          entity_name: buildEmployeeName(emp),
          description: `Employee archived during Excel sync \u2014 no longer in source file`,
          before_data: { Office: emp.Office, Position: emp.Position, isActive: true },
          after_data: { isActive: false },
          performed_by: "Excel Import"
        });
      }
    }
    for (const emp of db.employees) {
      const update = updateMap.get(emp.EmployeeID);
      if (update) {
        const changedFields = [];
        if (update.changes.Position) {
          emp.Position = update.changes.Position.new;
          changedFields.push("Position");
        }
        if (update.changes.EmploymentStatus) {
          emp.EmploymentStatus = update.changes.EmploymentStatus.new;
          changedFields.push("EmploymentStatus");
        }
        if (update.changes.Office) {
          emp.Office = update.changes.Office.new;
          changedFields.push("Office");
        }
        if (update.changes.Gender) {
          emp.Gender = update.changes.Gender.new;
          changedFields.push("Gender");
        }
        if (update.changes.EmploymentType) {
          emp.EmploymentType = update.changes.EmploymentType.new;
          changedFields.push("EmploymentType");
        }
        if (update.changes.DateOfAssumption) {
          emp.DateOfAssumption = update.changes.DateOfAssumption.new;
          changedFields.push("DateOfAssumption");
        }
        emp.UpdatedAt = currentTime;
        emp.UpdatedBy = "Excel Import";
        updatedCount++;
        createAuditLog({
          module: "Employee Import",
          action: "Employee Updated",
          entity_type: "employee",
          entity_id: emp.EmployeeID,
          entity_name: buildEmployeeName(emp),
          description: `Updated fields: ${changedFields.join(", ")}`,
          before_data: update.changes,
          after_data: Object.fromEntries(Object.entries(update.changes).map(([k, v]) => [k, v.new])),
          performed_by: "Excel Import"
        });
      }
    }
    let maxId = db.employees.reduce((max, emp) => emp.EmployeeID > max ? emp.EmployeeID : max, 0);
    for (const addRow of toAdd) {
      maxId++;
      const newEmp = {
        EmployeeID: maxId,
        FirstName: addRow.firstName,
        MiddleName: addRow.middleName || addRow.middleInitial,
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
        isActive: true
      };
      db.employees.push(newEmp);
      ensureCustomOptionsExist(newEmp, [], db);
      createdCount++;
      createAuditLog({
        module: "Employee Import",
        action: "Employee Added",
        entity_type: "employee",
        entity_id: maxId,
        entity_name: buildEmployeeName(newEmp),
        description: `New employee added from Excel import`,
        after_data: { Office: newEmp.Office, Position: newEmp.Position },
        performed_by: "Excel Import"
      });
    }
    for (const u of toUpdate) {
      const emp = db.employees.find((e) => e.EmployeeID === u.employeeId);
      if (emp) ensureCustomOptionsExist(emp, [], db);
    }
    writeDatabase(db);
    createAuditLog({
      module: "Employee Import",
      action: "Excel Import Completed",
      entity_type: "employee_import",
      entity_id: null,
      entity_name: `Excel Import (${currentTime.slice(0, 10)})`,
      description: `Import completed: ${createdCount} created, ${updatedCount} updated, ${archivedCount} archived`,
      after_data: { createdCount, updatedCount, archivedCount, timestamp: currentTime },
      performed_by: "Excel Import"
    });
    res.json({
      success: true,
      created: createdCount,
      updated: updatedCount,
      archived: archivedCount,
      totalNow: db.employees.filter((e) => e.isActive !== false).length,
      backup: backupPath
    });
  } catch (error) {
    console.error("Import execute error:", error);
    res.status(500).json({ error: "Failed to execute import: " + error.message });
  }
});
app.get("/api/seminars", (req, res) => {
  try {
    const db = readDatabase();
    const seminars = (db.seminars || []).map((sem) => {
      const attendeeMappings = (db.seminarAttendees || []).filter((sa) => sa.seminarId === sem.id);
      return { ...sem, attendees: attendeeMappings.map((sa) => ({ EmployeeID: sa.employeeId })) };
    });
    res.json(seminars);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/seminars/years", (req, res) => {
  try {
    const db = readDatabase();
    const yearsMap = /* @__PURE__ */ new Map();
    (db.seminarYears || []).forEach((yr) => {
      if (!yearsMap.has(yr)) yearsMap.set(yr, { Q1: 0, Q2: 0, Q3: 0, Q4: 0 });
    });
    (db.seminars || []).forEach((sem) => {
      const yr = sem.year;
      if (!yearsMap.has(yr)) yearsMap.set(yr, { Q1: 0, Q2: 0, Q3: 0, Q4: 0 });
      const quarters = yearsMap.get(yr);
      if (sem.quarter && quarters[sem.quarter] !== void 0) {
        quarters[sem.quarter]++;
      }
    });
    const years = Array.from(yearsMap.entries()).map(([year, quarters]) => ({ year, quarters })).sort((a, b) => b.year - a.year);
    res.json({ years });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
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
    db.seminarYears.sort((a, b) => b - a);
    writeDatabase(db);
    createAuditLog({
      module: "Seminar Module",
      action: "Year Created",
      entity_type: "seminar_year",
      entity_id: year,
      entity_name: `Year ${year}`,
      description: `Created seminar year ${year}`,
      performed_by: req.body?.username
    });
    res.json({ success: true, year });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.delete("/api/seminars/years/:year", requirePermission("seminar:year:delete"), (req, res) => {
  try {
    const year = parseInt(req.params.year);
    if (isNaN(year)) return res.status(400).json({ error: "Invalid year." });
    const db = readDatabase();
    const seminarsToRemove = (db.seminars || []).filter((s) => s.year === year);
    const semIds = seminarsToRemove.map((s) => s.id);
    const attendeeCount = (db.seminarAttendees || []).filter((sa) => semIds.includes(sa.seminarId)).length;
    db.seminars = (db.seminars || []).filter((s) => s.year !== year);
    db.seminarAttendees = (db.seminarAttendees || []).filter((sa) => !semIds.includes(sa.seminarId));
    db.seminarYears = (db.seminarYears || []).filter((y) => y !== year);
    writeDatabase(db);
    createAuditLog({
      module: "Seminar Module",
      action: "Year Deleted",
      entity_type: "seminar_year",
      entity_id: year,
      entity_name: `Year ${year}`,
      description: `Deleted year ${year} with ${seminarsToRemove.length} seminars and ${attendeeCount} attendee associations`,
      before_data: { year, seminarsRemoved: seminarsToRemove.length, attendeeAssociationsRemoved: attendeeCount },
      performed_by: req.body?.username
    });
    res.json({
      success: true,
      year,
      seminarsRemoved: seminarsToRemove.length,
      attendeeAssociationsRemoved: attendeeCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/seminars/years/:year", (req, res) => {
  try {
    const year = parseInt(req.params.year);
    if (isNaN(year)) return res.status(400).json({ error: "Invalid year." });
    const db = readDatabase();
    const seminarsInYear = (db.seminars || []).filter((s) => s.year === year);
    const semIds = seminarsInYear.map((s) => s.id);
    const attendeeCount = (db.seminarAttendees || []).filter((sa) => semIds.includes(sa.seminarId)).length;
    res.json({
      year,
      seminarsRemoved: seminarsInYear.length,
      attendeeAssociationsRemoved: attendeeCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/seminars/:id", (req, res) => {
  try {
    const db = readDatabase();
    const sem = (db.seminars || []).find((s) => s.id === req.params.id);
    if (!sem) {
      res.status(404).json({ error: "Seminar not found" });
      return;
    }
    const attendeeMappings = (db.seminarAttendees || []).filter((sa) => sa.seminarId === sem.id);
    const attendees = attendeeMappings.map((sa) => {
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
      if (sa.participantType === "unmatched") {
        return {
          id: sa.id,
          EmployeeID: null,
          participantType: "unmatched",
          displayName: sa.displayName || sa.rawName || "Unknown",
          rawName: sa.rawName || "",
          organization: sa.organization || "",
          role: sa.role || "",
          remarks: sa.remarks || "",
          FirstName: sa.displayName || sa.rawName || "Unknown",
          MiddleInitial: "",
          LastName: "",
          Office: sa.organization || "",
          Position: sa.role || ""
        };
      }
      if (sa.participantType === "encode_later") {
        return {
          id: sa.id,
          EmployeeID: null,
          participantType: "encode_later",
          displayName: sa.displayName || "Unknown",
          organization: sa.organization || "",
          role: sa.role || "",
          remarks: sa.remarks || "To be encoded",
          FirstName: sa.displayName || "Unknown",
          MiddleInitial: "",
          LastName: "(Encode Later)",
          Office: sa.organization || "",
          Position: sa.role || ""
        };
      }
      const emp = (db.employees || []).find((e) => e.EmployeeID === sa.employeeId);
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
      attachment: sem.attachment,
      attachments: sem.attachments || (sem.attachment ? [sem.attachment] : []),
      attendees
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.delete("/api/seminars/:id", requirePermission("seminar:delete"), (req, res) => {
  try {
    const db = readDatabase();
    const deletedSem = (db.seminars || []).find((s) => s.id === req.params.id);
    const attendeeCount = (db.seminarAttendees || []).filter((sa) => sa.seminarId === req.params.id).length;
    db.seminars = (db.seminars || []).filter((s) => s.id !== req.params.id);
    db.seminarAttendees = (db.seminarAttendees || []).filter((sa) => sa.seminarId !== req.params.id);
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
        performed_by: req.body?.username
      });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
function cellToString(val) {
  if (val === null || val === void 0) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (val && typeof val === "object" && Array.isArray(val.richText)) {
    return val.richText.map((r) => r.text || "").join("");
  }
  if (val && typeof val === "object" && val.text) return String(val.text);
  return String(val);
}
function parseNamesFromText(text) {
  const result = [];
  for (let line of text.split(/\r?\n/)) {
    line = line.trim();
    if (!line) continue;
    if (line.includes(";")) {
      for (const s of line.split(";")) result.push(s.trim());
      continue;
    }
    if (line.includes("	")) {
      line = line.replace(/\t/g, " ");
    }
    result.push(line);
  }
  return result.map(cleanName).filter((n) => n !== null);
}
function cleanName(name) {
  let c = name.trim();
  if (!c) return null;
  c = c.replace(/^[\d]+[.)\]\s]+\s*/, "");
  c = c.replace(/^[-–—•●◦▪▸→⇒‣⁃◇◆▪▫▬☐☑☒✓✔✕✖✗✘]+\s*/, "");
  c = c.replace(/^\[\s*[xX\s]?\s*\]\s*/, "");
  c = c.replace(/^\(?\s*[✓✔☑✗✘xX]\s*\)?\s*/i, "");
  c = c.replace(/^[*+>|:·•]+\s*/, "");
  c = c.replace(/\s+/g, " ").trim();
  if (c.length < 2) return null;
  if (!/[A-Za-z]{2,}/.test(c)) return null;
  return c;
}
app.post("/api/seminars/import-from-text", requirePermission("seminar:import"), express.json({ limit: "10mb" }), async (req, res) => {
  try {
    const { text, officesText, title, year, quarter, date, location, remarks } = req.body;
    if (!text || !text.trim()) {
      res.status(400).json({ error: "No text provided" });
      return;
    }
    const rawNames = parseNamesFromText(text);
    const rawOffices = officesText ? parseNamesFromText(officesText) : [];
    if (rawNames.length === 0) {
      res.status(400).json({ error: "No valid names found in the text. Please check your input and try again." });
      return;
    }
    const nameCounts = /* @__PURE__ */ new Map();
    for (const n of rawNames) {
      const key = normalizeName(n);
      nameCounts.set(key, (nameCounts.get(key) || 0) + 1);
    }
    const duplicates = [...nameCounts.entries()].filter(([, count]) => count > 1).map(([name, count]) => ({ name, count }));
    const seen = /* @__PURE__ */ new Set();
    const uniqueNames = [];
    const uniqueOffices = [];
    for (let i = 0; i < rawNames.length; i++) {
      const n = rawNames[i];
      const key = normalizeName(n);
      if (seen.has(key)) continue;
      seen.add(key);
      uniqueNames.push(n);
      uniqueOffices.push(rawOffices[i] || "");
    }
    const db = readDatabase();
    const dbEmployees = db.employees || [];
    const rawEmployees = uniqueNames.map((name, i) => ({
      rawName: name,
      office: uniqueOffices[i],
      position: "",
      _key: `paste_${i}_${normalizeName(name).slice(0, 20)}`
    }));
    const { attendees } = matchEmployees(rawEmployees, dbEmployees);
    const matchedCount = attendees.filter((a) => a.status === "matched").length;
    const reviewCount = attendees.filter((a) => a.status === "review").length;
    const unmatchedCount = attendees.filter((a) => a.status === "unmatched").length;
    res.json({
      title: title || "",
      year: Number(year) || (/* @__PURE__ */ new Date()).getFullYear(),
      quarter: quarter || "Q2",
      date: date || "",
      location: location || "",
      remarks: remarks || "",
      attendees,
      rawEmployees,
      totalNames: uniqueNames.length,
      matchedCount,
      reviewCount,
      unmatchedCount,
      accuracy: uniqueNames.length > 0 ? Math.round(matchedCount / uniqueNames.length * 100) : 0,
      reviewRecommended: attendees.some((a) => a.status === "review" || a.status === "unmatched"),
      duplicates: duplicates.length > 0 ? duplicates : void 0
    });
  } catch (error) {
    console.error("Text import preview error:", error);
    res.status(500).json({ error: "Failed to parse names: " + error.message });
  }
});
app.post("/api/seminars/import-preview", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const sheet = workbook.worksheets[0];
    let parsedTitle = "";
    let parsedYear = 2026;
    let parsedDate = "";
    let parsedQuarter = "Q2";
    const origName = req.file.originalname || "";
    const cleanOrigName = origName.replace(/\.xlsx$/i, "").replace(/[-_]+/g, " ");
    const lowerName = cleanOrigName.toLowerCase();
    if (lowerName.includes("1st quarter") || lowerName.includes("q1")) parsedQuarter = "Q1";
    else if (lowerName.includes("2nd quarter") || lowerName.includes("q2")) parsedQuarter = "Q2";
    else if (lowerName.includes("3rd quarter") || lowerName.includes("q3")) parsedQuarter = "Q3";
    else if (lowerName.includes("4th quarter") || lowerName.includes("q4")) parsedQuarter = "Q4";
    const titleCandidates = [];
    for (let r = 1; r <= Math.min(8, sheet.rowCount); r++) {
      const row = sheet.getRow(r);
      for (let c = 1; c <= 8; c++) {
        const val = cellToString(row.getCell(c).value).trim();
        if (!val) continue;
        const yrMatch = val.match(/\b(20\d{2})\b/);
        if (yrMatch && !parsedYear) {
          parsedYear = parseInt(yrMatch[1], 10);
        }
        const monthMatches = val.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\b/i);
        if (monthMatches) {
          const m = monthMatches[1].toLowerCase();
          if (["january", "february", "march", "jan", "feb", "mar"].some((x) => m.startsWith(x))) parsedQuarter = "Q1";
          else if (["april", "may", "june", "apr", "jun"].some((x) => m.startsWith(x))) parsedQuarter = "Q2";
          else if (["july", "august", "september", "jul", "aug", "sep"].some((x) => m.startsWith(x))) parsedQuarter = "Q3";
          else if (["october", "november", "december", "oct", "nov", "dec"].some((x) => m.startsWith(x))) parsedQuarter = "Q4";
        }
        const upper = val.toUpperCase();
        if (upper.includes("PROVINCE OF") || upper.includes("REPUBLIC OF THE PHILIPPINES") || upper.includes("HUMAN RESOURCE") || upper.includes("ATTENDANCE SHEET") || upper.includes("LIST OF PARTICIPANTS") || upper.includes("SIGNATURE SHEET")) {
          continue;
        }
        if (val.length >= 4 && val.length < 150) {
          const alreadyAdded = titleCandidates.some(
            (t) => t.toLowerCase().includes(val.toLowerCase()) || val.toLowerCase().includes(t.toLowerCase())
          );
          if (!alreadyAdded) {
            titleCandidates.push(val);
          }
        }
      }
    }
    if (titleCandidates.length > 0) {
      parsedTitle = titleCandidates.slice(0, 2).join(" - ");
    } else {
      parsedTitle = cleanOrigName;
    }
    let headerRowIdx = 0;
    let idCol = -1;
    let nameCol = -1;
    let firstNameCol = -1;
    let lastNameCol = -1;
    let middleNameCol = -1;
    let suffixCol = -1;
    let officeCol = -1;
    let positionCol = -1;
    let bestScore = 0;
    let bestRow = 0;
    let bestCols = {};
    for (let i = 1; i <= Math.min(20, sheet.rowCount); i++) {
      const row = sheet.getRow(i);
      const vals = row.values;
      if (!vals) continue;
      let rowScore = 0;
      let cols = {};
      const valArr = Array.isArray(vals) ? vals : Object.values(vals);
      const colCount = Math.min(valArr.length, 15);
      for (let c = 1; c <= colCount; c++) {
        const cellVal = row.getCell(c).value;
        const v = cellToString(cellVal).toLowerCase().trim();
        if (!v) continue;
        if (v.includes("seminar title") || v.includes("title of seminar") || v.includes("name of seminar") || v.includes("training title") || v.includes("evaluation form") || v.includes("attendance sheet") || v.includes("list of participants") || v.includes("province of") || v.includes("republic of")) continue;
        if (v.includes("employee") && (v.includes("id") || v.includes("no")) || v === "id" || v === "emp id" || v === "emp no" || v === "no" || v === "no.") {
          rowScore++;
          cols.idCol = c;
          continue;
        }
        if (v === "first name" || v === "firstname" || v === "given name" || v === "first" || v.includes("first name")) {
          if (v === "first name" || v === "firstname" || v === "given name" || v === "first") {
            rowScore++;
            cols.firstNameCol = c;
            continue;
          }
        }
        if (v === "last name" || v === "lastname" || v === "surname" || v === "family name" || v === "last" || v.includes("last name")) {
          if (v === "last name" || v === "lastname" || v === "surname" || v === "family name" || v === "last") {
            rowScore++;
            cols.lastNameCol = c;
            continue;
          }
        }
        if (v === "middle name" || v === "middlename" || v === "middle initial" || v === "mi" || v.includes("middle name")) {
          if (v === "middle name" || v === "middlename" || v === "middle initial" || v === "mi") {
            rowScore++;
            cols.middleNameCol = c;
            continue;
          }
        }
        if (v === "suffix" || v === "name suffix" || v === "ext" || v === "extension") {
          rowScore++;
          cols.suffixCol = c;
        }
        if (v === "name" || v === "names" || v === "employee name" || v === "name of employee" || v === "participant name" || v === "name of participant" || v === "full name" || v === "participant" || v === "participants" || v === "attendee" || v === "attendees" || v.includes("name") && !v.includes("seminar") && !v.includes("training")) {
          rowScore++;
          if (!cols.nameCol) cols.nameCol = c;
        }
        if (v === "office" || v === "department" || v === "division" || v === "agency" || v === "station" || v.includes("office") || v.includes("department") || v.includes("division")) {
          rowScore++;
          if (!cols.officeCol) cols.officeCol = c;
        }
        if ((v === "position" || v === "designation" || v === "job title" || v.includes("position") || v.includes("designation")) && !v.includes("seminar") && !v.includes("training")) {
          rowScore++;
          if (!cols.positionCol) cols.positionCol = c;
        }
        if (v.includes("signature") || v === "sign") rowScore++;
      }
      const hasName = cols.nameCol > 0 || cols.firstNameCol > 0 && cols.lastNameCol > 0;
      if (rowScore > bestScore && hasName) {
        bestScore = rowScore;
        bestRow = i;
        bestCols = cols;
      }
    }
    if (bestScore >= 1) {
      headerRowIdx = bestRow;
      idCol = bestCols.idCol || -1;
      nameCol = bestCols.nameCol || -1;
      firstNameCol = bestCols.firstNameCol || -1;
      lastNameCol = bestCols.lastNameCol || -1;
      middleNameCol = bestCols.middleNameCol || -1;
      suffixCol = bestCols.suffixCol || -1;
      officeCol = bestCols.officeCol || -1;
      positionCol = bestCols.positionCol || -1;
    } else {
      for (let r = 1; r <= Math.min(15, sheet.rowCount); r++) {
        const row = sheet.getRow(r);
        for (let c = 1; c <= 5; c++) {
          const val = cellToString(row.getCell(c).value).trim();
          if (val && isLikelyPersonName(val)) {
            const lowerVal = val.toLowerCase();
            if (!lowerVal.includes("seminar") && !lowerVal.includes("training") && !lowerVal.includes("evaluation") && !lowerVal.includes("province") && !lowerVal.includes("republic")) {
              headerRowIdx = r - 1;
              nameCol = c;
              if (c > 1) {
                idCol = 1;
                if (c === 2) officeCol = 3;
              }
              break;
            }
          }
        }
        if (nameCol > 0) break;
      }
      if (headerRowIdx < 1) headerRowIdx = 4;
      if (nameCol < 0) nameCol = 2;
    }
    const db = readDatabase();
    const dbEmployees = db.employees || [];
    const rawEmployees = [];
    let tableEndRow = sheet.rowCount;
    {
      let emptyRun = 0;
      for (let i = headerRowIdx + 1; i <= sheet.rowCount; i++) {
        const row = sheet.getRow(i);
        const trackedCols = [nameCol, idCol, officeCol].filter((c) => c > 0);
        const hasAnyContent = trackedCols.some((c) => {
          const v = cellToString(row.getCell(c).value).trim();
          return v.length > 0;
        });
        if (!hasAnyContent) {
          emptyRun++;
          if (emptyRun >= 2) {
            tableEndRow = i - emptyRun;
            break;
          }
        } else {
          emptyRun = 0;
          const cn = cellToString(row.getCell(nameCol).value).toLowerCase().trim();
          if (cn) {
            if (/^(total|subtotal|grand\s*total|prepared\s+by|approved\s+by|noted\s+by|attested\s+by|certified\s+by|verified\s+by|received\s+by)/i.test(cn)) {
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
      const cellOffice = officeCol > 0 ? row.getCell(officeCol).value : null;
      const cellPosition = positionCol > 0 ? row.getCell(positionCol).value : null;
      let nameVal = "";
      let officeVal = "";
      let positionVal = "";
      if (firstNameCol > 0 || lastNameCol > 0) {
        const fn = firstNameCol > 0 ? cellToString(row.getCell(firstNameCol).value).trim() : "";
        const ln = lastNameCol > 0 ? cellToString(row.getCell(lastNameCol).value).trim() : "";
        const mn = middleNameCol > 0 ? cellToString(row.getCell(middleNameCol).value).trim() : "";
        const sfx = suffixCol > 0 ? cellToString(row.getCell(suffixCol).value).trim() : "";
        if (!ln && fn) {
          nameVal = fn;
        } else if (ln && !fn) {
          nameVal = ln;
        } else if (ln && fn) {
          const mi = mn ? mn.length <= 2 ? mn.toUpperCase() + (mn.endsWith(".") ? "" : ".") : mn : "";
          nameVal = [ln, fn, mi, sfx].filter(Boolean).join(" ");
        }
      }
      if (!nameVal && nameCol > 0) {
        nameVal = cellToString(row.getCell(nameCol).value).trim();
      }
      if (!nameVal || nameVal.length < 3) {
        for (let c = 1; c <= Math.min(6, sheet.columnCount || 6); c++) {
          if (c === idCol || c === officeCol || c === positionCol) continue;
          const v = cellToString(row.getCell(c).value).trim();
          if (v.length >= 3 && isLikelyPersonName(v)) {
            nameVal = v;
            break;
          }
        }
      }
      const lowerName2 = nameVal.toLowerCase();
      if (lowerName2.includes("seminar title") || lowerName2.includes("training title") || lowerName2.includes("evaluation form") || lowerName2.includes("attendance sheet") || lowerName2.includes("list of participants") || lowerName2.includes("province of") || lowerName2.includes("republic of")) {
        continue;
      }
      officeVal = cellToString(cellOffice).trim();
      positionVal = cellToString(cellPosition).trim();
      if (!isLikelyPersonName(nameVal)) {
        continue;
      }
      const normName = normalizeText(nameVal);
      const alreadyParsed = rawEmployees.some((r) => normalizeText(r.rawName) === normName);
      if (alreadyParsed) continue;
      rawEmployees.push({
        rawName: nameVal,
        office: officeVal,
        position: positionVal,
        employeeId: cellToString(cellId).trim() || void 0,
        _key: `emp_${i}_${normalizeText(nameVal).slice(0, 20)}`
      });
    }
    const { attendees } = matchEmployees(rawEmployees, dbEmployees);
    const matchedCount = attendees.filter((a) => a.status === "matched").length;
    const totalNames = rawEmployees.length;
    const accuracy = totalNames > 0 ? Math.round(matchedCount / totalNames * 100) : 100;
    const reviewRecommended = attendees.some((a) => a.status === "review" || a.status === "unmatched");
    console.log(`[IMPORT] header=${headerRowIdx} nameCol=${nameCol} fNameCol=${firstNameCol} lNameCol=${lastNameCol} tableEnd=${tableEndRow} raw=${rawEmployees.length} att=${attendees.length} matched=${matchedCount} accuracy=${accuracy}% title="${parsedTitle.slice(0, 60)}"`);
    res.json({
      title: parsedTitle,
      year: parsedYear,
      quarter: parsedQuarter,
      date: parsedDate,
      totalParsed: attendees.length,
      totalNames,
      matchedCount,
      accuracy,
      attendees,
      rawEmployees,
      reviewRecommended
    });
  } catch (error) {
    console.error("Seminar import preview error:", error);
    res.status(500).json({ error: "Failed to preview seminar Excel: " + error.message });
  }
});
app.post("/api/seminars/import-reprocess", requirePermission("seminar:import"), (req, res) => {
  try {
    const { employees } = req.body;
    if (!Array.isArray(employees)) {
      res.status(400).json({ error: "Missing employees array" });
      return;
    }
    const db = readDatabase();
    const dbEmployees = db.employees || [];
    const { attendees } = matchEmployees(employees, dbEmployees);
    const confirmedCount = attendees.filter((a) => a.status === "matched").length;
    const reviewCount = attendees.filter((a) => a.status === "review").length;
    const unmatchedCount = attendees.filter((a) => a.status === "unmatched").length;
    createAuditLog({
      module: "Seminar Import",
      action: "Employee Matched",
      entity_type: "seminar_import",
      entity_id: null,
      entity_name: `Reprocessed matching (${confirmedCount} confirmed, ${reviewCount} needs review, ${unmatchedCount} unmatched)`,
      description: `Reprocessed employee matching: ${confirmedCount} confirmed matches, ${reviewCount} low-confidence matches, ${unmatchedCount} unmatched`,
      after_data: { confirmedCount, reviewCount, unmatchedCount, total: attendees.length },
      performed_by: "System (Development Mode)"
    });
    res.json({
      totalParsed: attendees.length,
      attendees,
      reviewRecommended: attendees.some((a) => a.status === "review" || a.status === "unmatched")
    });
  } catch (error) {
    console.error("Seminar import reprocess error:", error);
    res.status(500).json({ error: "Failed to reprocess employee matching: " + error.message });
  }
});
app.post("/api/seminars/import-execute", requirePermission("seminar:import"), (req, res) => {
  try {
    const { title, year, quarter, date, location, remarks, attendees, externalParticipants } = req.body;
    const finalTitle = (title || "").trim() || "Imported Seminar";
    const finalYear = Number(year) || (/* @__PURE__ */ new Date()).getFullYear();
    const finalQuarter = quarter || "Q2";
    const db = readDatabase();
    if (!Array.isArray(db.seminars)) db.seminars = [];
    if (!Array.isArray(db.seminarAttendees)) db.seminarAttendees = [];
    let sem = db.seminars.find((s) => s.title.toLowerCase().trim() === finalTitle.toLowerCase().trim() && s.year === Number(finalYear) && s.quarter === finalQuarter);
    if (!sem) {
      sem = {
        id: "sem_" + Date.now() + "_" + Math.floor(Math.random() * 1e3),
        title: finalTitle,
        year: Number(finalYear),
        quarter: finalQuarter,
        date: date || "",
        location: location || "",
        remarks: remarks || "",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        attendees: []
      };
      db.seminars.push(sem);
    }
    if (!sem.attendees) sem.attendees = [];
    let attendeesAdded = 0;
    let duplicatesSkipped = 0;
    const addAttendee = (empId) => {
      const exists = (db.seminarAttendees || []).some((sa) => sa.seminarId === sem.id && sa.employeeId === empId);
      if (!exists) {
        db.seminarAttendees.push({
          id: "sa_" + Date.now() + "_" + Math.floor(Math.random() * 1e5),
          seminarId: sem.id,
          employeeId: empId,
          participantType: "employee",
          displayName: "",
          organization: "",
          role: "",
          remarks: "",
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        attendeesAdded++;
      } else {
        duplicatesSkipped++;
      }
    };
    if (Array.isArray(attendees)) {
      attendees.forEach((a) => {
        const st = a.reviewStatus || a.status;
        if (st === "excluded") return;
        const existingRichAttendee = sem.attendees.find((existing) => existing._key === a._key);
        if (!existingRichAttendee) {
          sem.attendees.push({ ...a });
        } else {
          Object.assign(existingRichAttendee, a);
        }
        if (a.EmployeeID && (st === "matched" || st === "review")) {
          addAttendee(Number(a.EmployeeID));
        }
        if (st === "unmatched" && !a.EmployeeID) {
          const exists = (db.seminarAttendees || []).some((sa) => sa.seminarId === sem.id && sa.rawName === a.rawName && sa.participantType === "unmatched");
          if (!exists) {
            db.seminarAttendees.push({
              id: "sa_" + Date.now() + "_" + Math.floor(Math.random() * 1e5),
              seminarId: sem.id,
              employeeId: null,
              participantType: "unmatched",
              displayName: a.rawName || "Unknown",
              rawName: a.rawName || "",
              organization: a.excelOffice || a.office || "",
              role: a.excelPosition || a.position || "",
              remarks: "",
              createdAt: (/* @__PURE__ */ new Date()).toISOString()
            });
            attendeesAdded++;
          }
        }
      });
    }
    if (Array.isArray(externalParticipants)) {
      externalParticipants.forEach((ep) => {
        sem.attendees.push({
          _key: ep._key || "ext_" + Date.now() + "_" + Math.floor(Math.random() * 1e3),
          rawName: ep.displayName || ep.rawName || "External Participant",
          office: ep.organization || "",
          reviewStatus: "external",
          attendanceType: "external",
          role: ep.role || "",
          remarks: ep.remarks || ""
        });
        db.seminarAttendees.push({
          id: "sa_" + Date.now() + "_" + Math.floor(Math.random() * 1e5),
          seminarId: sem.id,
          employeeId: null,
          participantType: "external",
          displayName: ep.displayName || ep.rawName || "External Participant",
          organization: ep.organization || "",
          role: ep.role || "",
          remarks: ep.remarks || "",
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        attendeesAdded++;
      });
    }
    if (Array.isArray(attendees)) {
      attendees.filter((a) => a.differences?.length > 0).forEach((a) => {
        const diffFields = (a.differences || []).join(", ");
        createAuditLog({
          module: "Seminar Import",
          action: "Name Match with Metadata Difference",
          entity_type: "employee",
          entity_id: a.EmployeeID,
          entity_name: buildEmployeeName(a),
          description: `Seminar attendee "${a.rawName}" matched to employee by name despite differences in ${diffFields}.`,
          after_data: { seminar: sem.title, rawName: a.rawName, employeeId: a.EmployeeID, differences: a.differences, excelOffice: a.excelOffice, dbOffice: a.dbOffice, excelPosition: a.excelPosition, dbPosition: a.dbPosition },
          performed_by: req.body?.username
        });
      });
    }
    writeDatabase(db);
    const externalCount = (externalParticipants || []).length;
    const confirmedCount = (attendees || []).filter((a) => (a.reviewStatus || a.status) === "matched").length;
    const reviewCount = (attendees || []).filter((a) => (a.reviewStatus || a.status) === "review").length;
    const unmatchedCount = (attendees || []).filter((a) => (a.reviewStatus || a.status) === "unmatched").length;
    const matchedWithWarningsCount = (attendees || []).filter((a) => (a.reviewStatus || a.status) !== "unmatched" && a.differences?.length > 0).length;
    let description = `Imported seminar "${sem.title}" \u2014 ${attendeesAdded} attendees added (${confirmedCount} confirmed, ${reviewCount} needs review, ${unmatchedCount} unmatched, ${externalCount} external)`;
    if (matchedWithWarningsCount > 0) {
      description += `. ${matchedWithWarningsCount} attendee(s) matched with metadata differences (Office, Position, etc.).`;
    }
    createAuditLog({
      module: "Seminar Import",
      action: "Import Completed",
      entity_type: "seminar",
      entity_id: sem.id,
      entity_name: sem.title,
      description,
      after_data: { title: sem.title, year: sem.year, quarter: sem.quarter, attendeesAdded, duplicatesSkipped, confirmedCount, reviewCount, matchedWithWarningsCount, unmatchedCount, externalCount },
      performed_by: req.body?.username
    });
    res.json({
      success: true,
      seminarId: sem.id,
      attendeesAdded,
      duplicatesSkipped,
      totalAttendees: (db.seminarAttendees || []).filter((sa) => sa.seminarId === sem.id).length
    });
  } catch (error) {
    console.error("Seminar import execute error:", error);
    res.status(500).json({ error: "Failed to execute seminar import: " + error.message });
  }
});
app.post("/api/seminars", (req, res) => {
  try {
    const { title, year, quarter, date, location, speaker, remarks } = req.body;
    if (!title || !year || !quarter) {
      res.status(400).json({ error: "Title, year, and quarter are required." });
      return;
    }
    const db = readDatabase();
    const sem = {
      id: "sem_" + Date.now() + "_" + Math.floor(Math.random() * 1e3),
      title,
      year: Number(year),
      quarter,
      date: date || "",
      location: location || "",
      speaker: speaker || "",
      remarks: remarks || "",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
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
      performed_by: req.body?.username
    });
    res.json(sem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.put("/api/seminars/:id", (req, res) => {
  try {
    const { title, year, quarter, date, location, speaker, remarks } = req.body;
    const db = readDatabase();
    const sem = db.seminars.find((s) => s.id === req.params.id);
    if (!sem) {
      res.status(404).json({ error: "Seminar not found" });
      return;
    }
    const oldSem = { ...sem };
    if (title !== void 0) sem.title = title;
    if (year !== void 0) sem.year = Number(year);
    if (quarter !== void 0) sem.quarter = quarter;
    if (date !== void 0) sem.date = date;
    if (location !== void 0) sem.location = location;
    if (speaker !== void 0) sem.speaker = speaker;
    if (remarks !== void 0) sem.remarks = remarks;
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
      performed_by: req.body?.username
    });
    res.json(sem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/seminars/:id/attendees", (req, res) => {
  try {
    const { employeeIds } = req.body;
    if (!Array.isArray(employeeIds)) {
      res.status(400).json({ error: "employeeIds array is required." });
      return;
    }
    const db = readDatabase();
    const sem = db.seminars.find((s) => s.id === req.params.id);
    if (!sem) {
      res.status(404).json({ error: "Seminar not found." });
      return;
    }
    let addedCount = 0;
    employeeIds.forEach((empId) => {
      const exists = db.seminarAttendees.some((sa) => sa.seminarId === sem.id && sa.employeeId === Number(empId));
      if (!exists) {
        db.seminarAttendees.push({
          id: "sa_" + Date.now() + "_" + Math.floor(Math.random() * 1e5),
          seminarId: sem.id,
          employeeId: Number(empId),
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        addedCount++;
      }
    });
    writeDatabase(db);
    const empNames = employeeIds.map((eid) => {
      const emp = db.employees.find((e) => e.EmployeeID === eid);
      return emp ? buildEmployeeName(emp) : `Employee #${eid}`;
    });
    createAuditLog({
      module: "Seminar Module",
      action: "Attendee Added",
      entity_type: "seminar",
      entity_id: req.params.id,
      entity_name: sem?.title || "Unknown",
      description: `Added ${addedCount} attendees to seminar "${sem?.title || "Unknown"}"`,
      after_data: { seminarId: req.params.id, employeeIds, employeeNames: empNames, addedCount },
      performed_by: req.body?.username
    });
    res.json({ success: true, addedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.delete("/api/seminars/:id/attendees/:employeeId", requirePermission("seminar:attendee:delete"), (req, res) => {
  try {
    const db = readDatabase();
    const sem = db.seminars.find((s) => s.id === req.params.id);
    const removedAttendee = db.seminarAttendees.find(
      (sa) => sa.seminarId === req.params.id && sa.employeeId === Number(req.params.employeeId)
    );
    const emp = removedAttendee?.employeeId ? db.employees.find((e) => e.EmployeeID === removedAttendee.employeeId) : null;
    const beforeCount = db.seminarAttendees.length;
    db.seminarAttendees = db.seminarAttendees.filter(
      (sa) => !(sa.seminarId === req.params.id && sa.employeeId === Number(req.params.employeeId))
    );
    writeDatabase(db);
    if (beforeCount > db.seminarAttendees.length) {
      createAuditLog({
        module: "Seminar Module",
        action: "Attendee Removed",
        entity_type: "seminar",
        entity_id: req.params.id,
        entity_name: sem?.title || "Unknown",
        description: emp ? `Removed attendee ${buildEmployeeName(emp)} from seminar "${sem?.title || "Unknown"}"` : `Removed attendee from seminar "${sem?.title || "Unknown"}"`,
        before_data: { attendeeId: removedAttendee?.id, employeeId: req.params.employeeId },
        performed_by: req.body?.username
      });
    }
    res.json({ success: true, removed: beforeCount - db.seminarAttendees.length > 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/seminars/:id/attachment", requirePermission("seminar:edit"), uploadDisk.single("file"), (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded." });
      return;
    }
    const db = readDatabase();
    const sem = db.seminars.find((s) => s.id === req.params.id);
    if (!sem) {
      res.status(404).json({ error: "Seminar not found." });
      return;
    }
    if (!Array.isArray(sem.attachments)) sem.attachments = [];
    const newAttachment = {
      id: "att_" + Date.now() + "_" + Math.floor(Math.random() * 1e4),
      originalName: req.file.originalname,
      filename: req.file.filename,
      fileSize: req.file.size,
      uploadDate: (/* @__PURE__ */ new Date()).toISOString(),
      mimeType: req.file.mimetype
    };
    sem.attachments.push(newAttachment);
    if (sem.attachments.length === 1) {
      sem.attachment = newAttachment;
    }
    writeDatabase(db);
    res.json({ message: "Attachment uploaded successfully", attachment: newAttachment, attachments: sem.attachments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/seminars/:id/attachment", (req, res) => {
  const db = readDatabase();
  const sem = db.seminars.find((s) => s.id === req.params.id);
  if (!sem) {
    res.status(404).json({ error: "Seminar not found." });
    return;
  }
  const attId = req.query.attId;
  const attachments = sem.attachments || (sem.attachment ? [sem.attachment] : []);
  if (attachments.length === 0) {
    res.status(404).json({ error: "Attachment not found." });
    return;
  }
  let att;
  if (attId) {
    att = attachments.find((a) => a.id === attId);
  } else {
    att = attachments[0];
  }
  if (!att || !att.filename) {
    res.status(404).json({ error: "Attachment not found." });
    return;
  }
  const filePath = path.join(UPLOADS_DIR, att.filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "File not found on disk." });
    return;
  }
  res.download(filePath, att.originalName);
});
app.delete("/api/seminars/:id/attachment", requirePermission("seminar:edit"), (req, res) => {
  try {
    const db = readDatabase();
    const sem = db.seminars.find((s) => s.id === req.params.id);
    if (!sem) {
      res.status(404).json({ error: "Seminar not found." });
      return;
    }
    const attId = req.query.attId;
    const attachments = sem.attachments || (sem.attachment ? [sem.attachment] : []);
    if (!attId && attachments.length > 0) {
      for (const att of attachments) {
        if (att && att.filename) {
          const filePath = path.join(UPLOADS_DIR, att.filename);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
      }
      sem.attachments = [];
      sem.attachment = void 0;
    } else if (attId) {
      const idx = attachments.findIndex((a) => a.id === attId);
      if (idx < 0) {
        res.status(404).json({ error: "Attachment not found." });
        return;
      }
      const att = attachments[idx];
      if (att.filename) {
        const filePath = path.join(UPLOADS_DIR, att.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
      attachments.splice(idx, 1);
      sem.attachments = attachments;
      sem.attachment = attachments[0] || void 0;
    }
    writeDatabase(db);
    res.json({ message: "Attachment(s) deleted.", attachments: sem.attachments || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put("/api/seminars/:id/attendees/:attendeeId", (req, res) => {
  try {
    const { participantType, displayName, organization, role, remarks, employeeId } = req.body;
    const db = readDatabase();
    const attendee = (db.seminarAttendees || []).find(
      (sa) => sa.seminarId === req.params.id && sa.id === req.params.attendeeId
    );
    if (!attendee) {
      res.status(404).json({ error: "Attendee not found" });
      return;
    }
    const oldAttendee = { ...attendee };
    if (participantType !== void 0) attendee.participantType = participantType;
    if (displayName !== void 0) attendee.displayName = displayName;
    if (organization !== void 0) attendee.organization = organization;
    if (role !== void 0) attendee.role = role;
    if (remarks !== void 0) attendee.remarks = remarks;
    if (employeeId !== void 0) attendee.employeeId = employeeId;
    writeDatabase(db);
    const sem = db.seminars.find((s) => s.id === req.params.id);
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
        performed_by: req.body?.username
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
        performed_by: req.body?.username
      });
    }
    res.json({ success: true, attendee });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.delete("/api/seminars/:id/attendees/by-attendee/:attendeeId", requirePermission("seminar:attendee:delete"), (req, res) => {
  try {
    const db = readDatabase();
    const sem = db.seminars.find((s) => s.id === req.params.id);
    const removedAttendee = (db.seminarAttendees || []).find(
      (sa) => sa.seminarId === req.params.id && sa.id === req.params.attendeeId
    );
    const beforeCount = db.seminarAttendees.length;
    db.seminarAttendees = db.seminarAttendees.filter(
      (sa) => !(sa.seminarId === req.params.id && sa.id === req.params.attendeeId)
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
        performed_by: req.body?.username
      });
    }
    res.json({ success: true, removed: beforeCount - db.seminarAttendees.length > 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/audit-logs", requirePermission("audit:view"), (req, res) => {
  try {
    const db = readDatabase();
    let logs = [...db.auditLogs];
    if (req.query.module) {
      logs = logs.filter((l) => l.module === req.query.module);
    }
    if (req.query.action) {
      logs = logs.filter((l) => l.action === req.query.action);
    }
    if (req.query.entity_type) {
      logs = logs.filter((l) => l.entity_type === req.query.entity_type);
    }
    if (req.query.date_from) {
      const from = new Date(req.query.date_from).getTime();
      logs = logs.filter((l) => new Date(l.timestamp).getTime() >= from);
    }
    if (req.query.date_to) {
      const to = new Date(req.query.date_to).getTime() + 864e5;
      logs = logs.filter((l) => new Date(l.timestamp).getTime() <= to);
    }
    if (req.query.performed_by) {
      logs = logs.filter(
        (l) => (l.performed_by || "").toLowerCase().includes(req.query.performed_by.toLowerCase())
      );
    }
    if (req.query.search) {
      const q = req.query.search.toLowerCase();
      logs = logs.filter(
        (l) => (l.entity_name || "").toLowerCase().includes(q) || (l.description || "").toLowerCase().includes(q) || (l.entity_type || "").toLowerCase().includes(q) || (l.action || "").toLowerCase().includes(q)
      );
    }
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const total = logs.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedLogs = logs.slice(offset, offset + limit);
    const parsedLogs = paginatedLogs.map((l) => ({
      ...l,
      before_data: l.before_data ? JSON.parse(l.before_data) : null,
      after_data: l.after_data ? JSON.parse(l.after_data) : null
    }));
    res.json({
      logs: parsedLogs,
      pagination: { page, limit, total, totalPages }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/audit-logs/:id", requirePermission("audit:view"), (req, res) => {
  try {
    const db = readDatabase();
    const log = db.auditLogs.find((l) => l.id === parseInt(req.params.id));
    if (!log) return res.status(404).json({ error: "Log not found" });
    res.json({
      ...log,
      before_data: log.before_data ? JSON.parse(log.before_data) : null,
      after_data: log.after_data ? JSON.parse(log.after_data) : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post("/api/audit-logs", (req, res) => {
  try {
    const { module, action, entity_type, entity_id, entity_name, description, before_data, after_data, performed_by } = req.body;
    const logEntry = createAuditLog({ module, action, entity_type, entity_id, entity_name, description, before_data, after_data, performed_by });
    res.status(201).json(logEntry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/admin/user-activity", requirePermission("user:activity:view"), (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.set("Pragma", "no-cache");
  const db = readDatabase();
  const { date_from, date_to, user_filter, action_filter } = req.query;
  const validUsers = new Set(
    (db.users || []).map((u) => u.username).filter(Boolean)
  );
  let logs = (db.auditLogs || []).filter((l) => validUsers.has(l.performed_by)).map((log) => ({
    ...log,
    before_data: typeof log.before_data === "string" ? (() => {
      try {
        return JSON.parse(log.before_data);
      } catch {
        return log.before_data;
      }
    })() : log.before_data,
    after_data: typeof log.after_data === "string" ? (() => {
      try {
        return JSON.parse(log.after_data);
      } catch {
        return log.after_data;
      }
    })() : log.after_data
  }));
  if (date_from) {
    const from = new Date(date_from).getTime();
    logs = logs.filter((l) => new Date(l.timestamp).getTime() >= from);
  }
  if (date_to) {
    const to = new Date(date_to).getTime() + 864e5;
    logs = logs.filter((l) => new Date(l.timestamp).getTime() < to);
  }
  if (user_filter && user_filter !== "all") {
    logs = logs.filter((l) => l.performed_by === user_filter);
  }
  if (action_filter && action_filter !== "all") {
    logs = logs.filter((l) => l.action === action_filter);
  }
  const userStats = /* @__PURE__ */ new Map();
  const ensureUser = (user) => {
    if (!validUsers.has(user)) return null;
    if (!userStats.has(user)) {
      userStats.set(user, { user, employeesAdded: 0, employeesEdited: 0, learningNeedsAdded: 0, totalActions: 0 });
    }
    return userStats.get(user);
  };
  const employees = db.employees || [];
  for (const emp of employees) {
    const creator = emp.CreatedBy;
    if (creator) {
      const s = ensureUser(creator);
      if (!s) continue;
      if (date_from && emp.CreatedAt && new Date(emp.CreatedAt).getTime() < new Date(date_from).getTime()) continue;
      if (date_to && emp.CreatedAt && new Date(emp.CreatedAt).getTime() >= new Date(date_to).getTime() + 864e5) continue;
      if (!action_filter || action_filter === "all" || action_filter === "Employee Created" || action_filter === "Employee Added") {
        s.employeesAdded++;
        s.totalActions++;
      }
    }
  }
  const learningNeeds = db.learningNeeds || [];
  for (const ln of learningNeeds) {
    const creator = ln.CreatedBy;
    if (creator) {
      const s = ensureUser(creator);
      if (!s) continue;
      if (date_from && ln.CreatedAt && new Date(ln.CreatedAt).getTime() < new Date(date_from).getTime()) continue;
      if (date_to && ln.CreatedAt && new Date(ln.CreatedAt).getTime() >= new Date(date_to).getTime() + 864e5) continue;
      if (!action_filter || action_filter === "all" || action_filter === "Learning Need Created") {
        s.learningNeedsAdded++;
        s.totalActions++;
      }
    }
  }
  for (const emp of employees) {
    const updater = emp.UpdatedBy;
    if (updater && updater !== emp.CreatedBy) {
      const s = ensureUser(updater);
      if (!s) continue;
      if (date_from && emp.UpdatedAt && new Date(emp.UpdatedAt).getTime() < new Date(date_from).getTime()) continue;
      if (date_to && emp.UpdatedAt && new Date(emp.UpdatedAt).getTime() >= new Date(date_to).getTime() + 864e5) continue;
      if (!action_filter || action_filter === "all" || action_filter === "Employee Updated") {
        s.employeesEdited++;
        s.totalActions++;
      }
    }
  }
  const users = [...userStats.values()].sort((a, b) => b.totalActions - a.totalActions);
  const summary = {
    employeesAdded: users.reduce((s, u) => s + u.employeesAdded, 0),
    employeesEdited: users.reduce((s, u) => s + u.employeesEdited, 0),
    learningNeedsAdded: users.reduce((s, u) => s + u.learningNeedsAdded, 0),
    totalActions: users.reduce((s, u) => s + u.totalActions, 0)
  };
  const distinctUsers = [...users.map((u) => u.user)].sort();
  const distinctActions = [...new Set(logs.map((l) => l.action).filter(Boolean))].sort();
  const recentActivity = logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50).map((l) => ({
    timestamp: l.timestamp,
    action: l.action,
    entity_type: l.entity_type,
    entity_name: l.entity_name,
    description: l.description,
    performed_by: l.performed_by
  }));
  res.json({ users, summary, distinctUsers, distinctActions, recentActivity });
});
app.get("/api/admin/user-activity/:username", requirePermission("user:activity:view"), (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.set("Pragma", "no-cache");
  const db = readDatabase();
  const { username } = req.params;
  const { date_from, date_to, action_filter } = req.query;
  const validUsers = new Set(
    (db.users || []).map((u) => u.username).filter(Boolean)
  );
  if (!validUsers.has(username)) {
    return res.status(404).json({ message: "User not found" });
  }
  let employeesAdded = 0, employeesEdited = 0, learningNeedsAdded = 0;
  const activity = [];
  const matchDate = (dateStr) => {
    if (!dateStr) return true;
    const ts = new Date(dateStr).getTime();
    if (date_from && ts < new Date(date_from).getTime()) return false;
    if (date_to && ts >= new Date(date_to).getTime() + 864e5) return false;
    return true;
  };
  const employees = db.employees || [];
  for (const emp of employees) {
    if (emp.CreatedBy === username && matchDate(emp.CreatedAt)) {
      if (!action_filter || action_filter === "all" || action_filter === "Employee Created" || action_filter === "Employee Added") {
        employeesAdded++;
        activity.push({
          timestamp: emp.CreatedAt || "Unknown",
          action: "Employee Created",
          entity_type: "employee",
          entity_id: emp.EmployeeID,
          entity_name: [emp.FirstName, emp.MiddleName, emp.LastName].filter(Boolean).join(" ")
        });
      }
    }
    if (emp.UpdatedBy === username && emp.UpdatedBy !== emp.CreatedBy && matchDate(emp.UpdatedAt)) {
      if (!action_filter || action_filter === "all" || action_filter === "Employee Updated") {
        employeesEdited++;
        activity.push({
          timestamp: emp.UpdatedAt || "Unknown",
          action: "Employee Updated",
          entity_type: "employee",
          entity_id: emp.EmployeeID,
          entity_name: [emp.FirstName, emp.MiddleName, emp.LastName].filter(Boolean).join(" ")
        });
      }
    }
  }
  const learningNeeds = db.learningNeeds || [];
  for (const ln of learningNeeds) {
    if (ln.CreatedBy === username && matchDate(ln.CreatedAt)) {
      if (!action_filter || action_filter === "all" || action_filter === "Learning Need Created") {
        learningNeedsAdded++;
        activity.push({
          timestamp: ln.CreatedAt || "Unknown",
          action: "Learning Need Created",
          entity_type: "learning_need",
          entity_id: ln.LearningNeedID,
          entity_name: ln.LearningNeed
        });
      }
    }
  }
  const logs = (db.auditLogs || []).filter((l) => l.performed_by === username);
  for (const l of logs) {
    if (date_from && new Date(l.timestamp).getTime() < new Date(date_from).getTime()) continue;
    if (date_to && new Date(l.timestamp).getTime() >= new Date(date_to).getTime() + 864e5) continue;
    if (action_filter && action_filter !== "all" && l.action !== action_filter) continue;
    activity.push({
      timestamp: l.timestamp,
      action: l.action,
      entity_type: l.entity_type,
      entity_id: l.entity_id,
      entity_name: l.entity_name
    });
  }
  activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json({
    username,
    employeesAdded,
    employeesEdited,
    learningNeedsAdded,
    totalActions: employeesAdded + employeesEdited + learningNeedsAdded,
    activity
  });
});
async function startServer() {
  const db = readDatabase();
  console.log(`[Startup] Database loaded: ${db.employees.length} employees, ${db.learningNeeds.length} learning needs, ${db.users.length} users`);
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
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
