export type UserRole = "Encoder" | "Administrator" | "System developer";

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  profilePic?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface Employee {
  EmployeeID: number;
  FirstName: string;
  MiddleInitial?: string;
  LastName: string;
  Office: string;
  Position: string;
  EmploymentType?: string;
  EmploymentStatus?: string;
  StatusChangedAt?: string;
  CreatedAt: string;
  UpdatedAt: string;
  CreatedBy: string;
  UpdatedBy: string;
  needsCount?: number;
  Gender?: string;
  DateOfAssumption?: string;
  NewlyHired?: string;
  isActive?: boolean;
}

export interface LearningNeed {
  LearningNeedID?: number;
  EmployeeID?: number;
  LearningNeed: string;
  Basis: string[];
  Methodology: string[];
  TargetSchedule: string;
  CreatedAt?: string;
  UpdatedAt?: string;
  CreatedBy?: string;
  UpdatedBy?: string;
}

export interface EmployeeWithNeeds extends Employee {
  needs: LearningNeed[];
}

export interface DashboardStats {
  totalEmployees: number;
  totalLearningNeeds: number;
  addedToday: number;
  upcomingSchedules: number;
  alertEmployees?: Array<{
    id: number;
    name: string;
    office: string;
    status: string;
    message: string;
  }>;
}

export interface Seminar {
  id: string;
  title: string;
  year: number;
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  date?: string;
  location?: string;
  speaker?: string;
  remarks?: string;
  createdAt: string;
  attendees?: Array<{
    id: string;
    EmployeeID: number;
    FirstName: string;
    MiddleInitial?: string;
    LastName: string;
    Office: string;
    Position: string;
  }>;
}

export interface SeminarAttendee {
  id: string;
  seminarId: string;
  employeeId: number;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  module: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  description: string | null;
  before_data: any;
  after_data: any;
  performed_by: string;
  created_at: string;
}
