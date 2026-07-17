const fs = require("fs");
const path = require("path");

const dbPath = path.join(process.cwd(), "database", "db.json");
const backupPath = path.join(process.cwd(), "database", "db.json.bak-clean-20260716");

const DEFAULT_OPTIONS = {
  basis: [
    "Requirement of the position",
    "Competency Gap",
    "Licensing Requirement",
    "Update/Learning Requirement",
    "Succession Planning",
    "Competency Improvement",
    "N/A",
  ],
  methodology: [
    "Seminar/Training",
    "Coaching & Mentoring",
    "Refresher Training",
    "Webinar",
    "Values Restoration Drive",
    "Job Rotation",
    "Shadowing",
    "N/A",
  ],
  office: [
    "Mapandan Community Hospital",
    "Manaoag Community Hospital",
    "Lingayen District Hospital",
    "Provincial Engineering Office",
    "Pangasinan Polytechnic College",
    "Capitol Resort Hotel",
    "Provincial Legal Office",
    "Western Pangasinan District Hospital",
    "Bayambang District Hospital",
    "Dasol Community Hospital",
  ],
  position: [
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
    "Supervising Administrative Officer",
  ],
  learningNeed: [
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
    "Maintaining Digital Records System",
  ],
  schedule: [
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
    "Quarterly",
  ],
};

const VALID_EMPLOYMENT_TYPES = new Set([
  "Permanent",
  "Casual",
  "Job Order",
  "Consultant",
  "Contractual",
  "Co-terminous",
  "Undefined (Pending Review)",
]);
const VALID_GENDERS = new Set(["Male", "Female", "Undefined (Pending Review)"]);
const STATUS_REVIEW_DATE_STATUSES = new Set(["Newly Hired", "Re-employed", "Casual"]);

