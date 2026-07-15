export type UserRole = "Encoder" | "Administrator" | "System developer";

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
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
