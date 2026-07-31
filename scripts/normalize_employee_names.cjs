const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "database", "db.json");

function titleCase(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function normalizeMiddleInitial(val) {
  if (!val) return "";
  const cleaned = val.trim().toUpperCase();
  if (cleaned.length === 1) return cleaned + ".";
  if (cleaned.length === 2 && cleaned.endsWith(".")) return cleaned;
  return cleaned.charAt(0) + ".";
}

const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));

let firstNameFixed = 0;
let lastNameFixed = 0;
let middleInitialFixed = 0;

for (const emp of db.employees) {
  const oldFirst = emp.FirstName || "";
  const oldLast = emp.LastName || "";
  const oldMI = emp.MiddleInitial || "";

  const fixedFirst = titleCase(oldFirst);
  const fixedLast = titleCase(oldLast);
  const fixedMI = normalizeMiddleInitial(oldMI);

  if (oldFirst !== fixedFirst) {
    emp.FirstName = fixedFirst;
    firstNameFixed++;
  }
  if (oldLast !== fixedLast) {
    emp.LastName = fixedLast;
    lastNameFixed++;
  }
  if (oldMI !== fixedMI) {
    emp.MiddleInitial = fixedMI;
    middleInitialFixed++;
  }
}

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");

console.log(`Total employees: ${db.employees.length}`);
console.log(`FirstName corrected: ${firstNameFixed}`);
console.log(`LastName corrected: ${lastNameFixed}`);
console.log(`MiddleInitial corrected: ${middleInitialFixed}`);
console.log("All names normalized to Title Case. Relationships preserved (EmployeeID unchanged).");
