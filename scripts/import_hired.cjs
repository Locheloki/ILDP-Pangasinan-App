const fs = require("fs");

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQuotes = !inQuotes; }
    else if (c === "," && !inQuotes) { result.push(current.trim()); current = ""; }
    else { current += c; }
  }
  result.push(current.trim());
  return result;
}

function readFile(path) {
  return fs.readFileSync(path, "utf-8").replace(/\r\n/g, "\n").split("\n");
}

function cleanStr(s) {
  if (!s) return "";
  return s.toString().trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").replace(/\s+/g, "");
}

function parseName(fullName) {
  let name = fullName.trim();
  if (/^Dr\.?\s*/i.test(name)) {
    name = name.replace(/^Dr\.?\s*/i, "").trim();
  }
  if (name.includes(",")) {
    const parts = name.split(",");
    const lastName = parts[0].trim();
    const rest = parts.slice(1).join(",").trim();
    const words = rest.split(/\s+/);
    let mi = "";
    let firstName = rest;
    if (words.length > 1) {
      const lastWord = words[words.length - 1];
      if (lastWord.length <= 2 && (lastWord.length === 1 || lastWord.endsWith("."))) {
        mi = lastWord;
        firstName = words.slice(0, -1).join(" ");
      } else {
        firstName = words.join(" ");
      }
    }
    return { lastName, firstName, mi };
  }
  const words = name.split(/\s+/);
  if (words.length >= 2) {
    const lastName = words[words.length - 1];
    const firstName = words.slice(0, -1).join(" ");
    return { lastName, firstName, mi: "" };
  }
  return { lastName: name, firstName: "", mi: "" };
}

function isWBP(longer, shorter) {
  if (!longer.startsWith(shorter)) return false;
  return longer.length === shorter.length || longer.charAt(shorter.length) === " ";
}

function parseCSVFile(filePath) {
  const lines = readFile(filePath);
  const employees = [];
  let headerIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const upperCols = cols.map(c => c.toUpperCase());
    if (upperCols.includes("NAME") && upperCols.includes("DESIGNATION")) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) return employees;

  const headers = parseCSVLine(lines[headerIdx]).map(h => h.toUpperCase().trim());
  let startRow = headerIdx + 2;

  for (let i = startRow; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseCSVLine(line);

    const nameIdx = headers.indexOf("NAME");
    const posIdx = headers.indexOf("DESIGNATION");
    const statusIdx = headers.indexOf("STATUS OF EMPLOYMENT");
    const officeIdx = headers.indexOf("OFFICE");
    const assumptionIdx = headers.indexOf("ASSUMPTION DATE");
    const remarksIdx = headers.indexOf("REMARKS");

    if (nameIdx === -1 || !cols[nameIdx]) continue;
    const name = cols[nameIdx].trim();
    if (!name || name.toUpperCase() === "NAME" || name.toUpperCase() === "NO.") continue;

    const noIdx = headers.indexOf("NO.");
    if (noIdx !== -1 && cols[noIdx]) {
      const no = cols[noIdx].trim();
      if (!no || isNaN(parseInt(no))) continue;
    }

    const position = posIdx !== -1 ? (cols[posIdx] || "").trim() : "";
    const empStatus = statusIdx !== -1 ? (cols[statusIdx] || "").trim() : "";
    const office = officeIdx !== -1 ? (cols[officeIdx] || "").trim() : "";
    const assumption = assumptionIdx !== -1 ? (cols[assumptionIdx] || "").trim() : "";
    const remarks = remarksIdx !== -1 ? (cols[remarksIdx] || "").trim() : "";

    // Determine NewlyHired ONLY from REMARKS
    let newlyHired = "N/A";
    const remarksLower = remarks.toLowerCase();
    if (remarksLower.includes("newly hired")) newlyHired = "Newly Hired";
    else if (remarksLower.includes("reemploy")) newlyHired = "Reemployed";

    employees.push({ name, position, empStatus: empStatus || "Undefined (Pending Review)", office, assumption, remarks, newlyHired });
  }
  return employees;
}

// --- Main ---
const base = "C:\\Users\\AMD\\Downloads";
const f1 = parseCSVFile(base + "\\Hired (Non-Permanent) - Offices (new).csv");
const f2 = parseCSVFile(base + "\\Hired (Non-Permanent) - Offices (jo to ca).csv");
const f3 = parseCSVFile(base + "\\Hired (Non-Permanent) - Hospitals (new).csv");

