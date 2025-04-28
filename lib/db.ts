import { createClient } from '@libsql/client';
import { GameStatus, BetType, Player, Game } from './db-types';

// Create a database client
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

// Initialize database tables
export async function initializeDatabase() {
  try {
    // Create games table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS games (
        id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        resolved_at TEXT,
        winning_bet TEXT,
        has_birthday_match BOOLEAN
      )
    `);

    // Create players table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        fid INTEGER NOT NULL,
        wallet TEXT NOT NULL,
        birthday TEXT NOT NULL,
        bet TEXT,
        paid BOOLEAN DEFAULT FALSE,
        payout REAL,
        game_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (game_id) REFERENCES games (id)
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Create a new game
export async function createGame(): Promise<Game> {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  
  await client.execute({
    sql: 'INSERT INTO games (id, status, created_at) VALUES (?, ?, ?)',
    args: [id, GameStatus.OPEN, createdAt]
  });
  
  return {
    id,
    status: GameStatus.OPEN,
    createdAt
  };
}

// Find an open game
export async function findOpenGame(): Promise<Game | null> {
  const result = await client.execute({
    sql: `
      SELECT g.id, g.status, g.created_at as createdAt, 
             COUNT(p.id) as count
      FROM games g
      LEFT JOIN players p ON g.id = p.game_id
      WHERE g.status = ?
      GROUP BY g.id
      HAVING count < 23
      ORDER BY g.created_at ASC
      LIMIT 1
    `,
    args: [GameStatus.OPEN]
  });
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  return {
    id: String(row.id),
    status: String(row.status) as GameStatus,
    createdAt: String(row.createdAt || row.created_at)
  };
}

// Add player to game
export async function addPlayerToGame(
  gameId: string,
  fid: number,
  wallet: string,
  birthday: string
): Promise<Player> {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  
  await client.execute({
    sql: `
      INSERT INTO players (
        id, fid, wallet, birthday, paid, game_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    args: [id, fid, wallet, birthday, false, gameId, createdAt]
  });
  
  // Check if game is now full
  const countResult = await client.execute({
    sql: 'SELECT COUNT(*) as count FROM players WHERE game_id = ?',
    args: [gameId]
  });
  
  const playerCount = Number(countResult.rows[0].count);
  
  if (playerCount >= 23) {
    // Update game status to full
    await client.execute({
      sql: 'UPDATE games SET status = ? WHERE id = ?',
      args: [GameStatus.FULL, gameId]
    });
  }
  
  return {
    id,
    fid,
    wallet,
    birthday,
    paid: false,
    gameId,
    createdAt
  };
}

// Remove a player from a game
export async function removePlayer(playerId: string): Promise<void> {
  try {
    await client.execute({
      sql: 'DELETE FROM players WHERE id = ?',
      args: [playerId]
    });
    console.log(`Player ${playerId} removed from game`);
  } catch (error) {
    console.error("Failed to remove player:", error);
    throw error;
  }
}
// Check if a player is in any active game
export async function isPlayerInActiveGame(fid: number): Promise<{isActive: boolean, gameId?: string}> {
  try {
    const result = await client.execute({
      sql: `
        SELECT g.id, g.status
        FROM games g
        JOIN players p ON g.id = p.game_id
        WHERE p.fid = ? AND (g.status = ? OR g.status = ?)
        LIMIT 1
      `,
      args: [fid, GameStatus.OPEN, GameStatus.FULL]
    });
    
    if (result.rows.length === 0) {
      return { isActive: false };
    }
    
    const row = result.rows[0];
    return { 
      isActive: true, 
      gameId: String(row.id) 
    };
  } catch (error) {
    console.error("Failed to check if player is in active game:", error);
    throw error;
  }
}
// Record player bet
export async function recordPlayerBet(
  playerId: string,
  bet: BetType
): Promise<void> {
  await client.execute({
    sql: 'UPDATE players SET bet = ? WHERE id = ?',
    args: [bet, playerId]
  });
}

// Mark player as paid
export async function markPlayerAsPaid(
  playerId: string
): Promise<void> {
  await client.execute({
    sql: 'UPDATE players SET paid = TRUE WHERE id = ?',
    args: [playerId]
  });
}

