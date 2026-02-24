export interface Match {
  id?: string;
  sessionId: string;
  date: Date;
  mode: string;
  placement: number;
  kills: number;
  skinId: string;
  mentalState: number;
  lastMatches?: Match[];
  notes?: string;
}
