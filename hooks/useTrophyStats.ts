import { Timestamp } from "firebase/firestore";
import { Match, Session } from "./useTrophyData";
import { Ionicons } from "@expo/vector-icons";
import { stateLabel } from "@/constants/analytics";

// ─── Design tokens (local to calcs — no UI here) ─────────────────────────────
const PURPLE = "#8b5cf6";
const AMBER = "#f59e0b";
const GREEN = "#22c55e";
const BLUE = "#3b82f6";
const RED = "#ef4444";
const GOLD = "#FFD700";

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const toDate = (date: string | Timestamp): Date => {
  if (!date) return new Date();
  if (typeof date === "string") return new Date(date);
  return (date as Timestamp).toDate();
};

export const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export const fmtDateShort = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

// ─── Trophy definition ────────────────────────────────────────────────────────
export interface TrophyDef {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  color: string;
  tier: "gold" | "silver" | "bronze";
  value: string | null;
  sub: string | null;
}

// ─── Summary counts ───────────────────────────────────────────────────────────
export interface TrophySummary {
  totalMatches: number;
  totalWins: number;
  totalKills: number;
  endedSessions: number;
}

export interface UseTrophyStatsResult {
  trophies: TrophyDef[];
  summary: TrophySummary;
}

const fmtDuration = (start: Date, end: Date) => {
  const mins = Math.round((end.getTime() - start.getTime()) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export function useTrophyStats(
  matches: Match[],
  sessions: Session[],
): UseTrophyStatsResult {
  const ended = sessions.filter((s) => s.endedAt !== null);

  // ── 1. Most kills in a single match ──
  const bestKillMatch = matches.length
    ? matches.reduce((best, m) => (m.kills > best.kills ? m : best), matches[0])
    : null;

  // ── 2. Best win streak ──
  let bestStreak = 0;
  let currentStreak = 0;
  let streakStartIdx = 0;
  let bestStreakStartIdx = 0;
  const chronoMatches = [...matches].reverse();

  chronoMatches.forEach((m, i) => {
    if (m.placement === 1) {
      if (currentStreak === 0) streakStartIdx = i;
      currentStreak++;
      if (currentStreak > bestStreak) {
        bestStreak = currentStreak;
        bestStreakStartIdx = streakStartIdx;
      }
    } else {
      currentStreak = 0;
    }
  });

  const streakStartMatch = chronoMatches[bestStreakStartIdx];
  const streakEndMatch = chronoMatches[bestStreakStartIdx + bestStreak - 1];

  // ── 3. Highest win % session ──
  const bestWinPctSession = ended.length
    ? ended.reduce(
        (best, s) => (s.winPercentage > best.winPercentage ? s : best),
        ended[0],
      )
    : null;

  // ── 4. Best avg placement session (min 3 matches) ──
  const qualified = ended.filter((s) => s.totalMatches >= 3);
  const bestPlacementSession = qualified.length
    ? qualified.reduce(
        (best, s) => (s.averagePlacement < best.averagePlacement ? s : best),
        qualified[0],
      )
    : null;

  // ── 5. Peak mental session ──
  const bestMentalSession = ended.length
    ? ended.reduce(
        (best, s) => (s.averageMental > best.averageMental ? s : best),
        ended[0],
      )
    : null;

  // ── 6. Most kills in a session ──
  const bestKillSession = ended.length
    ? ended.reduce(
        (best, s) => (s.totalKills > best.totalKills ? s : best),
        ended[0],
      )
    : null;

  // ── 7. Longest session ──
  const longestSession = ended.length
    ? ended.reduce(
        (best, s) => (s.totalMatches > best.totalMatches ? s : best),
        ended[0],
      )
    : null;

  // ── 8. Best K/D session (min 3 matches) ──
  const bestKDSession = qualified.length
    ? qualified.reduce((best, s) => {
        const kd = s.totalKills / Math.max(1, s.totalMatches - s.wins);
        const bestKD =
          best.totalKills / Math.max(1, best.totalMatches - best.wins);
        return kd > bestKD ? s : best;
      }, qualified[0])
    : null;

  // ── Build trophy list ──
  const trophies: TrophyDef[] = [
    {
      label: "KILL RECORD",
      iconName: "skull-outline",
      color: RED,
      tier: "gold",
      value: bestKillMatch ? `${bestKillMatch.kills} kills` : null,
      sub: bestKillMatch
        ? `${bestKillMatch.mode} · ${fmtDate(toDate(bestKillMatch.date))}`
        : null,
    },
    {
      label: "WIN STREAK",
      iconName: "flame-outline",
      color: AMBER,
      tier: "gold",
      value: bestStreak > 0 ? `${bestStreak} in a row` : null,
      sub:
        bestStreak > 0 && streakStartMatch && streakEndMatch
          ? `${fmtDateShort(toDate(streakStartMatch.date))} – ${fmtDateShort(toDate(streakEndMatch.date))}`
          : null,
    },
    {
      label: "BEST WIN % SESSION",
      iconName: "trophy-outline",
      color: GOLD,
      tier: "gold",
      value: bestWinPctSession
        ? `${bestWinPctSession.winPercentage.toFixed(0)}%`
        : null,
      sub: bestWinPctSession
        ? `${bestWinPctSession.wins}W / ${bestWinPctSession.totalMatches} matches · ${fmtDate(bestWinPctSession.createdAt)}`
        : null,
    },
    {
      label: "BEST PLACEMENT SESSION",
      iconName: "ribbon-outline",
      color: GREEN,
      tier: "silver",
      value: bestPlacementSession
        ? `#${bestPlacementSession.averagePlacement.toFixed(1)} avg`
        : null,
      sub: bestPlacementSession
        ? `${bestPlacementSession.totalMatches} matches · ${fmtDate(bestPlacementSession.createdAt)}`
        : null,
    },
    {
      label: "PEAK MENTAL SESSION",
      iconName: "pulse-outline",
      color: PURPLE,
      tier: "silver",
      value: bestMentalSession
        ? `${bestMentalSession.averageMental.toFixed(1)} ${stateLabel(Math.round(bestMentalSession.averageMental))}`
        : null,
      sub: bestMentalSession
        ? `${bestMentalSession.totalMatches} matches · ${fmtDate(bestMentalSession.createdAt)}`
        : null,
    },
    {
      label: "MOST KILLS SESSION",
      iconName: "flash-outline",
      color: RED,
      tier: "silver",
      value: bestKillSession ? `${bestKillSession.totalKills} kills` : null,
      sub: bestKillSession
        ? `${bestKillSession.totalMatches} matches · ${fmtDate(bestKillSession.createdAt)}`
        : null,
    },
    {
      label: "LONGEST SESSION",
      iconName: "time-outline",
      color: BLUE,
      tier: "bronze",
      value: longestSession ? `${longestSession.totalMatches} matches` : null,
      sub: longestSession
        ? `${longestSession.wins} wins · ${
            longestSession.endedAt
              ? fmtDuration(longestSession.createdAt, longestSession.endedAt)
              : "ongoing"
          }`
        : null,
    },
    {
      label: "BEST K/D SESSION",
      iconName: "git-compare-outline",
      color: AMBER,
      tier: "bronze",
      value: bestKDSession
        ? `${(bestKDSession.totalKills / Math.max(1, bestKDSession.totalMatches - bestKDSession.wins)).toFixed(2)}`
        : null,
      sub: bestKDSession
        ? `${bestKDSession.totalKills} kills · ${fmtDate(bestKDSession.createdAt)}`
        : null,
    },
  ];

  const summary: TrophySummary = {
    totalMatches: matches.length,
    totalWins: matches.filter((m) => m.placement === 1).length,
    totalKills: matches.reduce((a, m) => a + m.kills, 0),
    endedSessions: ended.length,
  };

  return { trophies, summary };
}
