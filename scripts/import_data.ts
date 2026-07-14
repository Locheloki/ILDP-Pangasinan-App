import fs from "fs";
import path from "path";

const DB_FILE = path.join(process.cwd(), "database", "db.json");
const CSV_FILES = [
  path.join(process.cwd(), "database", "ildp_raw.csv"),
  path.join(process.cwd(), "import_1.csv"),
  path.join(process.cwd(), "import_2.csv"),
  path.join(process.cwd(), "import_3.csv"),
  path.join(process.cwd(), "database", "user_chunk_1.csv"),
  path.join(process.cwd(), "database", "user_chunk_2.csv"),
  path.join(process.cwd(), "database", "user_chunk_3.csv"),
  path.join(process.cwd(), "database", "user_chunk_4.csv"),
  path.join(process.cwd(), "database", "user_chunk_5.csv"),
  path.join(process.cwd(), "database", "user_chunk_6.csv"),
  path.join("c:/Users/AMD/Documents", "employee_database1.csv")
];

// Standard Defaults (used as base for seeding options)
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

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map(val => val.replace(/^"|"$/g, "").trim());
}

function normalizeEmployeeIdentity(firstName: string, lastName: string, office: string) {
  return [firstName, lastName, office]
    .map(value => (value || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, ""))
    .join("|");
}

