import type { UserRole } from "./types";

export const PERMISSIONS = {
  EMPLOYEE_VIEW: "employee:view",
  EMPLOYEE_CREATE: "employee:create",
  EMPLOYEE_EDIT: "employee:edit",
  EMPLOYEE_DELETE: "employee:delete",
  SEMINAR_VIEW: "seminar:view",
  SEMINAR_CREATE: "seminar:create",
  SEMINAR_EDIT: "seminar:edit",
  SEMINAR_DELETE: "seminar:delete",
  SEMINAR_IMPORT: "seminar:import",
  SEMINAR_YEAR_DELETE: "seminar:year:delete",
  SEMINAR_ATTENDEE_DELETE: "seminar:attendee:delete",
  IMPORT_DATA: "import:data",
  AUDIT_LOG_VIEW: "audit:view",
  USER_MANAGE: "user:manage",
  USER_ASSIGN_ROLE: "user:assign_role",
  USER_DELETE: "user:delete",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ROLE_DEFAULTS: Record<string, Permission[]> = {
  Encoder: ["employee:view", "seminar:view", "seminar:create", "seminar:edit", "seminar:import"],
  Administrator: ["employee:view", "employee:create", "employee:edit", "employee:delete", "seminar:view", "seminar:create", "seminar:edit", "seminar:delete", "seminar:import", "seminar:year:delete", "seminar:attendee:delete"],
  "System developer": Object.values(PERMISSIONS),
};

export function can(
  role: string | undefined,
  permission: string,
): boolean {
  if (!role) return false;
  return ((ROLE_DEFAULTS[role] || []) as string[]).includes(permission);
}
