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
  const xlsxPath = "C:\\Users\\AMD\\Downloads\\Copy of PGOListTemplateView.xlsx";
  const dbDir = path.join(process.cwd(), "database");
  const dbPath = path.join(dbDir, "db.json");
  const backupPath = path.join(dbDir, "db.json.bak2");

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
  
  // Track parsed names of Excel records to prevent duplicating them if they appear twice in sheet
  const processedNames = new Set<string>();

  let currentOffice = "";
  let currentCategory = "";

  const currentTime = new Date().toISOString();

  // Find starting max ID for auto-incrementing EmployeeIDs
  let maxId = dbEmployees.reduce((max: number, emp: any) => (emp.EmployeeID > max ? emp.EmployeeID : max), 0);

  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    const cell1 = row.getCell(1).value;
    const cell2 = row.getCell(2).value;

    if (cell1 !== null && cell1 !== undefined && typeof cell1 !== "number" && cell1 !== "No") {
      const text = cell1.toString().trim();
      const lower = text.toLowerCase();
      
      // Category vs Office distinction
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
      const rawName = row.getCell(2).value;
      if (!rawName) continue;

      const fullName = rawName.toString().trim();
      const lowerFullName = fullName.toLowerCase();
      if (processedNames.has(lowerFullName)) {
        console.log(`Skipping duplicate row for name in Excel: ${fullName}`);
        continue;
      }
      processedNames.add(lowerFullName);

      const parsed = parseExcelName(fullName);
      const excelLastClean = clean(parsed.lastName);
      const excelFirstClean = clean(getBaseFirstName(parsed.firstName));

      // Map Employment Type from category headers
      let employmentType = "Undefined (Pending Review)";
      const catLower = currentCategory.toLowerCase();
      if (catLower.includes("job order")) {
        employmentType = "Job Order";
      } else if (catLower.includes("casual")) {
        employmentType = "Casual";
      } else if (catLower.includes("consultant")) {
        employmentType = "Consultant";
      } else if (catLower.includes("permanent")) {
        employmentType = "Permanent";
      }

      // Map details from row cells
      const position = row.getCell(3).value?.toString().trim() || "Undefined (Pending Review)";
      const rawStatus = row.getCell(4).value?.toString().trim();
      const employmentStatus = rawStatus || "Undefined (Pending Review)";
      
      const rawGender = row.getCell(5).value?.toString().trim();
      const gender = rawGender ? (rawGender === "Female" || rawGender === "Male" ? rawGender : "Undefined (Pending Review)") : "Undefined (Pending Review)";

      const rawDoa = row.getCell(7).value;
      const dateOfAssumption = (rawDoa instanceof Date) ? rawDoa.toISOString() : (rawDoa ? new Date(rawDoa as any).toISOString() : undefined);

      // Search for matches in database
      let matchedEmp = dbEmployees.find((emp: any) => {
        const dbLast = clean(emp.LastName);
        const dbFirst = clean(emp.FirstName);
        if (dbLast !== excelLastClean) return false;
        
        if (dbFirst === excelFirstClean) return true;
        if (isWordBoundaryPrefix(dbFirst, excelFirstClean) || isWordBoundaryPrefix(excelFirstClean, dbFirst)) {
          return true;
        }
        return false;
      });

      if (matchedEmp) {
        // Update status, type, and other fields
        matchedEmp.EmploymentStatus = employmentStatus;
        matchedEmp.EmploymentType = employmentType;
        matchedEmp.Office = currentOffice;
        matchedEmp.Position = position;
        matchedEmp.Gender = gender;
        if (dateOfAssumption) {
          matchedEmp.DateOfAssumption = dateOfAssumption;
        }
        matchedEmp.UpdatedAt = currentTime;
        matchedEmp.UpdatedBy = "Excel Import";
        updatedCount++;
      } else {
        // Add new unique employee
        maxId++;
        const newEmp = {
          EmployeeID: maxId,
          FirstName: parsed.firstName,
          MiddleInitial: parsed.middleInitial,
          LastName: parsed.lastName,
          Office: currentOffice,
          Position: position,
          EmploymentType: employmentType,
          EmploymentStatus: employmentStatus,
          Gender: gender,
          DateOfAssumption: dateOfAssumption,
          CreatedAt: currentTime,
          UpdatedAt: currentTime,
          CreatedBy: "Excel Import",
          UpdatedBy: "Excel Import",
        };
        dbEmployees.push(newEmp);
        createdCount++;
      }
    }
  }

  // 3. Save database back
  console.log(`Writing changes to database...`);
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");

  console.log(`\nImport complete!`);
  console.log(`Updated existing employee statuses: ${updatedCount}`);
  console.log(`Inserted new unique employees: ${createdCount}`);
  console.log(`Total database employees: ${dbEmployees.length}`);
}

run().catch(console.error);
