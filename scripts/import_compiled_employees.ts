import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

function clean(str: string | null | undefined): string {
  if (!str) return "";
  return str.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, "").replace(/\s+/g, "");
}

function cleanString(str: string | null | undefined): string {
  if (!str) return "";
  return str.toString().trim().replace(/\s+/g, " ");
}

function getBaseFirstName(firstName: string): string {
  const parts = firstName.trim().split(/\s+/);
  if (parts.length > 1) {
    const last = parts[parts.length - 1];
    if (last.length === 1 || (last.length === 2 && last.endsWith("."))) {
      return parts.slice(0, -1).join(" ");
    }
  }
  return firstName;
}

function parseExcelName(fullName: string) {
  const parts = fullName.split(",");
  if (parts.length < 2) {
    return { lastName: fullName.trim(), firstName: "", middleInitial: "", fullAfterComma: "" };
  }
  const lastName = parts[0].trim();
  const fullAfterComma = parts[1].trim();

  // Extract middle name/initial
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

// Word boundary prefix helper to prevent false matches (e.g. Joseph vs Josephine)
function isWordBoundaryPrefix(longer: string, shorter: string) {
  if (!longer.startsWith(shorter)) return false;
  return longer.length === shorter.length || longer.charAt(shorter.length) === " ";
}

async function run() {
  const xlsxPath = "C:\\Users\\AMD\\Downloads\\Compiled_Employee_List.xlsx";
  const dbDir = path.join(process.cwd(), "database");
  const dbPath = path.join(dbDir, "db.json");
  const backupPath = path.join(dbDir, "db.json.bak");

  if (!fs.existsSync(dbPath)) {
    console.error("Error: database/db.json does not exist!");
    process.exit(1);
  }

  // 1. Back up database
  console.log(`Backing up database to ${backupPath}...`);
  fs.copyFileSync(dbPath, backupPath);

  const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
  const dbEmployees = db.employees;

  // 2. Open Workbook
  console.log(`Reading Excel file: ${xlsxPath}...`);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(xlsxPath);
  const sheet = workbook.worksheets[0];

  let updatedCount = 0;
  let createdCount = 0;
  
  // Track parsed names of Excel records to prevent duplicating them if they appear twice
  const processedNames = new Set<string>();

  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    const rawName = row.getCell(1).value;
    if (!rawName) continue;

    const fullName = rawName.toString().trim();
    if (processedNames.has(fullName.toLowerCase())) {
      console.log(`Skipping duplicate row for name in Excel: ${fullName}`);
      continue;
    }
    processedNames.add(fullName.toLowerCase());

    const parsed = parseExcelName(fullName);

    // Map Employment Type
    const rawType = row.getCell(2).value?.toString().trim() || "";
    let employmentType = "Undefined (Pending Review)";
    if (rawType.toLowerCase().includes("job order")) {
      employmentType = "Job Order";
    } else if (rawType.toLowerCase().includes("casual")) {
      employmentType = "Casual";
    } else if (rawType.toLowerCase().includes("consultant")) {
      employmentType = "Consultant";
    } else if (rawType.toLowerCase().includes("permanent")) {
      employmentType = "Permanent";
    }

    // Map Employment Status
    const rawStatus = row.getCell(3).value?.toString().trim() || "";
    let employmentStatus = "Undefined (Pending Review)";
    if (rawStatus.toLowerCase().includes("new employee")) {
      employmentStatus = "Newly Hired";
    } else if (
      rawStatus.toLowerCase().includes("re-employment") ||
      rawStatus.toLowerCase().includes("reemployment") ||
      rawStatus.toLowerCase().includes("transfer") ||
      rawStatus.toLowerCase().includes("status change")
    ) {
      employmentStatus = "Re-employed";
    } else if (rawStatus.toLowerCase().includes("casual")) {
      employmentStatus = "Casual";
    } else if (rawStatus.toLowerCase().includes("permanent")) {
      employmentStatus = "Permanent";
    }

    // 3. Find match in DB
    const matches = dbEmployees.filter((emp: any) => {
      if (clean(emp.LastName) !== clean(parsed.lastName)) {
        return false;
      }

      const dbFirst = clean(emp.FirstName);
      const exFirst = clean(parsed.firstName);
      
      const dbFull = clean(emp.FirstName + " " + (emp.MiddleInitial || ""));
      const exFull = clean(parsed.firstName + " " + (parsed.middleInitial || ""));

      const exAfterComma = clean(parsed.fullAfterComma);

      const firstNamesEqual = dbFirst === exFirst;
      const fullNamesEqual = dbFull === exFull;
      const exAfterCommaEqualsDbFirst = exAfterComma === dbFirst;
      const exAfterCommaEqualsDbFull = exAfterComma === dbFull;

      const cleanDbFirstSpaced = emp.FirstName.trim().toLowerCase();
      const cleanExFirstSpaced = parsed.firstName.trim().toLowerCase();
      const cleanExAfterCommaSpaced = parsed.fullAfterComma.trim().toLowerCase();

      const prefixMatch = isWordBoundaryPrefix(cleanDbFirstSpaced, cleanExFirstSpaced) ||
                          isWordBoundaryPrefix(cleanExFirstSpaced, cleanDbFirstSpaced) ||
                          isWordBoundaryPrefix(cleanDbFirstSpaced, cleanExAfterCommaSpaced);

      return firstNamesEqual || fullNamesEqual || exAfterCommaEqualsDbFirst || exAfterCommaEqualsDbFull || prefixMatch;
    });

    if (matches.length > 0) {
      // Existent employee: update fields
      matches.forEach((emp: any) => {
        const oldStatus = emp.EmploymentStatus || "Undefined (Pending Review)";
        emp.EmploymentType = employmentType;
        emp.EmploymentStatus = employmentStatus;
        emp.UpdatedAt = new Date().toISOString();
        emp.UpdatedBy = "system";

        if (oldStatus !== employmentStatus) {
          emp.StatusChangedAt = ["Newly Hired", "Re-employed", "Casual"].includes(employmentStatus) 
            ? new Date().toISOString() 
            : null;
        }

        console.log(`Updated existing employee [ID: ${emp.EmployeeID}]: ${emp.FirstName} ${emp.LastName} -> Type: ${employmentType}, Status: ${employmentStatus}`);
        updatedCount++;
      });
    } else {
      // Unique employee: insert as new
      const maxId = db.employees.reduce((max: number, emp: any) => (emp.EmployeeID > max ? emp.EmployeeID : max), 0);
      const newEmpId = maxId + 1;

      // Formatting name helper (matching formatName from server.ts)
      const formatNameStr = (str: string) => {
        return str
          .toLowerCase()
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      };

      const cleanFirst = formatNameStr(parsed.firstName);
      const cleanMiddle = parsed.middleInitial ? parsed.middleInitial.toUpperCase() : "";
      const cleanLast = formatNameStr(parsed.lastName);

      const statusChangedAt = ["Newly Hired", "Re-employed", "Casual"].includes(employmentStatus)
        ? new Date().toISOString()
        : null;

      const newEmployee = {
        EmployeeID: newEmpId,
        FirstName: cleanFirst,
        MiddleInitial: cleanMiddle,
        LastName: cleanLast,
        Office: "Undefined (Pending Review)",
        Position: "Undefined (Pending Review)",
        EmploymentType: employmentType,
        EmploymentStatus: employmentStatus,
        StatusChangedAt: statusChangedAt,
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString(),
        CreatedBy: "system",
        UpdatedBy: "system",
      };

      db.employees.push(newEmployee);
      console.log(`Created new employee [ID: ${newEmpId}]: ${cleanFirst} ${cleanLast} -> Type: ${employmentType}, Status: ${employmentStatus}`);
      createdCount++;
    }
  }

  // 4. Save Database
  console.log("Saving updated database to disk...");
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");

  console.log("\n--- IMPORT PROCESS COMPLETED ---");
  console.log(`Successfully updated: ${updatedCount} records`);
  console.log(`Successfully created: ${createdCount} records`);
  console.log(`Total database employees: ${db.employees.length}`);
}

run().catch((err) => {
  console.error("Error during import process:", err);
  process.exit(1);
});
