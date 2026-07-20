const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "database", "db.json");
const SEMINARS_DIR = "C:\\Users\\AMD\\Downloads\\2026-20260720T011054Z-1-001";

const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
if (!db.seminars) db.seminars = [];
if (!db.seminarAttendees) db.seminarAttendees = [];

// Build employee name lookup maps
const empByName = new Map();
const empByComma = new Map();
const empByFirstLast = new Map();

db.employees.forEach((emp) => {
  const full = `${emp.FirstName} ${emp.MiddleInitial || ""} ${emp.LastName}`.replace(/\s+/g, " ").trim().toLowerCase();
  empByName.set(full, emp);
  const comma = `${emp.LastName}, ${emp.FirstName} ${emp.MiddleInitial || ""}`.replace(/\s+/g, " ").trim().toLowerCase();
  empByComma.set(comma, emp);
  const firstLast = `${emp.FirstName} ${emp.LastName}`.toLowerCase().replace(/\s+/g, " ").trim();
  empByFirstLast.set(firstLast, emp);
  const lastFirst = `${emp.LastName}, ${emp.FirstName}`.toLowerCase().replace(/\s+/g, " ").trim();
  empByFirstLast.set(lastFirst, emp);
});

function matchEmployee(nameStr) {
  if (!nameStr || nameStr.trim().length < 2) return null;
  const clean = nameStr.trim().replace(/\s+/g, " ");
  const lower = clean.toLowerCase();

  // Direct lookup
  if (empByName.has(lower)) return empByName.get(lower);
  if (empByComma.has(lower)) return empByComma.get(lower);
  if (empByFirstLast.has(lower)) return empByFirstLast.get(lower);

  // Try stripping middle initials
  const stripped = lower.replace(/\b[a-z]\.\s*/gi, "").replace(/\s+/g, " ").trim();
  if (empByFirstLast.has(stripped)) return empByFirstLast.get(stripped);

  // Try Last, First pattern from "First M. Last" format
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    const first = parts[0];
    const mi = parts.length > 2 ? parts.slice(1, -1).join(" ") : "";
    const tryComma = `${last}, ${first} ${mi}`.toLowerCase().replace(/\s+/g, " ").trim();
    if (empByComma.has(tryComma)) return empByComma.get(tryComma);
    const tryFirstLast = `${first} ${last}`.toLowerCase().replace(/\s+/g, " ").trim();
    if (empByFirstLast.has(tryFirstLast)) return empByFirstLast.get(tryFirstLast);
  }

  // Fuzzy: check if any DB name starts with the input
  for (const [key, emp] of empByFirstLast) {
    const empFull = `${emp.LastName}, ${emp.FirstName}`.toLowerCase();
    if (empFull.includes(lower) || lower.includes(empFull)) return emp;
    const empFirstLast = `${emp.FirstName} ${emp.LastName}`.toLowerCase();
    if (empFirstLast.includes(lower) || lower.includes(empFirstLast)) return emp;
  }

  return null;
}

function getQuarter(monthStr) {
  const m = monthStr.toLowerCase().trim();
  if (["january", "february", "march", "jan", "feb", "mar"].some(x => m.startsWith(x))) return "Q1";
  if (["april", "may", "june", "apr", "may", "jun"].some(x => m.startsWith(x))) return "Q2";
  if (["july", "august", "september", "jul", "aug", "sep"].some(x => m.startsWith(x))) return "Q3";
  if (["october", "november", "december", "oct", "nov", "dec"].some(x => m.startsWith(x))) return "Q4";
  return "Q2";
}

function parseDateFromText(text) {
  if (!text) return null;
  const match = text.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:-|\s+to\s+)?(\d{1,2})?,?\s*(\d{4})/i);
  if (match) {
    const month = match[1];
    const day = match[2];
    const year = match[4];
    const dateStr = `${month} ${day}, ${year}`;
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  }
  const simple = text.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s*(\d{4})/i);
  if (simple) {
    const parsed = new Date(`${simple[1]} ${simple[2]}, ${simple[3]}`);
    if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  }
  return null;
}

function getMonthFromText(text) {
  if (!text) return null;
  const match = text.match(/(january|february|march|april|may|june|july|august|september|october|november|december)/i);
  return match ? match[1] : null;
}

function getYearFromText(text) {
  if (!text) return 2026;
  const match = text.match(/(20\d{2})/);
  return match ? parseInt(match[1]) : 2026;
}

