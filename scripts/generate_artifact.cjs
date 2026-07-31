const fs = require('fs');
const { execSync } = require('child_process');

try {
  const diff = execSync('git diff database/db.json', { maxBuffer: 1024 * 1024 * 100 }).toString();
  const lines = diff.split('\n');

  let currentId = null;
  let mods = [];
  let curFirst = null;
  let oldFirst = null;
  let curMI = null;
  let oldMI = null;
  let curLast = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('"EmployeeID"')) {
      const match = line.match(/\d+/);
      if (match) currentId = match[0];
    }
    
    if (line.startsWith('-') && line.includes('"FirstName"')) {
      oldFirst = line.split('"')[3];
    }
    if (line.startsWith('+') && line.includes('"FirstName"')) {
      curFirst = line.split('"')[3];
    }
    
    if (line.startsWith('-') && line.includes('"MiddleInitial"')) {
      oldMI = line.split('"')[3];
    }
    if (line.startsWith('+') && line.includes('"MiddleInitial"')) {
      curMI = line.split('"')[3];
    }
    
    if (line.includes('"LastName"')) {
      curLast = line.split('"')[3];
    }
    
    if (line.startsWith('+') && line.includes('"isActive"')) {
      if (oldFirst && curFirst) {
        mods.push({ id: currentId, last: curLast, oldF: oldFirst, newF: curFirst, oldMI, newMI: curMI });
      }
      oldFirst = null;
      curFirst = null;
      oldMI = null;
      curMI = null;
    }
  }

  // Filter ONLY the ones modified by the "Dela" script
  mods = mods.filter(m => /\bdela\b/i.test(m.oldF) && !/\bdela\b/i.test(m.newF) && m.newMI === 'D');

  let md = '# Modified "Dela" Records\n\n';
  md += '| ID | Last Name | Old First Name | New First Name | Old MI | New MI |\n';
  md += '|---|---|---|---|---|---|\n';
  
  mods.forEach(m => {
    md += `| ${m.id} | ${m.last} | ${m.oldF} | ${m.newF} | ${m.oldMI || ''} | ${m.newMI || ''} |\n`;
  });

  const brainDir = path => require('path').join(__dirname, '..', 'brain', 'ece6a480-36bd-4a52-9901-10b1b1ac4b60', path);
  fs.writeFileSync(brainDir('modified_dela_records.md'), md, 'utf-8');
  console.log(`Wrote ${mods.length} records to artifact.`);
} catch (e) {
  console.error(e);
}
