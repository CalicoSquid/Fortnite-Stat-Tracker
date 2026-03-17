export type SessionGoal =
  | "Just vibing"
  | "Win hunting"
  | "Kill farming"
  | "Ranked grind";

export type SessionMode = "OG" | "BR" | "Reload";

export interface Session {
  id?: string;
  createdAt: Date;
  endedAt: Date | null;
  wins: number;
  winPercentage: number;
  totalMatches: number;
  totalKills: number;
  averagePlacement: number;
  averageMental: number;
  // ── Session setup fields ──
  mode?: SessionMode;
  startingMental?: number;
  goal?: SessionGoal;
}