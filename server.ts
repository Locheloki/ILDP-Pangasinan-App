import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import ExcelJS from "exceljs";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "database", "db.json");

// Middleware
app.use(express.json());

// Helper functions for DB reading & writing
function readDatabase() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return { 
        users: [], 
        employees: [], 
        learningNeeds: [], 
        customOptions: { 
          basis: [], 
          methodology: [],
          office: [],
          position: [],
          learningNeed: [],
          schedule: []
        } 
      };
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    const db = JSON.parse(data);
    if (!db.customOptions) {
      db.customOptions = { basis: [], methodology: [], office: [], position: [], learningNeed: [], schedule: [] };
    } else {
      // Ensure all required keys exist
      ["basis", "methodology", "office", "position", "learningNeed", "schedule"].forEach(key => {
        if (!db.customOptions[key as keyof typeof db.customOptions]) {
          db.customOptions[key as keyof typeof db.customOptions] = [];
        }
      });
    }
    return db;
  } catch (error) {
    console.error("Error reading database:", error);
    return { 
      users: [], 
      employees: [], 
      learningNeeds: [], 
      customOptions: { 
        basis: [], 
        methodology: [],
        office: [],
        position: [],
        learningNeed: [],
        schedule: []
      } 
    };
  }
}

function writeDatabase(data: any) {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing database:", error);
  }
}

// Check for similarity helper
function findSimilarEmployees(firstName: string, lastName: string, db: any) {
  const normFirst = firstName.trim().toLowerCase();
  const normLast = lastName.trim().toLowerCase();

  return db.employees.filter((emp: any) => {
    const dbFirst = emp.FirstName.trim().toLowerCase();
    const dbLast = emp.LastName.trim().toLowerCase();

    // Check if either last name matches exactly and first name is very similar (or vice versa)
    return (
      (dbLast === normLast && dbFirst.includes(normFirst)) ||
      (dbFirst === normFirst && dbLast.includes(normLast)) ||
      (dbFirst.includes(normFirst) && dbLast.includes(normLast))
    );
  });
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// API routes go here FIRST

// API routes go here FIRST

// Custom Options Management
const VALID_TYPES = ["basis", "methodology", "office", "position", "learningNeed", "schedule"];

app.get("/api/options/:type", (req, res) => {
  const { type } = req.params;
  if (!VALID_TYPES.includes(type)) return res.status(400).json({ message: "Invalid type" });
  const db = readDatabase();
  return res.json(db.customOptions[type as keyof typeof db.customOptions]);
});

app.post("/api/options/:type", (req, res) => {
  const { type } = req.params;
  const { value } = req.body;
  if (!VALID_TYPES.includes(type)) return res.status(400).json({ message: "Invalid type" });
  if (!value) return res.status(400).json({ message: "Value required" });

  const db = readDatabase();
  const normalizedValue = value.trim();
  const exists = db.customOptions[type as keyof typeof db.customOptions].some((v: string) => v.toLowerCase() === normalizedValue.toLowerCase());
  
  if (exists) return res.status(400).json({ message: "Duplicate entry" });

  db.customOptions[type as keyof typeof db.customOptions].push(normalizedValue);
  writeDatabase(db);
  return res.status(201).json({ value: normalizedValue });
});

app.delete("/api/options/:type/:value", (req, res) => {
  const { type, value } = req.params;
  if (!VALID_TYPES.includes(type)) return res.status(400).json({ message: "Invalid type" });

  const db = readDatabase();
  db.customOptions[type as keyof typeof db.customOptions] = db.customOptions[type as keyof typeof db.customOptions].filter((v: string) => v.toLowerCase() !== value.toLowerCase());
  writeDatabase(db);
  return res.json({ message: "Deleted" });
});

// 1. Auth Endpoint
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  const db = readDatabase();
  const user = db.users.find(
    (u: any) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  // Return user info (role: Encoder / Administrator)
  return res.json({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  });
});

// 2. Get Dashboard Stats
app.get("/api/dashboard/stats", (req, res) => {
  const db = readDatabase();
  const totalEmployees = db.employees.length;
  const totalLearningNeeds = db.learningNeeds.length;

  // Added today calculations
  const todayStr = new Date().toISOString().split("T")[0];
  const addedToday = db.learningNeeds.filter((ln: any) => {
    return ln.CreatedAt && ln.CreatedAt.startsWith(todayStr);
  }).length;

  // Upcoming Training Schedules estimation (e.g., target schedules starting in 2026/2027/2028 or Immediate)
  const upcomingSchedules = db.learningNeeds.filter((ln: any) => {
    const sched = ln.TargetSchedule || "";
    return (
      sched.includes("2026") ||
      sched.includes("2027") ||
      sched.includes("2028") ||
      sched.toLowerCase().includes("immediately")
    );
  }).length;

  return res.json({
    totalEmployees,
    totalLearningNeeds,
    addedToday,
    upcomingSchedules,
  });
});