async function parseExcelFile(filePath) {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.worksheets[0];
    if (!sheet || sheet.rowCount < 5) return null;

    // Try to extract title/date from header rows
    let title = "";
    let dateStr = "";
    let headerRowIdx = -1;
    let nameColIdx = -1;
    let officeColIdx = -1;
    let positionColIdx = -1;

    for (let r = 1; r <= Math.min(15, sheet.rowCount); r++) {
      const row = sheet.getRow(r);
      for (let c = 1; c <= Math.min(15, row.cellCount); c++) {
        const val = row.getCell(c).value?.toString().trim();
        if (!val) continue;
        if (val.includes("PROVINCE OF") || val.includes("HUMAN RESOURCE") || val.includes("ORGANIZING BODY")) continue;

        // Detect header row
        const lower = val.toLowerCase();
        if (lower === "names" || lower === "name" || lower.includes("employee name") || lower === "no.") {
          headerRowIdx = r;
          // Map columns
          for (let cc = 1; cc <= Math.min(15, row.cellCount); cc++) {
            const hv = row.getCell(cc).value?.toString().toLowerCase().trim();
            if (!hv) continue;
            if (hv.includes("names") || hv === "name" || hv.includes("employee")) nameColIdx = cc;
            if (hv.includes("office") || hv.includes("hospital") || hv.includes("department")) officeColIdx = cc;
            if (hv.includes("position") || hv.includes("function") || hv.includes("designation")) positionColIdx = cc;
          }
        }
      }
    }

    // If no header found with "names", try "No." pattern
    if (headerRowIdx === -1) {
      for (let r = 1; r <= Math.min(15, sheet.rowCount); r++) {
        const row = sheet.getRow(r);
        const vals = [];
        for (let c = 1; c <= Math.min(10, row.cellCount); c++) {
          vals.push(row.getCell(c).value?.toString().toLowerCase().trim() || "");
        }
        if (vals.includes("no.") && (vals.includes("names") || vals.includes("name"))) {
          headerRowIdx = r;
          for (let c = 1; c <= vals.length; c++) {
            const v = vals[c - 1];
            if (v.includes("names") || v === "name") nameColIdx = c;
            if (v.includes("office") || v.includes("hospital")) officeColIdx = c;
            if (v.includes("position") || v.includes("function") || v.includes("designation")) positionColIdx = c;
          }
          break;
        }
      }
    }

    if (headerRowIdx === -1) return null;

    // Fallback column indices
    if (nameColIdx === -1) {
      // Name is usually column 2 or 3
      const r2 = sheet.getRow(headerRowIdx);
      for (let c = 2; c <= 5; c++) {
        const v = r2.getCell(c).value?.toString().toLowerCase().trim();
        if (v && (v.includes("name") || v.includes("names"))) {
          nameColIdx = c;
          break;
        }
      }
      if (nameColIdx === -1) nameColIdx = 2; // Default
    }
    if (officeColIdx === -1) {
      for (let c = 1; c <= 10; c++) {
        const v = sheet.getRow(headerRowIdx).getCell(c).value?.toString().toLowerCase().trim();
        if (v && (v.includes("office") || v.includes("hospital") || v.includes("department"))) {
          officeColIdx = c;
          break;
        }
      }
      if (officeColIdx === -1 && nameColIdx + 1 <= sheet.getRow(headerRowIdx).cellCount) officeColIdx = nameColIdx + 1;
    }
    if (positionColIdx === -1) {
      for (let c = 1; c <= 12; c++) {
        const v = sheet.getRow(headerRowIdx).getCell(c).value?.toString().toLowerCase().trim();
        if (v && (v.includes("position") || v.includes("function") || v.includes("designation"))) {
          positionColIdx = c;
          break;
        }
      }
    }

    // Check for split name columns (LAST NAME | GIVEN NAME | MIDDLE NAME)
    let lastNameCol = -1, firstNameCol = -1, middleNameCol = -1;
    const hr = sheet.getRow(headerRowIdx);
    for (let c = 1; c <= Math.min(15, hr.cellCount); c++) {
      const v = hr.getCell(c).value?.toString().toLowerCase().trim() || "";
      if (v.includes("last name") || v === "last name") lastNameCol = c;
      if (v.includes("given name") || v.includes("first name")) firstNameCol = c;
      if (v.includes("middle name") || v === "middle name") middleNameCol = c;
    }
    const hasSplitNames = lastNameCol !== -1 && firstNameCol !== -1;

    // Also check for a subtitle row below header (FROM/TO for duration)
    let dataStartRow = headerRowIdx + 1;
    // Check if next row is a sub-header (FROM/TO/etc)
    if (dataStartRow <= sheet.rowCount) {
      const nextRow = sheet.getRow(dataStartRow);
      let isSubHeader = false;
      for (let c = 1; c <= Math.min(10, nextRow.cellCount); c++) {
        const v = nextRow.getCell(c).value?.toString().toLowerCase().trim() || "";
        if (v === "from" || v === "to" || v.includes("duration") || v.includes("status")) {
          isSubHeader = true;
          break;
        }
      }
      if (isSubHeader) dataStartRow++;
    }

    // Extract attendee names
    const attendees = [];
    for (let i = dataStartRow; i <= sheet.rowCount; i++) {
      const row = sheet.getRow(i);

      let name = "";
      let office = "";

      if (hasSplitNames) {
        const ln = (row.getCell(lastNameCol).value?.toString() || "").trim();
        const fn = (row.getCell(firstNameCol).value?.toString() || "").trim();
        const mn = middleNameCol !== -1 ? (row.getCell(middleNameCol).value?.toString() || "").trim() : "";
        if (!ln && !fn) continue;
        name = mn ? `${ln}, ${fn} ${mn}` : `${ln}, ${fn}`;
        office = officeColIdx !== -1 ? (row.getCell(officeColIdx).value?.toString() || "").trim() : "";
      } else {
        // Single name column
        const raw = (row.getCell(nameColIdx).value?.toString() || "").trim();
        if (!raw) continue;
        name = raw;
        office = officeColIdx !== -1 ? (row.getCell(officeColIdx).value?.toString() || "").trim() : "";
      }

      // Filter junk rows
      const lower = name.toLowerCase();
      if (!name || lower.includes("total") || lower.includes("page") || lower.includes("names")
        || lower.includes("no.") || lower.includes("sub-total") || /^\d+$/.test(lower)
        || lower.includes("date:") || lower.includes("january") || lower.includes("february")
        || lower.includes("march") || lower.includes("april") || lower.includes("may ")
        || lower.includes("june") || lower.includes("july") || lower.includes("august")
        || lower.includes("september") || lower.includes("october") || lower.includes("november")
        || lower.includes("december") || lower.includes("list of")) continue;

      // Skip if no. column has non-numeric (header repetition)
      const cell1 = row.getCell(1).value;
      if (cell1 && typeof cell1 === "string" && (cell1.toLowerCase().includes("no") || cell1.toLowerCase().includes("date"))) continue;

      attendees.push({ name, office });
    }

    return { attendees, headerRowIdx };
  } catch (err) {
    console.error(`  Error reading ${path.basename(filePath)}:`, err.message);
    return null;
  }
}

