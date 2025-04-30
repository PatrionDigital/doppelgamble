// lib/db-types.ts - Common database types for the application

// Game status enum
export enum GameStatus {
  OPEN = 'open',
  FULL = 'full',
  RESOLVED = 'resolved'
}

// Bet type enum
export enum BetType {
  YES = 'yes',
  NO = 'no'
}

// Player interface for application use
export interface Player {
  id: string;
  fid: number;
  wallet: string;
  birthday: string; // Format: MM-DD
  bet?: BetType;
  paid: boolean;
  payout?: number;
  gameId: string;
  createdAt: string;
}

// Game interface for application use
export interface Game {
  id: string;
  status: GameStatus;
  createdAt: string;
  resolvedAt?: string;
  winningBet?: BetType;
  hasBirthdayMatch?: boolean;
}