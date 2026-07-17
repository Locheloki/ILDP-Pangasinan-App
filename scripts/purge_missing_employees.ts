import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

function clean(str: string | null | undefined): string {
  if (!str) return "";
  return str.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, "").replace(/\s+/g, "");
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
    return { lastName: fullName.trim(), firstName: "" };
  }
  const lastName = parts[0].trim();
  const fullAfterComma = parts[1].trim();

  const words = fullAfterComma.split(/\s+/);
  if (words.length > 1) {
    const lastWord = words[words.length - 1];
    if (lastWord.length === 1 || (lastWord.length === 2 && lastWord.endsWith("."))) {
      const first = words.slice(0, -1).join(" ");
      return { lastName, firstName: first };
    } else {
      const first = words.slice(0, -1).join(" ");
      return { lastName, firstName: first };
    }
  } else {
    return { lastName, firstName: fullAfterComma };
  }
}

function isWordBoundaryPrefix(longer: string, shorter: string) {
  if (!longer.startsWith(shorter)) return false;
  return longer.length === shorter.length || longer.charAt(shorter.length) === " ";
}

async function run() {
  const xlsxPath = "C:\\Users\\AMD\\Downloads\\Copy of PGOListTemplateView.xlsx";
  const dbDir = path.join(process.cwd(), "database");
  const dbPath = path.join(dbDir, "db.json");
  const backupPath = path.join(dbDir, "db.json.bak4");

  if (!fs.existsSync(dbPath)) {
    console.error("Error: database/db.json does not exist!");
    process.exit(1);
  }

  // 1. Back up database
  console.log(`Backing up database to ${backupPath}...`);
  fs.copyFileSync(dbPath, backupPath);

  const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
  const dbEmployees = db.employees || [];
  const dbNeeds = db.learningNeeds || [];

  // 2. Open Workbook and compile Excel names
  console.log(`Reading Excel file: ${xlsxPath}...`);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(xlsxPath);
  const sheet = workbook.worksheets[0];

  const excelNames: { lastNameClean: string; firstNameClean: string; rawName: string }[] = [];

  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    const cell1 = row.getCell(1).value;
    if (typeof cell1 === "number") {
      const rawName = row.getCell(2).value;
      if (!rawName) continue;

      const fullName = rawName.toString().trim();
      const parsed = parseExcelName(fullName);
      const excelLastClean = clean(parsed.lastName);
      const excelFirstClean = clean(getBaseFirstName(parsed.firstName));

      excelNames.push({
        lastNameClean: excelLastClean,
        firstNameClean: excelFirstClean,
        rawName: fullName
      });
    }
  }

  console.log(`Loaded ${excelNames.length} names from Excel sheet.`);

  // 3. Compare and identify missing employees
  const keepEmployees: any[] = [];
  const purgeEmployees: any[] = [];
  const purgeEmployeeIds = new Set<number>();

  for (const emp of dbEmployees) {
    const dbLast = clean(emp.LastName);
    const dbFirst = clean(emp.FirstName);

    const hasMatch = excelNames.some((excel) => {
      if (excel.lastNameClean !== dbLast) return false;
      if (excel.firstNameClean === dbFirst) return true;
      if (isWordBoundaryPrefix(dbFirst, excel.firstNameClean) || isWordBoundaryPrefix(excel.firstNameClean, dbFirst)) {
        return true;
      }
      return false;
    });

    if (hasMatch) {
      keepEmployees.push(emp);
    } else {
      purgeEmployees.push(emp);
      purgeEmployeeIds.add(emp.EmployeeID);
    }
  }

  console.log(`Matching process complete:`);
  console.log(`Employees to KEEP: ${keepEmployees.length}`);
  console.log(`Employees to PURGE: ${purgeEmployees.length}`);

  if (purgeEmployees.length > 0) {
    console.log("\nSample of employees being purged:");
    purgeEmployees.slice(0, 10).forEach(emp => {
      console.log(`- ID: ${emp.EmployeeID} | ${emp.LastName}, ${emp.FirstName} (${emp.Office})`);
    });

    // 4. Purge learning needs
    const initialNeedsCount = dbNeeds.length;
    const keepNeeds = dbNeeds.filter((need: any) => !purgeEmployeeIds.has(need.EmployeeID));
    const purgedNeedsCount = initialNeedsCount - keepNeeds.length;

    console.log(`\nPurged ${purgedNeedsCount} associated learning needs.`);

    // 5. Update database object
    db.employees = keepEmployees;
    db.learningNeeds = keepNeeds;

    console.log(`Writing changes to database...`);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
    console.log(`Database updated! Total employees now: ${keepEmployees.length}`);
  } else {
    console.log("\nNo employees found in database that were missing from the Excel sheet. Database is already clean!");
  }
}

run().catch(console.error);
