const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "database", "db.json");

function run() {
  const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  let modifiedRecords = [];

  for (const emp of db.employees) {
    if (!emp.FirstName) continue;

    // Rule 2: DO NOT make any changes if "Del" or "Delos" appears in the Last Name field.
    if (emp.LastName && /\b(del|delos)\b/i.test(emp.LastName)) {
      continue;
    }

    // Match standalone "Del" or "Delos" (case-insensitive)
    if (/\b(del|delos)\b/i.test(emp.FirstName)) {
      const oldFirst = emp.FirstName;
      const oldMI = emp.MiddleInitial || '';

      // Replace and clean spaces
      emp.FirstName = emp.FirstName.replace(/\b(del|delos)\b\s*/ig, '').trim();
      emp.FirstName = emp.FirstName.replace(/\s{2,}/g, ' ');

      // Rule 3: If the Middle Initial is already "D", leave it unchanged.
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
  
  let md = '# Modified "Del" and "Delos" Records\n\n';
  md += '| ID | Last Name | Old First Name | New First Name | Old MI | New MI |\n';
  md += '|---|---|---|---|---|---|\n';
  
  modifiedRecords.forEach(m => {
    md += `| ${m.EmployeeID} | ${m.LastName} | ${m.OldFirstName} | ${m.NewFirstName} | ${m.OldMI} | ${m.NewMI} |\n`;
    console.log(`- ID: ${m.EmployeeID} | Last: ${m.LastName} | First: ${m.OldFirstName} -> ${m.NewFirstName} | MI: ${m.OldMI} -> ${m.NewMI}`);
  });

  const brainDir = p => path.join(__dirname, '..', 'brain', 'ece6a480-36bd-4a52-9901-10b1b1ac4b60', p);
  fs.writeFileSync(brainDir('modified_del_delos_records.md'), md, 'utf-8');

  console.log(`\nModified ${modifiedRecords.length} records. Artifact created at modified_del_delos_records.md`);
}

run();
