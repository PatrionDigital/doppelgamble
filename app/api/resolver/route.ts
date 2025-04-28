import { NextResponse } from "next/server";
import * as db from "@/lib/db";
import { BetType, Player } from "@/lib/db-types";

// Mock notification function for testing
async function sendFrameNotification(params: { 
  fid: number; 
  title: string; 
  body: string;
  notificationDetails?: unknown;
}) {
  console.log(`[MOCK] Sending notification to FID ${params.fid}: ${params.title} - ${params.body}`);
  return { state: "success" };
}

// Check for birthday matches in a game
function checkBirthdayMatches(players: Player[]): boolean {
  const birthdays = new Set<string>();
  
  for (const player of players) {
    if (birthdays.has(player.birthday)) {
      return true; // Found a match
    }
    birthdays.add(player.birthday);
  }
  
  return false; // No matches found
}

// Resolver endpoint to check and resolve completed games
export async function POST(request: Request) {
  try {
    // This endpoint should be secured in production with a secret key
    const authorization = request.headers.get("Authorization");
    
    if (!process.env.RESOLVER_SECRET_KEY || 
        authorization !== `Bearer ${process.env.RESOLVER_SECRET_KEY}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Find games ready to resolve
    const readyGames = await db.getGamesReadyToResolve();
    console.log(`Found ${readyGames.length} games ready to resolve`);
    
    const results = [];
    
    for (const game of readyGames) {
      // Get all players in the game
      const players = await db.getGamePlayers(game.id);
      
      // Check for birthday matches
      const hasBirthdayMatch = checkBirthdayMatches(players);
      
      // Resolve the game
      await db.resolveGame(game.id, hasBirthdayMatch);
      
      // Determine winners and send notifications
      const winningBet = hasBirthdayMatch ? BetType.YES : BetType.NO;
      const winners = players.filter(player => player.bet === winningBet);
      
      // Calculate payout
      const payoutPerWinner = winners.length > 0 ? 11.5 / winners.length : 0;
      
      // Send notifications to all players
      for (const player of players) {
        const isWinner = player.bet === winningBet;
        
        // Only send notifications if player has Farcaster
        try {
          await sendFrameNotification({
            fid: player.fid,
            title: "DoppelGamble Game Results",
            body: isWinner 
              ? `Congratulations! You won ${payoutPerWinner.toFixed(2)} USDC in the birthday paradox game.`
              : "Game over! Your bet didn't win this time, but try again!"
          });
        } catch (error) {
          console.error(`Failed to send notification to player ${player.fid}:`, error);
        }
      }
      
      results.push({
        gameId: game.id,
        hasBirthdayMatch,
        winningBet,
        winners: winners.length,
        payoutPerWinner: payoutPerWinner.toFixed(2)
      });
    }
    
    return NextResponse.json({
      success: true,
      gamesResolved: results.length,
      results
    });
  } catch (error) {
    console.error("Error resolving games:", error);
    return NextResponse.json(
      { 
        error: "Failed to resolve games",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}