// 3. Search Similar Employees
app.post("/api/employees/check-similar", (req, res) => {
  const { firstName, lastName } = req.body;
  if (!firstName || !lastName) {
    return res.json({ similar: [] });
  }

  const db = readDatabase();
  const similar = findSimilarEmployees(firstName, lastName, db);
  return res.json({ similar });
});

// 4. Get All Employees with filter & search
app.get("/api/employees", (req, res) => {
  const db = readDatabase();
  const { search = "", office = "" } = req.query;

  let results = [...db.employees];

  if (search) {
    const q = (search as string).toLowerCase();
    results = results.filter((emp) =>
      `${emp.FirstName} ${emp.MiddleInitial || ""} ${emp.LastName}`.toLowerCase().includes(q)
    );
  }

  if (office) {
    const o = (office as string).toLowerCase();
    results = results.filter((emp) => emp.Office && emp.Office.toLowerCase().includes(o));
  }

  // Map employee with learning need count
  const resultsWithCount = results.map((emp) => {
    const needs = db.learningNeeds.filter((ln: any) => ln.EmployeeID === emp.EmployeeID);
    return {
      ...emp,
      needsCount: needs.length,
    };
  });

  return res.json(resultsWithCount);
});

// 5. Get Single Employee and their learning needs
app.get("/api/employees/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const db = readDatabase();
  const employee = db.employees.find((emp: any) => emp.EmployeeID === id);

  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }

  const needs = db.learningNeeds.filter((ln: any) => ln.EmployeeID === id);
  return res.json({
    ...employee,
    needs,
  });
});

// 6. Create New Employee
app.post("/api/employees", (req, res) => {
  const { firstName, middleInitial, lastName, office, position, username = "system" } = req.body;

  if (!firstName || !lastName || !office || !position) {
    return res.status(400).json({ message: "First name, last name, office, and position are required" });
  }

  const db = readDatabase();

  // Clean data
  const cleanFirst = firstName.trim();
  const cleanMiddle = (middleInitial || "").trim();
  const cleanLast = lastName.trim();
  const cleanOffice = office.trim();
  const cleanPosition = position.trim();

  // Create employee ID
  const maxId = db.employees.reduce((max: number, emp: any) => (emp.EmployeeID > max ? emp.EmployeeID : max), 0);
  const newEmployee = {
    EmployeeID: maxId + 1,
    FirstName: cleanFirst,
    MiddleInitial: cleanMiddle,
    LastName: cleanLast,
    Office: cleanOffice,
    Position: cleanPosition,
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
    CreatedBy: username,
    UpdatedBy: username,
  };

  db.employees.push(newEmployee);
  writeDatabase(db);

  return res.status(201).json(newEmployee);
});

// 7. Update Employee and Learning Needs in one transaction (Sync)
app.put("/api/employees/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { firstName, middleInitial, lastName, office, position, needs = [], username = "system" } = req.body;

  if (!firstName || !lastName || !office || !position) {
    return res.status(400).json({ message: "First name, last name, office, and position are required" });
  }

  const db = readDatabase();
  const employeeIndex = db.employees.findIndex((emp: any) => emp.EmployeeID === id);

  if (employeeIndex === -1) {
    return res.status(404).json({ message: "Employee not found" });
  }

  // Update employee info
  db.employees[employeeIndex] = {
    ...db.employees[employeeIndex],
    FirstName: firstName.trim(),
    MiddleInitial: (middleInitial || "").trim(),
    LastName: lastName.trim(),
    Office: office.trim(),
    Position: position.trim(),
    UpdatedAt: new Date().toISOString(),
    UpdatedBy: username,
  };

  // Sync learning needs
  // First, remove existing learning needs for this employee
  db.learningNeeds = db.learningNeeds.filter((ln: any) => ln.EmployeeID !== id);

  // Then, insert new learning needs
  let maxLNId = db.learningNeeds.reduce((max: number, ln: any) => (ln.LearningNeedID > max ? ln.LearningNeedID : max), 0);

  needs.forEach((need: any) => {
    maxLNId++;
    db.learningNeeds.push({
      LearningNeedID: maxLNId,
      EmployeeID: id,
      LearningNeed: need.LearningNeed.trim(),
      Basis: Array.isArray(need.Basis) ? need.Basis.filter(item => item && item.trim() !== "").join(", ").trim() : (need.Basis || "N/A").trim(),
      Methodology: Array.isArray(need.Methodology) ? need.Methodology.filter(item => item && item.trim() !== "").join(", ").trim() : (need.Methodology || "N/A").trim(),
      TargetSchedule: (need.TargetSchedule || "N/A").trim(),
      CreatedAt: need.CreatedAt || new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
      CreatedBy: need.CreatedBy || username,
      UpdatedBy: username,
    });
  });

  writeDatabase(db);
  return res.json({
    ...db.employees[employeeIndex],
    needs: db.learningNeeds.filter((ln: any) => ln.EmployeeID === id),
  });
});