const allCSV = [...f1, ...f2, ...f3];

console.log("CSV employees parsed:");
console.log("  Offices (new):", f1.length);
console.log("  Offices (jo to ca):", f2.length);
console.log("  Hospitals (new):", f3.length);
console.log("  Total:", allCSV.length);

// Count tags
const tagCounts = {};
for (const e of allCSV) {
  tagCounts[e.newlyHired] = (tagCounts[e.newlyHired] || 0) + 1;
}
console.log("  Tags:", tagCounts);

// Load DB
const db = JSON.parse(fs.readFileSync("database/db.json", "utf-8"));
const before = db.employees.length;

let matched = 0;
let newlyHiredUpdated = 0;
let inserted = 0;
let insertNewlyHired = 0;
let insertReemployed = 0;
let insertNA = 0;
const newEmpIds = db.employees.map(e => e.EmployeeID);
let nextId = Math.max(...newEmpIds) + 1;

for (const csvEmp of allCSV) {
  const parsed = parseName(csvEmp.name);
  const csvLast = cleanStr(parsed.lastName);
  const csvFirst = cleanStr(parsed.firstName);

  // Find best match in DB
  let bestMatch = null;
  let bestScore = 0;

  for (const dbEmp of db.employees) {
    const dbLast = cleanStr(dbEmp.LastName);
    if (dbLast !== csvLast) continue;
    const dbFirst = cleanStr(dbEmp.FirstName);
    let nameScore = 0;
    if (dbFirst === csvFirst) nameScore = 100;
    else if (isWBP(dbFirst, csvFirst) || isWBP(csvFirst, dbFirst)) nameScore = 50;
    if (nameScore > bestScore) {
      bestScore = nameScore;
      bestMatch = dbEmp;
    }
  }

  if (bestScore >= 50 && bestMatch) {
    matched++;
    // Only update NewlyHired if CSV has a meaningful value (not N/A)
    if (csvEmp.newlyHired !== "N/A" && bestMatch.NewlyHired !== csvEmp.newlyHired) {
      bestMatch.NewlyHired = csvEmp.newlyHired;
      newlyHiredUpdated++;
    }
    // Update placeholder fields
    if (csvEmp.office && (bestMatch.Office || "").includes("Undefined")) {
      bestMatch.Office = csvEmp.office;
    }
    if (csvEmp.position && (bestMatch.Position || "").includes("Undefined")) {
      bestMatch.Position = csvEmp.position;
    }
  } else {
    // New employee
    const newEmp = {
      EmployeeID: nextId++,
      FirstName: parsed.firstName || csvEmp.name,
      MiddleInitial: parsed.mi || "",
      LastName: parsed.lastName,
      Office: csvEmp.office || "Undefined (Pending Review)",
      Position: csvEmp.position || "Undefined (Pending Review)",
      EmploymentStatus: csvEmp.empStatus,
      EmploymentType: csvEmp.empStatus,
      Gender: "Undefined (Pending Review)",
      NewlyHired: csvEmp.newlyHired,
      DateOfAssumption: csvEmp.assumption ? (() => { try { return new Date(csvEmp.assumption).toISOString(); } catch { return undefined; } })() : undefined,
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
      CreatedBy: "csv-import",
      UpdatedBy: "csv-import",
    };
    db.employees.push(newEmp);
    inserted++;
    if (csvEmp.newlyHired === "Newly Hired") insertNewlyHired++;
    else if (csvEmp.newlyHired === "Reemployed") insertReemployed++;
    else insertNA++;
  }
}

console.log("\n--- Results ---");
console.log("Matched to existing DB:", matched);
console.log("NewlyHired updated:", newlyHiredUpdated);
console.log("New employees inserted:", inserted);
console.log("  of which Newly Hired:", insertNewlyHired);
console.log("  of which Reemployed:", insertReemployed);
console.log("  of which N/A:", insertNA);
console.log("DB:", before, "->", db.employees.length);

// Summary
const counts = {};
for (const e of db.employees) {
  const v = e.NewlyHired || "undefined";
  counts[v] = (counts[v] || 0) + 1;
}
console.log("\nNewlyHired breakdown:");
for (const [k, v] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
  console.log("  " + k + ": " + v);
}

fs.writeFileSync("database/db.json", JSON.stringify(db, null, 2), "utf-8");
console.log("\nDatabase saved.");
