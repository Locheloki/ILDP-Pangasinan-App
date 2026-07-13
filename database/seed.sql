-- ILDP Learning Needs Summary System
-- Seed Data for Microsoft SQL Server Express
-- Prepared by AI Studio Coding Agent

-- Insert Employees
SET IDENTITY_INSERT Employees ON;

INSERT INTO Employees (EmployeeID, FirstName, MiddleInitial, LastName, Office, Position, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy) VALUES
(1, 'Vivian Lyn', 'E.', 'De Guzman', 'Mapandan Community Hospital', 'Medical Technologist', GETDATE(), GETDATE(), 'system', 'system'),
(2, 'Jeffrey', 'C.', 'Jimenez', 'Manaoag Community Hospital', 'Nurse', GETDATE(), GETDATE(), 'system', 'system'),
(3, 'Leihani', 'S.', 'Dela Cruz', 'Lingayen District Hospital', 'Nurse', GETDATE(), GETDATE(), 'system', 'system'),
(4, 'William', 'R.', 'Delos Reyes', 'Provincial Engineering Office', 'HEO I', GETDATE(), GETDATE(), 'system', 'system'),
(5, 'Edmundo', 'S.', 'De Guzman', 'Provincial Engineering Office', 'Forklift Operator', GETDATE(), GETDATE(), 'system', 'system'),
(6, 'Roberto', 'G.', 'Danganan', 'Provincial Engineering Office', 'Utility Worker', GETDATE(), GETDATE(), 'system', 'system'),
(7, 'James', 'NULL', 'Suarez', 'Provincial Engineering Office', 'Administrative Aide', GETDATE(), GETDATE(), 'system', 'system'),
(8, 'Araceli', 'I.', 'Cacatian', 'Pangasinan Polytechnic College', 'Administrative III', GETDATE(), GETDATE(), 'system', 'system'),
(9, 'Filemon', 'C.', 'Cabunay, Jr.', 'Pangasinan Polytechnic College', 'Administrative Aide (Driver)', GETDATE(), GETDATE(), 'system', 'system'),
(10, 'Rebecca Joy', 'C.', 'Solis', 'Pangasinan Polytechnic College', 'Administrative Aide (Administrative Staff)', GETDATE(), GETDATE(), 'system', 'system'),
(11, 'Francis Henry', 'M.', 'Dudang', 'Mapandan Community Hospital', 'PhilHealth E-Konsulta Clerk', GETDATE(), GETDATE(), 'system', 'system'),
(12, 'Ofelia', 'NULL', 'Casaclang Aquino', 'Mapandan Community Hospital', 'Supply Officer', GETDATE(), GETDATE(), 'system', 'system'),
(13, 'John Paul', 'NULL', 'De Vera Agas', 'Mapandan Community Hospital', 'Social Worker Officer', GETDATE(), GETDATE(), 'system', 'system'),
(14, 'Orpha', 'N.', 'Deuna', 'Mapandan Community Hospital', 'Pharmacist I', GETDATE(), GETDATE(), 'system', 'system'),
(15, 'Enrique', 'B.', 'Gamboa', 'Mapandan Community Hospital', 'Utility Worker', GETDATE(), GETDATE(), 'system', 'system'),
(16, 'Agnes', 'I.', 'Diaz', 'Mapandan Community Hospital', 'Midwife', GETDATE(), GETDATE(), 'system', 'system');

SET IDENTITY_INSERT Employees OFF;

-- Insert Learning Needs
SET IDENTITY_INSERT LearningNeeds ON;

INSERT INTO LearningNeeds (LearningNeedID, EmployeeID, LearningNeed, Basis, Methodology, TargetSchedule, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy) VALUES
-- Vivian Lyn (EmployeeID 1)
(1, 1, 'Direct Sputum Smear Microscopy (DSSM)', 'Licensing Requirement', 'Seminar/Training', '1st Quarter of 2024', GETDATE(), GETDATE(), 'system', 'system'),
(2, 1, 'Basic Blood Banking Procedures', 'Licensing Requirement', 'Seminar/Training', '2nd Quarter of 2024', GETDATE(), GETDATE(), 'system', 'system'),
(3, 1, 'Drug Testing Training', 'Licensing Requirement', 'Seminar/Training', '2nd Quarter of 2024', GETDATE(), GETDATE(), 'system', 'system'),
(4, 1, 'Total Quality Management for Blood Services Facilities', 'Licensing Requirement', 'Seminar/Training', '4th Quarter of 2024', GETDATE(), GETDATE(), 'system', 'system'),
(5, 1, 'Lactation Management', 'Advance Knowledge', 'Seminar/Training', '2nd Quarter of 2025', GETDATE(), GETDATE(), 'system', 'system'),
(6, 1, 'Infection Prevention and Control', 'Advance Knowledge', 'Seminar/Training', '2nd Quarter of 2025', GETDATE(), GETDATE(), 'system', 'system'),

