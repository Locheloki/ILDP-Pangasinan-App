import { LearningNeed } from "../types";

export const LEARNING_NEEDS_CLIPBOARD_KEY = "ildp-learning-needs-clipboard";

function getStorage(): Storage | undefined {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }

  if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
    return globalThis.localStorage as Storage;
  }

  return undefined;
}

export function normalizeLearningNeeds(needs: LearningNeed[]): LearningNeed[] {
  return needs
    .filter((need) => need?.LearningNeed?.trim())
    .map((need) => {
      const { LearningNeedID, EmployeeID, CreatedAt, UpdatedAt, CreatedBy, UpdatedBy, ...rest } = need;
      return {
        ...rest,
        LearningNeed: need.LearningNeed?.trim() || "",
        Basis: Array.isArray(need.Basis) ? [...need.Basis] : [],
        Methodology: Array.isArray(need.Methodology) ? [...need.Methodology] : [],
        TargetSchedule: need.TargetSchedule || "",
      } as LearningNeed;
    });
}

export function getStoredLearningNeedsClipboard(): LearningNeed[] {
  const storage = getStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(LEARNING_NEEDS_CLIPBOARD_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? normalizeLearningNeeds(parsed as LearningNeed[]) : [];
  } catch {
    return [];
  }
}

export function setStoredLearningNeedsClipboard(needs: LearningNeed[]): void {
  const storage = getStorage();
  if (!storage) return;

  storage.setItem(LEARNING_NEEDS_CLIPBOARD_KEY, JSON.stringify(normalizeLearningNeeds(needs)));
}

export function clearStoredLearningNeedsClipboard(): void {
  const storage = getStorage();
  if (!storage) return;

  storage.removeItem(LEARNING_NEEDS_CLIPBOARD_KEY);
}

export function getStoredLearningNeedsClipboardCount(): number {
  return getStoredLearningNeedsClipboard().length;
}