// 8. Delete Employee (and cascade delete learning needs)
app.delete("/api/employees/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const db = readDatabase();

  const employeeExists = db.employees.some((emp: any) => emp.EmployeeID === id);
  if (!employeeExists) {
    return res.status(404).json({ message: "Employee not found" });
  }

  db.employees = db.employees.filter((emp: any) => emp.EmployeeID !== id);
  db.learningNeeds = db.learningNeeds.filter((ln: any) => ln.EmployeeID !== id);

  writeDatabase(db);
  return res.json({ message: "Employee and associated learning needs successfully deleted" });
});

// 9. Create/Add Learning Need for Employee
app.post("/api/employees/:id/learning-needs", (req, res) => {
  const employeeId = parseInt(req.params.id);
  const { learningNeed, basis, methodology, targetSchedule, username = "system" } = req.body;

  if (!learningNeed) {
    return res.status(400).json({ message: "Learning Need description is required" });
  }

  const db = readDatabase();
  const employeeExists = db.employees.some((emp: any) => emp.EmployeeID === employeeId);
  if (!employeeExists) {
    return res.status(404).json({ message: "Employee not found" });
  }

  const maxId = db.learningNeeds.reduce((max: number, ln: any) => (ln.LearningNeedID > max ? ln.LearningNeedID : max), 0);
  const newNeed = {
    LearningNeedID: maxId + 1,
    EmployeeID: employeeId,
    LearningNeed: learningNeed.trim(),
    Basis: Array.isArray(basis) ? basis.filter(item => item && item.trim() !== "").join(", ").trim() : (basis || "N/A").trim(),
    Methodology: Array.isArray(methodology) ? methodology.filter(item => item && item.trim() !== "").join(", ").trim() : (methodology || "N/A").trim(),
    TargetSchedule: (targetSchedule || "N/A").trim(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
    CreatedBy: username,
    UpdatedBy: username,
  };

  db.learningNeeds.push(newNeed);
  writeDatabase(db);

  return res.status(201).json(newNeed);
});

// 10. Get All Learning Need Records in tabular format (joined with Employee details)
app.get("/api/learning-needs", (req, res) => {
  const db = readDatabase();
  const { search = "", office = "", learningNeed = "", sortBy = "LastName", sortOrder = "asc" } = req.query;

  let results: any[] = [];

  // Re-create the View: Join Employee + Learning Needs
  db.learningNeeds.forEach((ln: any) => {
    const emp = db.employees.find((e: any) => e.EmployeeID === ln.EmployeeID);
    if (emp) {
      results.push({
        LearningNeedID: ln.LearningNeedID,
        EmployeeID: emp.EmployeeID,
        FirstName: emp.FirstName,
        MiddleInitial: emp.MiddleInitial,
        LastName: emp.LastName,
        Office: emp.Office,
        Position: emp.Position,
        LearningNeed: ln.LearningNeed,
        Basis: ln.Basis,
        Methodology: ln.Methodology,
        TargetSchedule: ln.TargetSchedule,
        CreatedAt: ln.CreatedAt,
        UpdatedAt: ln.UpdatedAt,
        CreatedBy: ln.CreatedBy,
        UpdatedBy: ln.UpdatedBy,
      });
    }
  });

  // Apply searching/filtering
  if (search) {
    const q = (search as string).toLowerCase();
    results = results.filter(
      (item) =>
        `${item.FirstName} ${item.LastName}`.toLowerCase().includes(q) ||
        item.Position.toLowerCase().includes(q)
    );
  }

  if (office) {
    const o = (office as string).toLowerCase();
    results = results.filter((item) => item.Office && item.Office.toLowerCase().includes(o));
  }

  if (learningNeed) {
    const lnVal = (learningNeed as string).toLowerCase();
    results = results.filter((item) => item.LearningNeed.toLowerCase().includes(lnVal));
  }

  // Sorting
  results.sort((a, b) => {
    let valA = a[sortBy as string] || "";
    let valB = b[sortBy as string] || "";

    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  return res.json(results);
});

// 11. Delete a learning need
app.delete("/api/learning-needs/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const db = readDatabase();

  const lnIndex = db.learningNeeds.findIndex((ln: any) => ln.LearningNeedID === id);
  if (lnIndex === -1) {
    return res.status(404).json({ message: "Learning need not found" });
  }

  db.learningNeeds.splice(lnIndex, 1);
  writeDatabase(db);
  return res.json({ message: "Learning need deleted successfully" });
});

// 12. Excel Export using ExcelJS
app.get("/api/export/excel", async (req, res) => {
  const { employeeId, office, startDate, endDate } = req.query;
  const db = readDatabase();

  let results: any[] = [];

  // Fetch flat joined data
  db.learningNeeds.forEach((ln: any) => {
    const emp = db.employees.find((e: any) => e.EmployeeID === ln.EmployeeID);
    if (emp) {
      results.push({
        EmployeeID: emp.EmployeeID,
        FirstName: emp.FirstName,
        MiddleInitial: emp.MiddleInitial,
        LastName: emp.LastName,
        Office: emp.Office,
        Position: emp.Position,
        LearningNeed: ln.LearningNeed,
        Basis: ln.Basis,
        Methodology: ln.Methodology,
        TargetSchedule: ln.TargetSchedule,
        CreatedAt: ln.CreatedAt,
      });
    }
  });

  // Filter based on parameters
  if (employeeId) {
    const empId = parseInt(employeeId as string);
    results = results.filter((item) => item.EmployeeID === empId);
  }

  if (office) {
    const o = (office as string).toLowerCase();
    results = results.filter((item) => item.Office && item.Office.toLowerCase().includes(o));
  }

  if (startDate) {
    const sDate = new Date(startDate as string);
    results = results.filter((item) => new Date(item.CreatedAt) >= sDate);
  }

  if (endDate) {
    const eDate = new Date(endDate as string);
    // Include the whole day of end date
    eDate.setHours(23, 59, 59, 999);
    results = results.filter((item) => new Date(item.CreatedAt) <= eDate);
  }

  // Create Excel workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Learning Needs Summary");

  // Title Row
  worksheet.mergeCells("A1", "H1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = "INDIVIDUAL LEARNING AND DEVELOPMENT PLAN (ILDP) LEARNING NEEDS SUMMARY";
  titleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E3A8A" }, // Navy blue brand color
  };
  worksheet.getRow(1).height = 40;

  // Subtitle / Meta Row
  worksheet.mergeCells("A2", "H2");
  const subCell = worksheet.getCell("A2");
  subCell.value = `Exported on: ${new Date().toLocaleDateString()} | Total Records: ${results.length}`;
  subCell.font = { name: "Arial", size: 10, italic: true };
  subCell.alignment = { horizontal: "center" };
  worksheet.getRow(2).height = 20;

  worksheet.addRow([]); // Blank spacer

  // Table Headers
  const headerRow = worksheet.addRow([
    "ID",
    "Employee Name",
    "Office/Department",
    "Position",
    "Learning Need / Competency",
    "Basis of L&D Needs",
    "Proposed Action / Methodology",
    "Target Schedule",
  ]);

  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF3B82F6" }, // Accent Blue
    };
    cell.alignment = { horizontal: "left", vertical: "middle" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "medium" },
      right: { style: "thin" },
    };
  });

  // Data rows
  results.forEach((item, index) => {
    const fullName = `${item.LastName}, ${item.FirstName} ${item.MiddleInitial || ""}`.trim();
    const row = worksheet.addRow([
      index + 1,
      fullName,
      item.Office,
      item.Position,
      item.LearningNeed,
      item.Basis,
      item.Methodology,
      item.TargetSchedule,
    ]);

    row.height = 20;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: "Arial", size: 10 };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
      cell.alignment = {
        horizontal: colNumber === 1 ? "center" : "left",
        vertical: "middle",
        wrapText: true,
      };
      // Zebra striping
      if (index % 2 === 1) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8FAFC" }, // very light slate
        };
      }
    });
  });

  // Adjust Column Widths
  worksheet.columns.forEach((column, i) => {
    let maxLength = 0;
    column.eachCell!({ includeEmpty: false }, (cell) => {
      const value = cell.value ? cell.value.toString() : "";
      if (value.length > maxLength && cell.address !== "A1" && cell.address !== "A2") {
        maxLength = value.length;
      }
    });
    // Set customized widths with standard boundaries
    if (i === 0) column.width = 6; // ID
    else if (i === 1) column.width = 25; // Name
    else if (i === 2) column.width = 30; // Office
    else if (i === 3) column.width = 25; // Position
    else if (i === 4) column.width = 40; // Learning Need
    else if (i === 5) column.width = 25; // Basis
    else if (i === 6) column.width = 25; // Methodology
    else if (i === 7) column.width = 20; // Schedule
  });

  // Set response headers and send Excel file
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=ILDP_Learning_Needs_Summary.xlsx"
  );

  await workbook.xlsx.write(res);
  res.end();
});

// ----------------------------------------------------
// VITE CLIENT DEV SERVER INTEGRATION
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
