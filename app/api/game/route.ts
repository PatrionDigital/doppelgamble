import { NextResponse } from "next/server";
import * as db from "@/lib/db";
import { GameStatus } from "@/lib/db-types";

// Join or create a game
export async function POST(request: Request) {
  try {
    const { fid, wallet, birthday } = await request.json();
    
    if (!fid || !wallet || !birthday) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Find an open game or create a new one
    let game = await db.findOpenGame();
    
    if (!game) {
      game = await db.createGame();
    }
    
    // Add player to the game
    const player = await db.addPlayerToGame(game.id, fid, wallet, birthday);
    
    return NextResponse.json({
      success: true,
      game,
      player
    });
  } catch (error) {
    console.error("Error joining game:", error);
    return NextResponse.json(
      { 
        error: "Failed to join game",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Get game status
// app/api/game/route.ts (updated GET handler)
// This is a partial update focused on the GET method

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId");
    const fid = searchParams.get("fid");

    // If no gameId but we have fid, find games for this user
    if (!gameId && fid) {
      // Find the most recent game for this user
      try {
        // This would need to be implemented in your db.ts module
        // const playerGames = await db.getPlayerGames(Number(fid));
        
        // For now, since we don't have that function, we'll return a mock response
        return NextResponse.json({
          message: "No active games found for this user",
          currentPlayer: null,
          game: null,
          players: [],
          totalPlayers: 0
        });
      } catch (error) {
        console.error("Error finding games for user:", error);
        return NextResponse.json(
          { error: "Failed to find games for user" },
          { status: 500 }
        );
      }
    }

    if (!gameId) {
      return NextResponse.json(
        { error: "Missing gameId parameter" },
        { status: 400 }
      );
    }
    
    // Rest of the original handler for when gameId is provided
    // Get game info
    const game = await db.getGameById(gameId);
    
    if (!game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }
    
    // Get all players in the game
    const players = await db.getGamePlayers(gameId);
    
    // Get current player info if fid is provided
    let currentPlayer = null;
    if (fid) {
      currentPlayer = await db.getPlayerByFid(Number(fid), gameId);
    }
    
    // Only include birthdays if game is resolved
    const sanitizedPlayers = players.map(player => ({
      ...player,
      // Only include birthday in resolved games
      birthday: game.status === GameStatus.RESOLVED ? player.birthday : undefined
    }));
    
    return NextResponse.json({
      game,
      players: sanitizedPlayers,
      currentPlayer,
      totalPlayers: players.length
    });
  } catch (error) {
    console.error("Error getting game:", error);
    return NextResponse.json(
      { 
        error: "Failed to get game information",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}