-- Jeffrey C. Jimenez (EmployeeID 2)
(7, 2, 'Vital Signs Taking', 'Advance Knowledge', 'Seminar/Training', '1st Quarter of 2024', GETDATE(), GETDATE(), 'system', 'system'),
(8, 2, 'Carrying out Doctor''s Order', 'Advance Knowledge', 'Seminar/Training', '2nd Quarter of 2024', GETDATE(), GETDATE(), 'system', 'system'),
(9, 2, 'Providing Nursing Care to Patients', 'Advance Knowledge', 'Seminar/Training', '3rd Quarter of 2024', GETDATE(), GETDATE(), 'system', 'system'),
(10, 2, 'Operating Equipment', 'Advance Knowledge', 'Seminar/Training', '4th Quarter of 2024', GETDATE(), GETDATE(), 'system', 'system'),
(11, 2, 'Assisting Physicians with Diagnostic and Therapeutic Procedures', 'Advance Knowledge', 'Seminar/Training', '4th Quarter of 2024', GETDATE(), GETDATE(), 'system', 'system'),

-- Leihani S. Dela Cruz (EmployeeID 3)
(12, 3, 'Vital Signs Taking', 'Advance Knowledge', 'Seminar/Training', '1st Quarter of 2024', GETDATE(), GETDATE(), 'system', 'system'),
(13, 3, 'Carrying out Doctor''s Order', 'Advance Knowledge', 'Seminar/Training', '2nd Quarter of 2024', GETDATE(), GETDATE(), 'system', 'system'),
(14, 3, 'Providing Nursing Care to Patients', 'Advance Knowledge', 'Seminar/Training', '3rd Quarter of 2024', GETDATE(), GETDATE(), 'system', 'system'),
(15, 3, 'Operating Equipment', 'Advance Knowledge', 'Seminar/Training', '4th Quarter of 2024', GETDATE(), GETDATE(), 'system', 'system'),
(16, 3, 'Assisting Physicians with Diagnostic and Therapeutic Procedures', 'Advance Knowledge', 'Seminar/Training', '4th Quarter of 2024', GETDATE(), GETDATE(), 'system', 'system'),

-- William R. Delos Reyes (EmployeeID 4)
(17, 4, 'Knowledge of the Operation of Different types of equipment and its routine maintenance requirements', 'Competency Gap', 'Seminar/Training', '2nd Quarter of 2024', GETDATE(), GETDATE(), 'system', 'system'),
(18, 4, 'Knowledge on Traffic Rules and Regulations', 'Competency Improvement', 'Seminar/Training', '1st Quarter of 2026', GETDATE(), GETDATE(), 'system', 'system'),
(19, 4, 'Ability to Perform Pre-Post Equipment Operation', 'Competency Improvement', 'Seminar/Training', '1st Quarter of 2027', GETDATE(), GETDATE(), 'system', 'system'),

-- Edmundo S. De Guzman (EmployeeID 5)
(20, 5, 'Knowledge of the Operation of Different types of equipment and its routine maintenance requirements', 'Competency Gap', 'Seminar/Training', '2nd Quarter of 2024', GETDATE(), GETDATE(), 'system', 'system'),
(21, 5, 'Knowledge on Traffic Rules and Regulations', 'Competency Improvement', 'Seminar/Training', '1st Quarter of 2025', GETDATE(), GETDATE(), 'system', 'system'),
(22, 5, 'Ability to Perform Pre-Post Equipment Operation', 'Competency Improvement', 'Seminar/Training', '1st Quarter of 2027', GETDATE(), GETDATE(), 'system', 'system'),

-- Roberto G. Danganan (EmployeeID 6)
(23, 6, 'Knowledge on Basic Safety Guidelines', 'Advance Knowledge', 'Seminar/Training', '1st Quarter of 2025', GETDATE(), GETDATE(), 'system', 'system'),
(24, 6, 'Ability in Operating Cleaning Equipment and Tools', 'Advance Knowledge', 'Seminar/Training', '1st Quarter of 2026', GETDATE(), GETDATE(), 'system', 'system'),
(25, 6, 'Customer Service Orientation', 'Advance Knowledge', 'Seminar/Training', '1st Quarter of 2027', GETDATE(), GETDATE(), 'system', 'system'),
(26, 6, 'Effective Written & Verbal Communication Skills', 'Advance Knowledge', 'Seminar/Training', '2nd Quarter of 2024', GETDATE(), GETDATE(), 'system', 'system'),

-- James Suarez (EmployeeID 7)
(27, 7, 'Records & Archives Management', 'Requirement of the position', 'Coaching & Mentoring', '3rd Quarter of 2025', GETDATE(), GETDATE(), 'system', 'system'),
(28, 7, 'Property, Supplies, and Equipment Procurement Management', 'Competency Gap', 'Coaching & Mentoring', '4th Quarter of 2024', GETDATE(), GETDATE(), 'system', 'system'),
(29, 7, 'Financial Services (Budget, Accounting, Cashier Functions)', 'Requirement of the position', 'Coaching & Mentoring', '2nd Quarter of 2024', GETDATE(), GETDATE(), 'system', 'system'),
(30, 7, 'Enhanced Computer Operations Skills', 'Requirement of the position', 'Coaching & Mentoring', '1st Quarter of 2026', GETDATE(), GETDATE(), 'system', 'system'),