// Get player by FID and gameId
export async function getPlayerByFid(
  fid: number,
  gameId: string
): Promise<Player | null> {
  const result = await client.execute({
    sql: `
      SELECT id, fid, wallet, birthday, bet, paid, payout, game_id as gameId, created_at as createdAt 
      FROM players 
      WHERE fid = ? AND game_id = ?
    `,
    args: [fid, gameId]
  });
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  return {
    id: String(row.id),
    fid: Number(row.fid),
    wallet: String(row.wallet),
    birthday: String(row.birthday),
    bet: row.bet ? String(row.bet) as BetType : undefined,
    paid: Boolean(row.paid),
    payout: row.payout !== undefined ? Number(row.payout) : undefined,
    gameId: String(row.gameId || row.game_id),
    createdAt: String(row.createdAt || row.created_at)
  };
}

// Get all players in a game
export async function getGamePlayers(gameId: string): Promise<Player[]> {
  const result = await client.execute({
    sql: `
      SELECT id, fid, wallet, birthday, bet, paid, payout, game_id as gameId, created_at as createdAt 
      FROM players 
      WHERE game_id = ?
    `,
    args: [gameId]
  });
  
  return result.rows.map(row => ({
    id: String(row.id),
    fid: Number(row.fid),
    wallet: String(row.wallet),
    birthday: String(row.birthday),
    bet: row.bet ? String(row.bet) as BetType : undefined,
    paid: Boolean(row.paid),
    payout: row.payout !== undefined ? Number(row.payout) : undefined,
    gameId: String(row.gameId || row.game_id),
    createdAt: String(row.createdAt || row.created_at)
  }));
}

// Get game by ID
export async function getGameById(gameId: string): Promise<Game | null> {
  const result = await client.execute({
    sql: `
      SELECT id, status, created_at as createdAt, resolved_at as resolvedAt,
             winning_bet as winningBet, has_birthday_match as hasBirthdayMatch
      FROM games
      WHERE id = ?
    `,
    args: [gameId]
  });
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const row = result.rows[0];
  return {
    id: String(row.id),
    status: String(row.status) as GameStatus,
    createdAt: String(row.createdAt || row.created_at),
    resolvedAt: row.resolvedAt || row.resolved_at ? String(row.resolvedAt || row.resolved_at) : undefined,
    winningBet: row.winningBet || row.winning_bet ? String(row.winningBet || row.winning_bet) as BetType : undefined,
    hasBirthdayMatch: Boolean(row.hasBirthdayMatch || row.has_birthday_match)
  };
}

// Check for games ready to resolve (all players have paid)
export async function getGamesReadyToResolve(): Promise<Game[]> {
  const result = await client.execute({
    sql: `
      SELECT g.id, g.status, g.created_at as createdAt
      FROM games g
      WHERE g.status = ?
      AND (
        SELECT COUNT(*) FROM players p 
        WHERE p.game_id = g.id AND p.paid = TRUE
      ) = 23
    `,
    args: [GameStatus.FULL]
  });
  
  return result.rows.map(row => ({
    id: String(row.id),
    status: String(row.status) as GameStatus,
    createdAt: String(row.createdAt || row.created_at)
  }));
}

// Resolve a game
export async function resolveGame(
  gameId: string,
  hasBirthdayMatch: boolean
): Promise<void> {
  const winningBet = hasBirthdayMatch ? BetType.YES : BetType.NO;
  const resolvedAt = new Date().toISOString();
  
  await client.execute({
    sql: `
      UPDATE games 
      SET status = ?, resolved_at = ?, winning_bet = ?, has_birthday_match = ?
      WHERE id = ?
    `,
    args: [GameStatus.RESOLVED, resolvedAt, winningBet, hasBirthdayMatch, gameId]
  });
  
  // Update player payouts
  const players = await getGamePlayers(gameId);
  const winners = players.filter(player => player.bet === winningBet);
  
  if (winners.length === 0) {
    return; // No winners
  }
  
  // Calculate payout per winner
  // Total pot: 23 players × 0.5 USDC = 11.5 USDC
  const totalPot = 11.5;
  const payoutPerWinner = totalPot / winners.length;
  
  // Update payouts for winners
  for (const winner of winners) {
    await client.execute({
      sql: 'UPDATE players SET payout = ? WHERE id = ?',
      args: [payoutPerWinner, winner.id]
    });
  }
}