function getSeminarInfoFromPath(filePath) {
  const dir = path.dirname(filePath);
  const folderName = path.basename(dir);

  let quarter = "Q2";
  let year = 2026;
  let title = folderName;

  const parentDir = path.basename(path.dirname(dir));
  if (parentDir.includes("1st Quarter")) quarter = "Q1";
  else if (parentDir.includes("2nd Quarter")) quarter = "Q2";
  else if (parentDir.includes("3rd Quarter")) quarter = "Q3";
  else if (parentDir.includes("4th Quarter")) quarter = "Q4";

  const month = getMonthFromText(folderName);
  if (month) quarter = getQuarter(month);

  year = getYearFromText(folderName);
  if (year === 2026 && parentDir.includes("2026")) year = 2026;

  const date = parseDateFromText(folderName);

  // Clean title from folder name
  title = folderName.replace(/\b(\d{1,2})(st|nd|rd|th)\b/gi, "").replace(/\s+/g, " ").trim();
  title = title.replace(/,\s*\d{4}/, "").trim();

  return { title, year, quarter, date };
}

async function main() {
  console.log("=== SEMINAR BATCH IMPORT ===\n");

  // Walk directory tree to find all xlsx files
  function walkDir(dir) {
    let files = [];
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const full = path.join(dir, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        files = files.concat(walkDir(full));
      } else if (item.endsWith(".xlsx") && !item.startsWith("~$")) {
        files.push(full);
      }
    }
    return files;
  }

  const allFiles = walkDir(SEMINARS_DIR);
  console.log(`Found ${allFiles.length} Excel files\n`);

  // Group files by their parent seminar folder
  const seminarFolders = new Map();
  for (const file of allFiles) {
    const folder = path.dirname(file);
    if (!seminarFolders.has(folder)) seminarFolders.set(folder, []);
    seminarFolders.get(folder).push(file);
  }

  console.log(`Found ${seminarFolders.size} seminar folders\n`);

  let totalSeminarsCreated = 0;
  let totalAttendeesAdded = 0;
  let totalMatched = 0;
  let totalUnmatched = 0;
  const allUnmatched = [];

  for (const [folder, files] of seminarFolders) {
    const folderName = path.basename(folder);
    const info = getSeminarInfoFromPath(files[0]);
    console.log(`--- ${folderName} ---`);
    console.log(`  Title: ${info.title}`);
    console.log(`  Year: ${info.year}, Quarter: ${info.quarter}, Date: ${info.date || "N/A"}`);
    console.log(`  Files: ${files.length}`);

    // Collect all unique attendees from all files in this folder
    const allAttendees = new Map(); // name -> {name, office}
    const fileTypes = [];

    for (const file of files) {
      const fileName = path.basename(file);
      const result = await parseExcelFile(file);
      if (!result) {
        console.log(`  [SKIP] ${fileName} - could not parse`);
        continue;
      }

      let fileType = "unknown";
      if (fileName.toLowerCase().includes("pre") && fileName.toLowerCase().includes("post")) fileType = "test";
      else if (fileName.toLowerCase().includes("eval")) fileType = "evaluation";
      else if (fileName.toLowerCase().includes("competency")) fileType = "competency";
      else if (fileName.toLowerCase().includes("attendance")) fileType = "attendance";
      fileTypes.push(fileType);

      console.log(`  [OK] ${fileName} (${fileType}): ${result.attendees.length} names`);

      for (const att of result.attendees) {
        const key = att.name.toLowerCase().replace(/\s+/g, " ").trim();
        if (!allAttendees.has(key)) {
          allAttendees.set(key, att);
        }
      }
    }

    // Only create seminar if we found attendees
    if (allAttendees.size === 0) {
      console.log(`  [SKIP] No attendees found\n`);
      continue;
    }

    console.log(`  Total unique names: ${allAttendees.size}`);

    // Match against DB
    const matched = [];
    const unmatched = [];

    for (const [key, att] of allAttendees) {
      const emp = matchEmployee(att.name);
      if (emp) {
        matched.push(emp);
      } else {
        unmatched.push(att);
      }
    }

    console.log(`  Matched: ${matched.length}, Unmatched: ${unmatched.length}`);

    if (unmatched.length > 0) {
      for (const u of unmatched.slice(0, 5)) {
        console.log(`    ? ${u.name} (${u.office})`);
      }
      if (unmatched.length > 5) console.log(`    ... and ${unmatched.length - 5} more`);
    }

    // Create seminar record
    let sem = db.seminars.find(s =>
      s.title.toLowerCase().trim() === info.title.toLowerCase().trim() &&
      s.year === info.year &&
      s.quarter === info.quarter
    );

    if (!sem) {
      sem = {
        id: "sem_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        title: info.title,
        year: info.year,
        quarter: info.quarter,
        date: info.date || "",
        location: "",
        remarks: "Imported from Excel batch",
        createdAt: new Date().toISOString()
      };
      db.seminars.push(sem);
      totalSeminarsCreated++;
      console.log(`  [CREATED] Seminar: ${sem.title} (${sem.year} ${sem.quarter})`);
    } else {
      console.log(`  [EXISTS] Seminar already exists: ${sem.title}`);
    }

    // Add matched employees as attendees
    let added = 0;
    let skipped = 0;
    for (const emp of matched) {
      const exists = db.seminarAttendees.some(sa => sa.seminarId === sem.id && sa.employeeId === emp.EmployeeID);
      if (!exists) {
        db.seminarAttendees.push({
          id: "sa_" + Date.now() + "_" + Math.floor(Math.random() * 100000),
          seminarId: sem.id,
          employeeId: emp.EmployeeID,
          createdAt: new Date().toISOString()
        });
        added++;
      } else {
        skipped++;
      }
    }

    totalAttendeesAdded += added;
    totalMatched += matched.length;
    totalUnmatched += unmatched.length;
    for (const u of unmatched) {
      allUnmatched.push({ ...u, seminar: info.title });
    }

    console.log(`  Attendees added: ${added}, Duplicates skipped: ${skipped}\n`);
  }

  // Save database
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  console.log("\n=== SUMMARY ===");
  console.log(`Seminars created: ${totalSeminarsCreated}`);
  console.log(`Total attendees added: ${totalAttendeesAdded}`);
  console.log(`Total matched: ${totalMatched}`);
  console.log(`Total unmatched: ${totalUnmatched}`);
  console.log(`Database saved to ${DB_PATH}`);

  if (allUnmatched.length > 0) {
    console.log(`\n=== UNMATCHED EMPLOYEES (${allUnmatched.length}) ===`);
    for (const u of allUnmatched) {
      console.log(`  ${u.name} (${u.office}) - Seminar: ${u.seminar}`);
    }
  }

  console.log(`\nDone.`);
}

main().catch(console.error);
