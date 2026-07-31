const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "database", "db.json");

function run() {
  const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  let modifiedRecords = [];

  for (const emp of db.employees) {
    if (!emp.FirstName) continue;

    // Rule 2: DO NOT make any changes if "Dela" appears in the Last Name field.
    if (emp.LastName && /\bdela\b/i.test(emp.LastName)) {
      continue;
    }

    if (/\bdela\b/i.test(emp.FirstName)) {
      const oldFirst = emp.FirstName;
      const oldMI = emp.MiddleInitial || '';

      // Replace "Dela" and any trailing spaces to avoid double spaces
      emp.FirstName = emp.FirstName.replace(/\bdela\s*/ig, '').trim();

      // Rule 3: If the Middle Initial is already "D", leave it unchanged.
      // (Also handling "D." just in case it was already normalized)
      if (emp.MiddleInitial !== 'D' && emp.MiddleInitial !== 'D.') {
        emp.MiddleInitial = 'D';
      }

      modifiedRecords.push({
        EmployeeID: emp.EmployeeID,
        LastName: emp.LastName,
        OldFirstName: oldFirst,
        NewFirstName: emp.FirstName,
        OldMI: oldMI,
        NewMI: emp.MiddleInitial
      });
    }
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  
  console.log(`Modified ${modifiedRecords.length} records:`);
  modifiedRecords.forEach(r => {
    console.log(`- ID: ${r.EmployeeID} | Last: ${r.LastName} | First: ${r.OldFirstName} -> ${r.NewFirstName} | MI: ${r.OldMI} -> ${r.NewMI}`);
  });
}

run();
