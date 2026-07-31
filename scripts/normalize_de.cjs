const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "database", "db.json");

function run() {
  const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  let modifiedRecords = [];

  for (const emp of db.employees) {
    if (!emp.FirstName) continue;

    // Rule 2: DO NOT make any changes if "De" appears in the Last Name field.
    if (emp.LastName && /\bde\b/i.test(emp.LastName)) {
      continue;
    }

    // Only match standalone "De" (case-insensitive) to avoid matching "Dennis", "Denmark", etc.
    if (/\bde\b/i.test(emp.FirstName)) {
      const oldFirst = emp.FirstName;
      const oldMI = emp.MiddleInitial || '';

      // Replace "De" and any trailing spaces to avoid double spaces. 
      // Also handles "De" at the end of the string.
      // Using a regex that optionally matches spaces around it so we don't leave double spaces.
      emp.FirstName = emp.FirstName.replace(/\bde\b\s*/ig, '').trim();
      // Clean up any double spaces that might have been formed if it was in the middle
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
  
  let md = '# Modified "De" Records\n\n';
  md += '| ID | Last Name | Old First Name | New First Name | Old MI | New MI |\n';
  md += '|---|---|---|---|---|---|\n';
  
  modifiedRecords.forEach(m => {
    md += `| ${m.EmployeeID} | ${m.LastName} | ${m.OldFirstName} | ${m.NewFirstName} | ${m.OldMI} | ${m.NewMI} |\n`;
    console.log(`- ID: ${m.EmployeeID} | Last: ${m.LastName} | First: ${m.OldFirstName} -> ${m.NewFirstName} | MI: ${m.OldMI} -> ${m.NewMI}`);
  });

  const brainDir = p => path.join(__dirname, '..', 'brain', 'ece6a480-36bd-4a52-9901-10b1b1ac4b60', p);
  fs.writeFileSync(brainDir('modified_de_records.md'), md, 'utf-8');

  console.log(`\nModified ${modifiedRecords.length} records. Artifact created at modified_de_records.md`);
}

run();
