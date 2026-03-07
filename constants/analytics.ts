import { Timestamp } from "firebase/firestore";

// ─── Colors ───────────────────────────────────────────────────────────────────
export const PURPLE = "#8b5cf6";
export const BLUE = "#3b82f6";
export const AMBER = "#f59e0b";
export const GREEN = "#22c55e";
export const RED = "#ef4444";

export const BUCKET_COLORS: Record<string, string> = {
  TILTED: "#ff3b3b",
  NEUTRAL: "#ffcc3b",
  FOCUSED: "#66ff3b",
  "LOCKED IN": "#00ff00",
};

export const TIME_BUCKETS = [
  { label: "MORNING", range: "6am–12pm", hours: [6, 7, 8, 9, 10, 11], color: AMBER },
  { label: "AFTERNOON", range: "12pm–6pm", hours: [12, 13, 14, 15, 16, 17], color: "#ff993b" },
  { label: "EVENING", range: "6pm–12am", hours: [18, 19, 20, 21, 22, 23], color: PURPLE },
  { label: "NIGHT", range: "12am–6am", hours: [0, 1, 2, 3, 4, 5], color: BLUE },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const avg = (arr: number[]) =>
  arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;

export const modeColor = (mode: string) =>
  mode === "OG" ? PURPLE : mode === "BR" ? BLUE : AMBER;

export const mentalLabel = (val: number) => {
  if (val <= 3) return "TILTED";
  if (val <= 6) return "NEUTRAL";
  if (val <= 8) return "FOCUSED";
  return "LOCKED IN";
};

export const mentalColor = (val: number) => {
  if (val <= 3) return RED;
  if (val <= 6) return AMBER;
  if (val <= 8) return BLUE;
  return GREEN;
};

export const formatDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const coerceDate = (date: string | Timestamp): string => {
  if (!date) return "—";
  if (typeof date === "string") return date;
  return (date as Timestamp)
    .toDate()
    .toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export const getMatchDate = (date: string | Timestamp): Date | null => {
  if (!date) return null;
  if (typeof date === "string") return new Date(date);
  return (date as Timestamp).toDate();
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AnalyticsMatch {
  date: string | Timestamp;
  mode: "OG" | "BR" | "Reload";
  placement: number;
  kills: number;
  skinId: string;
  mentalState: number;
  notes: string;
  sessionId: string;
}

export interface AnalyticsSession {
  id: string;
  createdAt: Date;
  endedAt: Date | null;
  totalKills: number;
  totalMatches: number;
  averagePlacement: number;
  averageMental: number;
  wins: number;
  winPercentage: number;
}