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
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get("gameId");
    const fid = searchParams.get("fid");

    if (!gameId) {
      return NextResponse.json(
        { error: "Missing gameId parameter" },
        { status: 400 }
      );
    }
    
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