function runImport() {
  console.log("Starting DB merge and dropdown seeding...");

  if (!fs.existsSync(DB_FILE)) {
    console.error(`Database file not found at ${DB_FILE}`);
    return;
  }

  // Read current DB
  const dbContent = fs.readFileSync(DB_FILE, "utf-8");
  const db = JSON.parse(dbContent);

  if (!db.employees) db.employees = [];
  if (!db.learningNeeds) db.learningNeeds = [];
  if (!db.customOptions) {
    db.customOptions = {
      basis: [],
      methodology: [],
      office: [],
      position: [],
      learningNeed: [],
      schedule: []
    };
  }

  // Create lookup maps for fast de-duplication
  const employeeMap = new Map<number, any>();
  const employeeIdentityMap = new Map<string, any>();
  const usedEmployeeIds = new Set<number>();
  db.employees.forEach((emp: any) => {
    employeeMap.set(emp.EmployeeID, emp);
    usedEmployeeIds.add(emp.EmployeeID);
    employeeIdentityMap.set(normalizeEmployeeIdentity(emp.FirstName, emp.LastName, emp.Office), emp);
  });
  let nextEmployeeId = Math.max(0, ...Array.from(usedEmployeeIds)) + 1;

  const learningNeedSet = new Set<string>();
  db.learningNeeds.forEach((ln: any) => {
    // Unique key: EmployeeID + Normalized Learning Need string
    const key = `${ln.EmployeeID}:${ln.LearningNeed.toLowerCase().trim()}`;
    learningNeedSet.add(key);
  });

  // Track max learning need ID to generate unique new IDs
  let maxLNId = db.learningNeeds.reduce((max: number, ln: any) => (ln.LearningNeedID > max ? ln.LearningNeedID : max), 0);

  let employeesAdded = 0;
  let learningNeedsAdded = 0;
  let linesProcessed = 0;

  // Track unique values in dataset for seeding dropdown customOptions
  const officesInDataset = new Set<string>();
  const positionsInDataset = new Set<string>();
  const learningNeedsInDataset = new Set<string>();
  const basesInDataset = new Set<string>();
  const methodologiesInDataset = new Set<string>();
  const schedulesInDataset = new Set<string>();

  // Process each CSV file
  for (const csvFile of CSV_FILES) {
    if (!fs.existsSync(csvFile)) {
      console.log(`CSV file not found: ${csvFile}, skipping.`);
      continue;
    }

    console.log(`Processing file: ${csvFile}...`);
    const csvContent = fs.readFileSync(csvFile, "utf-8");
    const lines = csvContent.split(/\r?\n/);

    // Parse lines (skipping header at index 0)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      linesProcessed++;
      const fields = parseCSVLine(line);
      if (fields.length < 10) {
        console.warn(`Skipping invalid line ${i + 1} in ${csvFile}: too few fields (${fields.length})`);
        continue;
      }

      const employeeIdStr = fields[0];
      const firstName = fields[1];
      const middleInitial = fields[2];
      const lastName = fields[3];
      const office = fields[4];
      const position = fields[5];
      const learningNeed = fields[6];
      const basis = fields[7];
      const methodology = fields[8];
      const targetSchedule = fields[9];

      let empId = parseInt(employeeIdStr);
      if (isNaN(empId)) {
        console.warn(`Skipping line ${i + 1} in ${csvFile}: Invalid Employee_ID "${employeeIdStr}"`);
        continue;
      }

      if (usedEmployeeIds.has(empId)) {
        const existingById = employeeMap.get(empId);
        if (existingById) {
          const identityKey = normalizeEmployeeIdentity(firstName, lastName, office);
          const existingByIdentity = employeeIdentityMap.get(identityKey);
          if (existingByIdentity && existingByIdentity.EmployeeID !== existingById.EmployeeID) {
            empId = nextEmployeeId++;
            usedEmployeeIds.add(empId);
          }
        }
      }

      // Collect options
      if (office) officesInDataset.add(office);
      if (position) positionsInDataset.add(position);
      if (learningNeed) learningNeedsInDataset.add(learningNeed);
      if (basis) {
        basis.split(",").map(s => s.trim()).forEach(b => {
          if (b) basesInDataset.add(b);
        });
      }
      if (methodology) {
        methodology.split(",").map(s => s.trim()).forEach(m => {
          if (m) methodologiesInDataset.add(m);
        });
      }
      if (targetSchedule) schedulesInDataset.add(targetSchedule);

      // 1. Employee logic
      const identityKey = normalizeEmployeeIdentity(firstName, lastName, office);
      let emp = employeeMap.get(empId);
      if (!emp) {
        const existingByIdentity = employeeIdentityMap.get(identityKey);

        if (existingByIdentity) {
          emp = existingByIdentity;
          employeeMap.set(empId, emp);
        } else {
          // Create new employee
          emp = {
            EmployeeID: empId,
            FirstName: firstName,
            MiddleInitial: middleInitial,
            LastName: lastName,
            Office: office,
            Position: position,
            CreatedAt: new Date().toISOString(),
            UpdatedAt: new Date().toISOString(),
            CreatedBy: "system",
            UpdatedBy: "system"
          };
          db.employees.push(emp);
          employeeMap.set(empId, emp);
          employeeIdentityMap.set(identityKey, emp);
          employeesAdded++;
        }
      }

      // 2. Learning Need logic
      const lnKey = `${emp.EmployeeID}:${learningNeed.toLowerCase().trim()}`;
      if (!learningNeedSet.has(lnKey)) {
        maxLNId++;
        db.learningNeeds.push({
          LearningNeedID: maxLNId,
          EmployeeID: emp.EmployeeID,
          LearningNeed: learningNeed,
          Basis: basis,
          Methodology: methodology,
          TargetSchedule: targetSchedule,
          CreatedAt: new Date().toISOString(),
          UpdatedAt: new Date().toISOString(),
          CreatedBy: "system",
          UpdatedBy: "system"
        });
        learningNeedSet.add(lnKey);
        learningNeedsAdded++;
      }
    }
  }

  // 3. Populate customOptions with both Defaults AND unique CSV values
  const getCombinedDeduplicated = (defaults: string[], dataset: Set<string>) => {
    const combined = new Set<string>();
    defaults.forEach(v => combined.add(v.trim()));
    dataset.forEach(v => combined.add(v.trim()));
    return Array.from(combined).filter(v => v !== "" && v !== "N/A" && v !== "All Offices" && v !== "All Competencies");
  };

  db.customOptions.office = getCombinedDeduplicated(DEFAULT_OFFICES, officesInDataset);
  db.customOptions.position = getCombinedDeduplicated(DEFAULT_POSITIONS, positionsInDataset);
  db.customOptions.learningNeed = getCombinedDeduplicated(DEFAULT_LEARNING_NEEDS, learningNeedsInDataset);
  db.customOptions.basis = getCombinedDeduplicated(DEFAULT_BASES, basesInDataset);
  db.customOptions.methodology = getCombinedDeduplicated(DEFAULT_METHODOLOGIES, methodologiesInDataset);
  db.customOptions.schedule = getCombinedDeduplicated(DEFAULT_SCHEDULES, schedulesInDataset);

  // Write updated DB
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");

  console.log("Import success!");
  console.log(`- Lines parsed: ${linesProcessed}`);
  console.log(`- New Employees imported: ${employeesAdded}`);
  console.log(`- New Learning Needs imported: ${learningNeedsAdded}`);
  console.log(`- Options Seeded:`);
  console.log(`  * Offices: ${db.customOptions.office.length}`);
  console.log(`  * Positions: ${db.customOptions.position.length}`);
  console.log(`  * Learning Needs: ${db.customOptions.learningNeed.length}`);
  console.log(`  * Bases: ${db.customOptions.basis.length}`);
  console.log(`  * Methodologies: ${db.customOptions.methodology.length}`);
  console.log(`  * Schedules: ${db.customOptions.schedule.length}`);
}

runImport();
