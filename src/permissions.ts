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

const encoderPermissions: Permission[] = [
  PERMISSIONS.EMPLOYEE_VIEW,
  PERMISSIONS.EMPLOYEE_CREATE,
  PERMISSIONS.EMPLOYEE_EDIT,
  PERMISSIONS.SEMINAR_VIEW,
  PERMISSIONS.SEMINAR_CREATE,
  PERMISSIONS.SEMINAR_EDIT,
  PERMISSIONS.SEMINAR_IMPORT,
];

const administratorPermissions: Permission[] = [
  ...encoderPermissions,
  PERMISSIONS.EMPLOYEE_DELETE,
  PERMISSIONS.SEMINAR_DELETE,
  PERMISSIONS.SEMINAR_YEAR_DELETE,
  PERMISSIONS.SEMINAR_ATTENDEE_DELETE,
  PERMISSIONS.IMPORT_DATA,
];

const allPermissions: Permission[] = Object.values(PERMISSIONS);

const ROLE_PERMISSION_MAP: Record<string, Permission[]> = {
  Encoder: encoderPermissions,
  Administrator: administratorPermissions,
  "System developer": allPermissions,
};

export function hasPermission(role: string | undefined, permission: Permission): boolean {
  if (!role) return false;
  const perms = ROLE_PERMISSION_MAP[role];
  if (!perms) return false;
  return perms.includes(permission);
}

export function can(role: string | undefined, permission: string): boolean {
  return hasPermission(role, permission as Permission);
}
