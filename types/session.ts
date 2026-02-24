export interface Session {
  //sessionId: string;
  id?: string; // Firestore document ID

  createdAt: Date;
  endedAt: Date | null;
  wins: number;
  winPercentage: number;
  totalMatches: number;
  totalKills: number;
  averagePlacement: number;
  averageMental: number;
}