-- Araceli I. Cacatian (EmployeeID 8)
(31, 8, 'People Management Skills', 'Requirement of the position', 'Coaching & Mentoring', '3rd Quarter of 2024', GETDATE(), GETDATE(), 'system', 'system'),
(32, 8, 'Enhanced Computer Operations Skills', 'Requirement of the position', 'Coaching & Mentoring', '1st Quarter of 2026', GETDATE(), GETDATE(), 'system', 'system'),
(33, 8, 'Effective Written & Verbal Communication Skills', 'Requirement of the position', 'Seminar/Training', '1st Quarter of 2025', GETDATE(), GETDATE(), 'system', 'system'),
(34, 8, 'Display of Province Core Values', 'Requirement of the position', 'Values Restoration Drive', '4th Quarter of 2024', GETDATE(), GETDATE(), 'system', 'system'),

-- Filemon C. Cabunay, Jr. (EmployeeID 9)
(35, 9, 'Essential Driving and Vehicle Maintenance Skills', 'Requirement of the position', 'Coaching & Mentoring', '3rd Quarter of 2024', GETDATE(), GETDATE(), 'system', 'system'),
(36, 9, 'General Maintenance & Repair Skills', 'Requirement of the position', 'Coaching & Mentoring', '3rd Quarter of 2025', GETDATE(), GETDATE(), 'system', 'system'),
(37, 9, 'Enhanced Computer Operations Skills', 'Requirement of the position', 'Coaching & Mentoring', '1st Quarter of 2026', GETDATE(), GETDATE(), 'system', 'system'),

-- Rebecca Joy C. Solis (EmployeeID 10)
(38, 10, 'Liaising Skills', 'Requirement of the position', 'Coaching & Mentoring', '3rd Quarter of 2024', GETDATE(), GETDATE(), 'system', 'system'),
(39, 10, 'Enhanced Computer Operations Skills', 'Requirement of the position', 'Coaching & Mentoring', '1st Quarter of 2026', GETDATE(), GETDATE(), 'system', 'system'),
(40, 10, 'Enhanced Administrative Skills', 'Requirement of the position', 'Coaching & Mentoring', '3rd Quarter of 2026', GETDATE(), GETDATE(), 'system', 'system'),
(41, 10, 'Effective Written & Verbal Communication Skills', 'Requirement of the position', 'Seminar/Training', '1st Quarter of 2025', GETDATE(), GETDATE(), 'system', 'system'),

-- Francis Henry M. Dudang (EmployeeID 11)
(42, 11, 'Liaising Communications and Official Documents', 'Competency Gap', 'Seminar/Training', '4th Quarter of 2025', GETDATE(), GETDATE(), 'system', 'system'),
(43, 11, 'Managing Client Request', 'Competency Gap', 'Seminar/Training', '3rd Quarter of 2025', GETDATE(), GETDATE(), 'system', 'system'),

-- Ofelia Casaclang Aquino (EmployeeID 12)
(44, 12, 'Supply officer Planning', 'Competency Gap', 'Seminar/Training', '4th Quarter of 2025', GETDATE(), GETDATE(), 'system', 'system'),
(45, 12, 'Waste Management', 'Competency Gap', 'Seminar/Training', '3rd Quarter of 2025', GETDATE(), GETDATE(), 'system', 'system'),

-- John Paul De Vera Agas (EmployeeID 13)
(46, 13, 'Social Work Case Management', 'Advance Knowledge', 'Seminar/Training', '2nd Quarter of 2025', GETDATE(), GETDATE(), 'system', 'system'),
(47, 13, 'Lactation Management', 'Competency Gap', 'Refresher Training', '3rd Quarter of 2025', GETDATE(), GETDATE(), 'system', 'system'),

-- Orpha N. Deuna (EmployeeID 14)
(48, 14, 'Knowledge on drugs, medicines and medical supplies', 'Advance Knowledge', 'Webinar', '4th Quarter of 2025', GETDATE(), GETDATE(), 'system', 'system'),
(49, 14, 'Pharmacy Planning', 'Advance Knowledge', 'Seminar/Training', '4th Quarter of 2025', GETDATE(), GETDATE(), 'system', 'system'),

-- Enrique B. Gamboa (EmployeeID 15)
(50, 15, 'General Maintenance & Repair Skills', 'Requirement of the position', 'Coaching & Mentoring', '3rd Quarter of 2025', GETDATE(), GETDATE(), 'system', 'system'),

-- Agnes I. Diaz (EmployeeID 16)
(51, 16, 'Lactation Management', 'Update/Learning Requirement', 'Refresher Training', '3rd Quarter of 2025', GETDATE(), GETDATE(), 'system', 'system');

SET IDENTITY_INSERT LearningNeeds OFF;
