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

const allPermissions: Permission[] = Object.values(PERMISSIONS);

const ROLE_PERMISSION_MAP: Record<string, Permission[]> = {
  Encoder: allPermissions,
  Administrator: allPermissions,
  "System developer": allPermissions,
};

export function hasPermission(role: string | undefined, permission: Permission): boolean {
  if (!role) return false;
  const perms = ROLE_PERMISSION_MAP[role];
  if (!perms) return false;
  return perms.includes(permission);
}

export function can(
  role: string | undefined,
  permission: string,
  overridePerms?: string[]
): boolean {
  if (!role) return false;
  // Start with role defaults
  const basePerms = ROLE_PERMISSION_MAP[role];
  if (!basePerms) return false;

  let effectivePerms: string[] = basePerms;
  if (overridePerms && Array.isArray(overridePerms)) {
    effectivePerms = [...basePerms];
    for (const p of overridePerms) {
      if (p.startsWith("+") && !effectivePerms.includes(p.slice(1))) {
        effectivePerms.push(p.slice(1));
      } else if (p.startsWith("-")) {
        effectivePerms = effectivePerms.filter(e => e !== p.slice(1));
      }
    }
  }

  return effectivePerms.includes(permission);
}
