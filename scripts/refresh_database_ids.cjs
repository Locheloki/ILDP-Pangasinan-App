const fs = require("fs");
const path = require("path");

const dbPath = path.join(process.cwd(), "database", "db.json");
const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

function nextAvailableId(used, currentMax) {
  let next = currentMax + 1;
  while (used.has(next)) next += 1;
  return next;
}

function refreshUniqueIds(rows, idField) {
  const used = new Set();
  let maxId = rows.reduce((max, row) => {
    const id = Number(row[idField]);
    return Number.isFinite(id) && id > max ? id : max;
  }, 0);
  const reassigned = [];

  for (const row of rows) {
    const currentId = Number(row[idField]);
    if (Number.isFinite(currentId) && currentId > 0 && !used.has(currentId)) {
      row[idField] = currentId;
      used.add(currentId);
      continue;
    }

    const newId = nextAvailableId(used, maxId);
    reassigned.push({
      oldId: Number.isFinite(currentId) ? currentId : null,
      newId,
      name: [row.LastName, row.FirstName].filter(Boolean).join(", "),
      office: row.Office,
    });
    row[idField] = newId;
    used.add(newId);
    maxId = Math.max(maxId, newId);
  }

  return reassigned;
}

const employeeReassignments = refreshUniqueIds(db.employees || [], "EmployeeID");
const learningNeedReassignments = refreshUniqueIds(db.learningNeeds || [], "LearningNeedID");

fs.writeFileSync(dbPath, `${JSON.stringify(db, null, 2)}\n`, "utf8");

console.log(`Reassigned employee IDs: ${employeeReassignments.length}`);
console.log(`Reassigned learning need IDs: ${learningNeedReassignments.length}`);

const notable = employeeReassignments.filter((item) =>
  /marvin|alvin/i.test(item.name || "")
);

if (notable.length > 0) {
  console.log("Marvin/Alvin repaired rows:");
  for (const item of notable) {
    console.log(`- ${item.name}: ${item.oldId} -> ${item.newId} (${item.office || "No office"})`);
  }
}
