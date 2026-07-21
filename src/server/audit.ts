// ── Audit Action Registry ──────────────────────────────────────────────
// Central registry so new modules can register actions without touching this file.

export interface AuditEntry {
  module: string;
  action: string;
  entity_type: string;
  entity_id?: string | number;
  entity_name?: string;
  description?: string;
  before_data?: any;
  after_data?: any;
  performed_by?: string;
}

export interface RegisteredModule {
  name: string;
  actions: string[];
  description?: string;
}

const registeredModules: RegisteredModule[] = [];

export function registerModule(mod: RegisteredModule): void {
  registeredModules.push(mod);
}

export function getRegisteredModules(): RegisteredModule[] {
  return registeredModules;
}

// ── Change Tracking ───────────────────────────────────────────────────
export interface FieldChange {
  field: string;
  before: string;
  after: string;
}

export function computeChanges(before: any, after: any, fields: string[]): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const field of fields) {
    const b = before?.[field] ?? "";
    const a = after?.[field] ?? "";
    if (String(b) !== String(a)) {
      changes.push({ field, before: String(b), after: String(a) });
    }
  }
  return changes;
}

export function changesDescription(changes: FieldChange[]): string {
  return changes.map((c) => `${c.field}: ${c.before} → ${c.after}`).join("; ");
}

// ── Build description for common entity types ─────────────────────────
export function buildChangeDescription(
  entity: string,
  before: any,
  after: any,
  trackedFields: string[]
): string {
  const changes = computeChanges(before, after, trackedFields);
  if (changes.length === 0) return `Updated ${entity}`;
  return `${entity} updated — ${changesDescription(changes)}`;
}

// Predefined tracked fields per entity type
export const TRACKED_FIELDS: Record<string, string[]> = {
  employee: [
    "FirstName", "MiddleInitial", "LastName",
    "Office", "Position",
    "EmploymentType", "EmploymentStatus",
    "Gender", "NewlyHired",
  ],
  user: [
    "name", "role", "isActive",
  ],
  seminar: [
    "title", "year", "quarter", "date", "location", "speaker", "remarks",
  ],
};

// ── Generate detailed description with before/after ─────────────────────
export function formatBeforeAfter(before: any, after: any, trackedFields: string[]): string {
  const changes = computeChanges(before, after, trackedFields);
  return changes.map((c) => `${c.field}\nBefore:\n${c.before || "(empty)"}\nAfter:\n${c.after || "(empty)"}`).join("\n\n");
}
