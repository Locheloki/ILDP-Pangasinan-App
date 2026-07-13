-- ILDP Learning Needs Summary System
-- Database Schema for Microsoft SQL Server Express
-- Prepared by AI Studio Coding Agent

-- Create Employees Table
CREATE TABLE Employees (
    EmployeeID INT IDENTITY(1,1) PRIMARY KEY,
    FirstName NVARCHAR(100) NOT NULL,
    MiddleInitial NVARCHAR(10) NULL,
    LastName NVARCHAR(100) NOT NULL,
    Office NVARCHAR(150) NOT NULL,
    Position NVARCHAR(150) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CreatedBy NVARCHAR(100) NULL,
    UpdatedBy NVARCHAR(100) NULL
);

-- Create LearningNeeds Table
CREATE TABLE LearningNeeds (
    LearningNeedID INT IDENTITY(1,1) PRIMARY KEY,
    EmployeeID INT NOT NULL,
    LearningNeed NVARCHAR(250) NOT NULL,
    Basis NVARCHAR(250) NOT NULL DEFAULT 'N/A',
    Methodology NVARCHAR(250) NOT NULL DEFAULT 'N/A',
    TargetSchedule NVARCHAR(100) NOT NULL DEFAULT 'N/A',
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE(),
    CreatedBy NVARCHAR(100) NULL,
    UpdatedBy NVARCHAR(100) NULL,
    CONSTRAINT FK_LearningNeeds_Employees FOREIGN KEY (EmployeeID) 
        REFERENCES Employees(EmployeeID) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IX_Employees_Name ON Employees(LastName, FirstName);
CREATE INDEX IX_Employees_Office ON Employees(Office);
CREATE INDEX IX_LearningNeeds_Employee ON LearningNeeds(EmployeeID);
CREATE INDEX IX_LearningNeeds_Text ON LearningNeeds(LearningNeed);