function readDb() {
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

function compactWhitespace(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeKey(value) {
  return compactWhitespace(value).toLowerCase();
}

function titleName(value) {
  const normalized = compactWhitespace(value);
  if (!normalized) return "";
  return normalized
    .toLowerCase()
    .replace(/\b([a-z])/g, (match) => match.toUpperCase());
}

function normalizeMiddleInitial(value) {
  const cleaned = compactWhitespace(value).toUpperCase();
  if (!cleaned) return "";
  if (/^[A-Z]{1,3}\.$/.test(cleaned)) return cleaned;
  if (/^[A-Z]{1,3}$/.test(cleaned)) return `${cleaned}.`;
  return cleaned;
}

function normalizeDate(value) {
  if (value === null || value === undefined || value === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function uniqueSortedValues(values) {
  const seen = new Map();
  for (const value of values) {
    const cleaned = compactWhitespace(value);
    if (!cleaned) continue;
    const key = normalizeKey(cleaned);
    if (!seen.has(key)) seen.set(key, cleaned);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

function splitList(value) {
  if (Array.isArray(value)) return value.map(compactWhitespace).filter(Boolean);
  return compactWhitespace(value)
    .split(",")
    .map(compactWhitespace)
    .filter(Boolean);
}

function nextAvailableId(used, currentMax) {
  let next = currentMax + 1;
  while (used.has(next)) next += 1;
  return next;
}

function refreshUniqueIds(rows, idField) {
  const used = new Set();
  let maxId = rows.reduce((max, row) => {
    const id = Number(row[idField]);
    return Number.isFinite(id) && id > max ? id : max;
  }, 0);
  let changed = 0;

  for (const row of rows) {
    const currentId = Number(row[idField]);
    if (Number.isFinite(currentId) && currentId > 0 && !used.has(currentId)) {
      if (row[idField] !== currentId) changed++;
      row[idField] = currentId;
      used.add(currentId);
      continue;
    }

    const newId = nextAvailableId(used, maxId);
    row[idField] = newId;
    used.add(newId);
    maxId = Math.max(maxId, newId);
    changed++;
  }

  return changed;
}

function dedupeUsers(users) {
  const seenUsernames = new Set();
  const cleanedUsers = [];
  let removed = 0;
  let changed = 0;

  for (const user of users || []) {
    const username = compactWhitespace(user.username);
    if (!username) {
      removed++;
      continue;
    }
    const key = normalizeKey(username);
    if (seenUsernames.has(key)) {
      removed++;
      continue;
    }
    seenUsernames.add(key);

    const next = {
      ...user,
      id: compactWhitespace(user.id || cleanedUsers.length + 1),
      username,
      name: compactWhitespace(user.name || username),
      role: compactWhitespace(user.role || "Encoder"),
    };
    if (JSON.stringify(next) !== JSON.stringify(user)) changed++;
    cleanedUsers.push(next);
  }

  return { users: cleanedUsers, removed, changed };
}

function cleanEmployee(emp) {
  const next = { ...emp };
  next.EmployeeID = Number(next.EmployeeID);
  next.FirstName = titleName(next.FirstName);
  next.MiddleInitial = normalizeMiddleInitial(next.MiddleInitial);
  next.LastName = titleName(next.LastName);
  next.Office = compactWhitespace(next.Office) || "Undefined (Pending Review)";
  next.Position = compactWhitespace(next.Position) || "Undefined (Pending Review)";
  next.EmploymentType = compactWhitespace(next.EmploymentType) || "Undefined (Pending Review)";
  if (!VALID_EMPLOYMENT_TYPES.has(next.EmploymentType)) {
    next.EmploymentType = "Undefined (Pending Review)";
  }
  next.EmploymentStatus = compactWhitespace(next.EmploymentStatus) || "Undefined (Pending Review)";
  next.Gender = compactWhitespace(next.Gender) || "Undefined (Pending Review)";
  if (!VALID_GENDERS.has(next.Gender)) {
    next.Gender = "Undefined (Pending Review)";
  }
  const normalizedDateOfAssumption = normalizeDate(next.DateOfAssumption);
  if (normalizedDateOfAssumption) {
    next.DateOfAssumption = normalizedDateOfAssumption;
  } else {
    delete next.DateOfAssumption;
  }
  next.CreatedAt = normalizeDate(next.CreatedAt) || new Date(0).toISOString();
  next.UpdatedAt = normalizeDate(next.UpdatedAt) || next.CreatedAt;
  next.CreatedBy = compactWhitespace(next.CreatedBy) || "system";
  next.UpdatedBy = compactWhitespace(next.UpdatedBy) || next.CreatedBy;
  next.StatusChangedAt = STATUS_REVIEW_DATE_STATUSES.has(next.EmploymentStatus)
    ? normalizeDate(next.StatusChangedAt) || next.UpdatedAt
    : null;
  return next;
}

function employeeLogicalKey(emp) {
  return [
    normalizeKey(emp.FirstName),
    normalizeKey(emp.MiddleInitial),
    normalizeKey(emp.LastName),
    normalizeKey(emp.Office),
    normalizeKey(emp.Position),
    normalizeKey(emp.EmploymentType),
    normalizeKey(emp.DateOfAssumption || ""),
  ].join("|");
}

function mergeDuplicateEmployees(employees, learningNeeds) {
  const byKey = new Map();
  const idRedirects = new Map();
  const cleanedEmployees = [];
  let removed = 0;

  for (const emp of employees) {
    const key = employeeLogicalKey(emp);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, emp);
      cleanedEmployees.push(emp);
      continue;
    }

    idRedirects.set(emp.EmployeeID, existing.EmployeeID);
    existing.UpdatedAt = existing.UpdatedAt > emp.UpdatedAt ? existing.UpdatedAt : emp.UpdatedAt;
    if (existing.UpdatedBy === "system" && emp.UpdatedBy) existing.UpdatedBy = emp.UpdatedBy;
    removed++;
  }

  if (idRedirects.size > 0) {
    for (const need of learningNeeds) {
      if (idRedirects.has(need.EmployeeID)) {
        need.EmployeeID = idRedirects.get(need.EmployeeID);
      }
    }
  }

  return { employees: cleanedEmployees, removed, redirects: idRedirects.size };
}

function cleanLearningNeed(need) {
  const next = { ...need };
  next.LearningNeedID = Number(next.LearningNeedID);
  next.EmployeeID = Number(next.EmployeeID);
  next.LearningNeed = compactWhitespace(next.LearningNeed) || "Undefined (Pending Review)";
  next.Basis = uniqueSortedValues(splitList(next.Basis)).join(", ") || "N/A";
  next.Methodology = uniqueSortedValues(splitList(next.Methodology)).join(", ") || "N/A";
  next.TargetSchedule = compactWhitespace(next.TargetSchedule) || "N/A";
  next.CreatedAt = normalizeDate(next.CreatedAt) || new Date(0).toISOString();
  next.UpdatedAt = normalizeDate(next.UpdatedAt) || next.CreatedAt;
  next.CreatedBy = compactWhitespace(next.CreatedBy) || "system";
  next.UpdatedBy = compactWhitespace(next.UpdatedBy) || next.CreatedBy;
  return next;
}

function learningNeedLogicalKey(need) {
  return [
    need.EmployeeID,
    normalizeKey(need.LearningNeed),
    normalizeKey(need.Basis),
    normalizeKey(need.Methodology),
    normalizeKey(need.TargetSchedule),
  ].join("|");
}

function rebuildOptions(db) {
  const options = { ...DEFAULT_OPTIONS };
  for (const emp of db.employees) {
    options.office.push(emp.Office);
    options.position.push(emp.Position);
  }
  for (const need of db.learningNeeds) {
    options.learningNeed.push(need.LearningNeed);
    options.schedule.push(need.TargetSchedule);
    options.basis.push(...splitList(need.Basis));
    options.methodology.push(...splitList(need.Methodology));
  }

  db.customOptions = Object.fromEntries(
    Object.entries(options).map(([key, values]) => [key, uniqueSortedValues(values)])
  );
}

function audit(db) {
  const employeeIds = new Set((db.employees || []).map((emp) => emp.EmployeeID));
  const duplicateEmployeeIds = (db.employees || []).length - employeeIds.size;
  const learningNeedIds = new Set((db.learningNeeds || []).map((need) => need.LearningNeedID));
  const duplicateLearningNeedIds = (db.learningNeeds || []).length - learningNeedIds.size;
  const orphanLearningNeeds = (db.learningNeeds || []).filter((need) => !employeeIds.has(need.EmployeeID)).length;
  const missingEmployeeRequired = (db.employees || []).filter(
    (emp) => !emp.EmployeeID || !emp.FirstName || !emp.LastName || !emp.Office || !emp.Position
  ).length;
  const missingLearningNeedRequired = (db.learningNeeds || []).filter(
    (need) => !need.LearningNeedID || !need.EmployeeID || !need.LearningNeed
  ).length;

  const employeeKeys = new Set();
  let duplicateLogicalEmployees = 0;
  for (const emp of db.employees || []) {
    const key = employeeLogicalKey(emp);
    if (employeeKeys.has(key)) duplicateLogicalEmployees++;
    employeeKeys.add(key);
  }

  const needKeys = new Set();
  let duplicateLogicalLearningNeeds = 0;
  for (const need of db.learningNeeds || []) {
    const key = learningNeedLogicalKey(need);
    if (needKeys.has(key)) duplicateLogicalLearningNeeds++;
    needKeys.add(key);
  }

  return {
    users: (db.users || []).length,
    employees: (db.employees || []).length,
    learningNeeds: (db.learningNeeds || []).length,
    duplicateEmployeeIds,
    duplicateLearningNeedIds,
    duplicateLogicalEmployees,
    duplicateLogicalLearningNeeds,
    orphanLearningNeeds,
    missingEmployeeRequired,
    missingLearningNeedRequired,
  };
}

function clean() {
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Missing database: ${dbPath}`);
  }

  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(dbPath, backupPath);
  }

  const beforeDb = readDb();
  const before = audit(beforeDb);
  const db = beforeDb;
  const report = {
    before,
    fixed: {
      duplicateUsernamesRemoved: 0,
      userFieldsNormalized: 0,
      employeeIdsReassigned: 0,
      employeeRowsNormalized: 0,
      duplicateEmployeeRowsMerged: 0,
      orphanLearningNeedsRemoved: 0,
      learningNeedIdsReassigned: 0,
      learningNeedRowsNormalized: 0,
      duplicateLearningNeedRowsRemoved: 0,
    },
    after: null,
  };

  const userCleanup = dedupeUsers(db.users);
  db.users = userCleanup.users;
  report.fixed.duplicateUsernamesRemoved = userCleanup.removed;
  report.fixed.userFieldsNormalized = userCleanup.changed;

  db.employees = (db.employees || [])
    .filter((emp) => emp && compactWhitespace(emp.FirstName) && compactWhitespace(emp.LastName))
    .map((emp) => {
      const cleaned = cleanEmployee(emp);
      if (JSON.stringify(cleaned) !== JSON.stringify(emp)) report.fixed.employeeRowsNormalized++;
      return cleaned;
    });

  report.fixed.employeeIdsReassigned = refreshUniqueIds(db.employees, "EmployeeID");

  db.learningNeeds = (db.learningNeeds || [])
    .filter((need) => need && compactWhitespace(need.LearningNeed))
    .map((need) => {
      const cleaned = cleanLearningNeed(need);
      if (JSON.stringify(cleaned) !== JSON.stringify(need)) report.fixed.learningNeedRowsNormalized++;
      return cleaned;
    });

  let merged = mergeDuplicateEmployees(db.employees, db.learningNeeds);
  db.employees = merged.employees;
  report.fixed.duplicateEmployeeRowsMerged = merged.removed;

  const employeeIds = new Set(db.employees.map((emp) => emp.EmployeeID));
  const learningNeedsBeforeOrphanFilter = db.learningNeeds.length;
  db.learningNeeds = db.learningNeeds.filter((need) => employeeIds.has(need.EmployeeID));
  report.fixed.orphanLearningNeedsRemoved = learningNeedsBeforeOrphanFilter - db.learningNeeds.length;

  const seenNeeds = new Set();
  const dedupedNeeds = [];
  for (const need of db.learningNeeds) {
    const key = learningNeedLogicalKey(need);
    if (seenNeeds.has(key)) {
      report.fixed.duplicateLearningNeedRowsRemoved++;
      continue;
    }
    seenNeeds.add(key);
    dedupedNeeds.push(need);
  }
  db.learningNeeds = dedupedNeeds;

  report.fixed.employeeIdsReassigned += refreshUniqueIds(db.employees, "EmployeeID");
  report.fixed.learningNeedIdsReassigned = refreshUniqueIds(db.learningNeeds, "LearningNeedID");
  rebuildOptions(db);

  report.after = audit(db);
  fs.writeFileSync(dbPath, `${JSON.stringify(db, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report, null, 2));
}

clean();
