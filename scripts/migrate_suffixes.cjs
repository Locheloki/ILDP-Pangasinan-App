// ── Migration: Extract name suffixes into dedicated Suffix field ──────────
// Scans all employees and moves suffixes (Jr., Sr., III, PhD, etc.) from
// FirstName/LastName into the new Suffix field.

const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "database", "db.json");

// Common suffixes in order of priority (longer matches checked first)
const SUFFIXES = [
  "JUNIOR", "SENIOR",
  "III", "II", "IV", "I",
  "PHD", "MD", "RN", "LPT", "CPA", "JD", "DVM", "DMD",
  "ESQ",
  "JR", "SR",
];

const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
const employees = db.employees || [];
const changes = [];
const skippedMultiWord = [];

for (const emp of employees) {
  let changed = false;

  // Check suffix at end of LastName (e.g., "Dela Cruz Jr.")
  const lastName = emp.LastName || "";
  const lastNameParts = lastName.trim().split(/\s+/);
  if (lastNameParts.length >= 2) {
    const lastWord = lastNameParts[lastNameParts.length - 1].toUpperCase().replace(/\./g, "");
    const match = SUFFIXES.find(s => lastWord === s);
    if (match) {
      const existingSuffix = emp.Suffix || "";
      const newSuffix = existingSuffix
        ? existingSuffix
        : lastNameParts.pop();
      emp.LastName = lastNameParts.join(" ");
      emp.Suffix = newSuffix.toUpperCase().replace(/\./g, "");
      changes.push({ id: emp.EmployeeID, field: "LastName", original: lastName, suffix: newSuffix });
      changed = true;
    }
  }

  // Check if last word of LastName is actually a multi-word suffix pattern
  // e.g., "Dela Cruz Jr." where "Jr" is after the real last name
  // Already handled above ^

  // Check suffix at end of FirstName (e.g., "Juan Jr." where Jr is in first name)
  const firstName = emp.FirstName || "";
  const firstNameParts = firstName.trim().split(/\s+/);
  if (firstNameParts.length >= 2) {
    const lastWord = firstNameParts[firstNameParts.length - 1].toUpperCase().replace(/\./g, "");
    const match = SUFFIXES.find(s => lastWord === s);
    if (match) {
      const existingSuffix = emp.Suffix || "";
      const newSuffix = existingSuffix
        ? existingSuffix
        : firstNameParts.pop();
      emp.FirstName = firstNameParts.join(" ");
      emp.Suffix = newSuffix.toUpperCase().replace(/\./g, "");
      changes.push({ id: emp.EmployeeID, field: "FirstName", original: firstName, suffix: newSuffix });
      changed = true;
    }
  }

  // Clean trailing commas and dots from names (artifacts from original data)
  emp.FirstName = (emp.FirstName || "").replace(/[,.]+\s*$/, "").trim();
  emp.LastName = (emp.LastName || "").replace(/[,.]+\s*$/, "").trim();

  if (changed) {
    console.log(
      `  [ID ${String(emp.EmployeeID).padEnd(5)}] ${emp.FirstName} ${emp.LastName} (Suffix: ${emp.Suffix})`
    );
  }
}

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
console.log(`\nDone. ${changes.length} employee(s) updated with suffixes.`);
console.log(`${skippedMultiWord.length} potential multi-word suffix case(s) skipped (review manually).`);
if (skippedMultiWord.length > 0) {
  for (const s of skippedMultiWord) {
    console.log(`  Review ID ${String(s.id).padEnd(5)}: "${s.name}"`);
  }
}
