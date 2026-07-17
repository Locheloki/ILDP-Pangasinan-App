const fs = require("fs");
const path = require("path");

const dbPath = path.join(process.cwd(), "database", "db.json");
const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

const compact = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const key = (value) => compact(value).toLowerCase();
const isValidDate = (value) => value === null || value === undefined || value === "" || !Number.isNaN(new Date(value).getTime());

function duplicateCount(rows, field) {
  const seen = new Set();
  let count = 0;
  for (const row of rows || []) {
    const value = row[field];
    if (seen.has(value)) count++;
    seen.add(value);
  }
  return count;
}

function duplicateEmployeeRows(employees) {
  const seen = new Set();
  let count = 0;
  for (const emp of employees || []) {
    const rowKey = [
      key(emp.FirstName),
      key(emp.MiddleInitial),
      key(emp.LastName),
      key(emp.Office),
      key(emp.Position),
      key(emp.EmploymentType),
      key(emp.DateOfAssumption),
    ].join("|");
    if (seen.has(rowKey)) count++;
    seen.add(rowKey);
  }
  return count;
}

function duplicateLearningNeedRows(needs) {
  const seen = new Set();
  let count = 0;
  for (const need of needs || []) {
    const rowKey = [
      need.EmployeeID,
      key(need.LearningNeed),
      key(need.Basis),
      key(need.Methodology),
      key(need.TargetSchedule),
    ].join("|");
    if (seen.has(rowKey)) count++;
    seen.add(rowKey);
  }
  return count;
}

function duplicateOptions(options) {
  const result = {};
  for (const [type, list] of Object.entries(options || {})) {
    const seen = new Set();
    let count = 0;
    for (const item of Array.isArray(list) ? list : []) {
      const itemKey = key(item);
      if (seen.has(itemKey)) count++;
      seen.add(itemKey);
    }
    result[type] = count;
  }
  return result;
}

const employeeIds = new Set((db.employees || []).map((emp) => emp.EmployeeID));

const report = {
  users: (db.users || []).length,
  employees: (db.employees || []).length,
  learningNeeds: (db.learningNeeds || []).length,
  duplicateEmployeeIds: duplicateCount(db.employees, "EmployeeID"),
  duplicateLearningNeedIds: duplicateCount(db.learningNeeds, "LearningNeedID"),
  duplicateLogicalEmployees: duplicateEmployeeRows(db.employees),
  duplicateLogicalLearningNeeds: duplicateLearningNeedRows(db.learningNeeds),
  orphanLearningNeeds: (db.learningNeeds || []).filter((need) => !employeeIds.has(need.EmployeeID)).length,
  blankEmployeeRequiredFields: (db.employees || []).filter(
    (emp) => !emp.EmployeeID || !compact(emp.FirstName) || !compact(emp.LastName) || !compact(emp.Office) || !compact(emp.Position)
  ).length,
  blankLearningNeedRequiredFields: (db.learningNeeds || []).filter(
    (need) => !need.LearningNeedID || !need.EmployeeID || !compact(need.LearningNeed)
  ).length,
  invalidEmployeeDates: (db.employees || []).filter(
    (emp) => !isValidDate(emp.CreatedAt) || !isValidDate(emp.UpdatedAt) || !isValidDate(emp.StatusChangedAt) || !isValidDate(emp.DateOfAssumption)
  ).length,
  invalidLearningNeedDates: (db.learningNeeds || []).filter(
    (need) => !isValidDate(need.CreatedAt) || !isValidDate(need.UpdatedAt)
  ).length,
  duplicateCustomOptions: duplicateOptions(db.customOptions),
};

console.log(JSON.stringify(report, null, 2));
