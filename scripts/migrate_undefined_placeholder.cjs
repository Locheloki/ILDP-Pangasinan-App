const fs = require("fs");
const path = require("path");

const dbPath = path.join(process.cwd(), "database", "db.json");
const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

let placeholderUpdates = 0;
let dateFieldsRemoved = 0;

function migrateValue(value) {
  if (typeof value === "string") {
    const next = value
      .replaceAll("Unidentified (Pending Review)", "Undefined (Pending Review)")
      .replaceAll("unidentified (pending review)", "undefined (pending review)")
      .replaceAll("Unidentified", "Undefined")
      .replaceAll("unidentified", "undefined");
    if (next !== value) placeholderUpdates++;
    return next;
  }

  if (Array.isArray(value)) {
    return value.map(migrateValue);
  }

  if (value && typeof value === "object") {
    for (const key of Object.keys(value)) {
      value[key] = migrateValue(value[key]);
    }
  }

  return value;
}

migrateValue(db);

for (const emp of db.employees || []) {
  if (
    emp.DateOfAssumption === null ||
    emp.DateOfAssumption === undefined ||
    emp.DateOfAssumption === "" ||
    Number.isNaN(new Date(emp.DateOfAssumption).getTime())
  ) {
    if (Object.prototype.hasOwnProperty.call(emp, "DateOfAssumption")) {
      delete emp.DateOfAssumption;
      dateFieldsRemoved++;
    }
  }
}

fs.writeFileSync(dbPath, `${JSON.stringify(db, null, 2)}\n`, "utf8");

console.log(`Placeholder updates: ${placeholderUpdates}`);
console.log(`Blank DateOfAssumption fields removed: ${dateFieldsRemoved}`);
