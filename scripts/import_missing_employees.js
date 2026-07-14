const fs = require('fs');
const path = require('path');
const dbPath = path.join(process.cwd(), 'database', 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result.map(v => v.replace(/^"|"$/g, '').trim());
}

function norm(v) {
  return (v || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '');
}

function identity(first, last, office) {
  return norm(first) + '|' + norm(last) + '|' + norm(office);
}

if (!db.employees) db.employees = [];
if (!db.learningNeeds) db.learningNeeds = [];

const existingIdentities = new Map(db.employees.map(e => [identity(e.FirstName, e.LastName, e.Office), e]));
let nextId = Math.max(0, ...db.employees.map(e => e.EmployeeID)) + 1;
const lines = fs.readFileSync('c:/Users/AMD/Documents/employee_database1.csv', 'utf8').split(/\r?\n/);
const seen = new Set();
let imported = 0;
let learningNeedsImported = 0;

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const fields = parseCSVLine(line);
  if (fields.length < 10) continue;

  const firstName = fields[1];
  const middleInitial = fields[2];
  const lastName = fields[3];
  const office = fields[4];
  const position = fields[5];
  const learningNeed = fields[6];
  const basis = fields[7];
  const methodology = fields[8];
  const targetSchedule = fields[9];
  const key = identity(firstName, lastName, office);

  if (seen.has(key)) continue;
  seen.add(key);

  if (!existingIdentities.has(key)) {
    const employee = {
      EmployeeID: nextId++,
      FirstName: firstName,
      MiddleInitial: middleInitial,
      LastName: lastName,
      Office: office,
      Position: position,
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
      CreatedBy: 'system',
      UpdatedBy: 'system'
    };
    db.employees.push(employee);
    existingIdentities.set(key, employee);
    imported++;
  }

  const emp = existingIdentities.get(key);
  const existingLearningKeys = new Set(db.learningNeeds.map(ln => `${ln.EmployeeID}:${(ln.LearningNeed || '').toLowerCase().trim()}`));
  const lnKey = `${emp.EmployeeID}:${learningNeed.toLowerCase().trim()}`;
  if (!existingLearningKeys.has(lnKey)) {
    db.learningNeeds.push({
      LearningNeedID: db.learningNeeds.length + learningNeedsImported + 1,
      EmployeeID: emp.EmployeeID,
      LearningNeed: learningNeed,
      Basis: basis,
      Methodology: methodology,
      TargetSchedule: targetSchedule,
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
      CreatedBy: 'system',
      UpdatedBy: 'system'
    });
    learningNeedsImported++;
  }
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log(JSON.stringify({ importedEmployees: imported, importedLearningNeeds: learningNeedsImported }, null, 2));
