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

function normalizeStringArray(val) {
  if (Array.isArray(val)) {
    return val.map(v => titleCase(v || ""));
  }
  if (typeof val === "string") {
    return titleCase(val);
  }
  return val;
}

const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));

let firstNameFixed = 0;
let lastNameFixed = 0;
let middleInitialFixed = 0;
let needFixed = 0;
let basisFixed = 0;
let methodFixed = 0;

for (const emp of db.employees) {
  const oldFirst = emp.FirstName || "";
  const oldLast = emp.LastName || "";
  const oldMI = emp.MiddleInitial || "";

  const fixedFirst = titleCase(oldFirst);
  const fixedLast = titleCase(oldLast);
  const fixedMI = normalizeMiddleInitial(oldMI);

  if (oldFirst !== fixedFirst) { emp.FirstName = fixedFirst; firstNameFixed++; }
  if (oldLast !== fixedLast) { emp.LastName = fixedLast; lastNameFixed++; }
  if (oldMI !== fixedMI) { emp.MiddleInitial = fixedMI; middleInitialFixed++; }
}

for (const n of (db.learningNeeds || [])) {
  const oldNeed = n.LearningNeed || "";
  const fixedNeed = titleCase(oldNeed);
  if (oldNeed !== fixedNeed) { n.LearningNeed = fixedNeed; needFixed++; }

  const oldBasis = n.Basis;
  const fixedBasis = normalizeStringArray(oldBasis);
  if (JSON.stringify(oldBasis) !== JSON.stringify(fixedBasis)) {
    n.Basis = fixedBasis;
    basisFixed++;
  }

  const oldMethod = n.Methodology;
  const fixedMethod = normalizeStringArray(oldMethod);
  if (JSON.stringify(oldMethod) !== JSON.stringify(fixedMethod)) {
    n.Methodology = fixedMethod;
    methodFixed++;
  }
}

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");

console.log(`=== Employee Name Corrections ===`);
console.log(`Employees scanned: ${db.employees.length}`);
console.log(`FirstName corrected: ${firstNameFixed}`);
console.log(`LastName corrected: ${lastNameFixed}`);
console.log(`MiddleInitial corrected: ${middleInitialFixed}`);
console.log(``);
console.log(`=== Learning Need Corrections ===`);
console.log(`Learning needs scanned: ${(db.learningNeeds || []).length}`);
console.log(`LearningNeed corrected: ${needFixed}`);
console.log(`Basis corrected: ${basisFixed}`);
console.log(`Methodology corrected: ${methodFixed}`);
console.log(``);
console.log(`All names and learning needs normalized to Title Case.`);
console.log(`All relationships and IDs preserved.`);
