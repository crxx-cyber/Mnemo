import type { AppData, Category } from "@/types";

const STORAGE_KEY = "memo-app-data";

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "physics", name: "Physics Formula", color: "#6366f1", createdAt: Date.now() },
  { id: "math", name: "Math Theorem", color: "#8b5cf6", createdAt: Date.now() },
  { id: "english", name: "English Words", color: "#06b6d4", createdAt: Date.now() },
];

export function getDefaultData(): AppData {
  return {
    categories: DEFAULT_CATEGORIES,
    notes: [],
  };
}

export function loadData(): AppData {
  if (typeof window === "undefined") return getDefaultData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultData();
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed.categories?.length) parsed.categories = DEFAULT_CATEGORIES;
    if (!parsed.notes) parsed.notes = [];
    return parsed;
  } catch {
    return getDefaultData();
  }
}

export function saveData(data: AppData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
