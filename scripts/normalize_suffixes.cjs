const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "database", "db.json");

function formatSuffix(s) {
  const clean = s.replace(/[^A-Za-z]/g, '').toLowerCase();
  switch(clean) {
    case 'jr': return 'Jr.';
    case 'sr': return 'Sr.';
    case 'ii': return 'II';
    case 'iii': return 'III';
    case 'iv': return 'IV';
    case 'v': return 'V';
    default: return s;
  }
}

const endRegex = /(?:,\s*|\s+)(jr\.?|sr\.?|ii|iii|iv|v)\.?$/i;
const startRegex = /^(jr\.?|sr\.?|ii|iii|iv|v)\.?(?:,\s*|\s+)/i;

function extractSuffix(nameStr) {
  if (!nameStr) return { cleanName: nameStr, suffix: null };
  
  // Try end match first
  let match = nameStr.match(endRegex);
  if (match) {
    const rawSuffix = match[1];
    let cleanName = nameStr.slice(0, match.index).trim();
    cleanName = cleanName.replace(/,+$/, '').trim();
    return { cleanName, suffix: formatSuffix(rawSuffix) };
  }

  // Try start match
  match = nameStr.match(startRegex);
  if (match) {
    const rawSuffix = match[1];
    let cleanName = nameStr.slice(match[0].length).trim();
    cleanName = cleanName.replace(/^,+/, '').trim();
    return { cleanName, suffix: formatSuffix(rawSuffix) };
  }

  return { cleanName: nameStr, suffix: null };
}

function run() {
  const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  let updatedCount = 0;

  for (const emp of db.employees) {
    if (emp.Suffix && emp.Suffix.trim() !== "") {
      continue;
    }

    let foundSuffix = null;

    if (emp.LastName) {
      const res = extractSuffix(emp.LastName);
      if (res.suffix) {
        emp.LastName = res.cleanName;
        foundSuffix = res.suffix;
      }
    }

    if (!foundSuffix && emp.FirstName) {
      const res = extractSuffix(emp.FirstName);
      if (res.suffix) {
        emp.FirstName = res.cleanName;
        foundSuffix = res.suffix;
      }
    }

    if (foundSuffix) {
      emp.Suffix = foundSuffix;
      updatedCount++;
    }
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  console.log(`Successfully extracted suffixes from ${updatedCount} records.`);
}

run();
