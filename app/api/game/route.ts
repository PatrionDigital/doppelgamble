// app/api/game/route.ts - Fixed possible null game issue
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
    
    // Check if the player is already in any active game
    try {
      const playerGameStatus = await db.isPlayerInActiveGame(fid);
      
      if (playerGameStatus.isActive && playerGameStatus.gameId) {
        // Player is already in an active game, get the details
        const game = await db.getGameById(playerGameStatus.gameId);
        const player = await db.getPlayerByFid(fid, playerGameStatus.gameId);
        
        return NextResponse.json({
          error: "You are already in an active game. You must wait for it to complete before joining another.",
          game,
          player
        }, { status: 409 }); // Conflict status code
      }
    } catch (error) {
      console.error("Error checking player active games:", error);
      // Continue even if the check fails - better to allow joining than block accidentally
    }
    
    // Find an open game or create a new one
    let game = await db.findOpenGame();
    
    if (!game) {
      game = await db.createGame();
    }
    
    // At this point, game should not be null since we either found one or created one
    // But let's add a safety check anyway
    if (!game) {
      return NextResponse.json(
        { error: "Failed to find or create a game" },
        { status: 500 }
      );
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
    const fidParam = searchParams.get("fid");
    const fid = fidParam ? Number(fidParam) : null;

    // If no gameId but we have fid, find the active game for this player
    if (!gameId && fid) {
      try {
        const playerGameStatus = await db.isPlayerInActiveGame(fid);
        
        if (playerGameStatus.isActive && playerGameStatus.gameId) {
          // Redirect to get the game with the found gameId
          const gameId = playerGameStatus.gameId;
          const game = await db.getGameById(gameId);
          
          if (!game) {
            return NextResponse.json(
              { error: "Game not found" },
              { status: 404 }
            );
          }
          
          const players = await db.getGamePlayers(gameId);
          const currentPlayer = await db.getPlayerByFid(fid, gameId);
          
          // Only include birthdays if game is resolved
          const sanitizedPlayers = players.map(player => ({
            ...player,
            birthday: game.status === GameStatus.RESOLVED ? player.birthday : undefined
          }));
          
          return NextResponse.json({
            game,
            players: sanitizedPlayers,
            currentPlayer,
            totalPlayers: players.length
          });
        }
        
        // No active games found
        return NextResponse.json({
          message: "No active games found for this user",
          currentPlayer: null,
          game: null,
          players: [],
          totalPlayers: 0
        });
      } catch (error) {
        console.error("Error finding active game for player:", error);
        return NextResponse.json(
          { error: "Failed to find active game for player" },
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
      currentPlayer = await db.getPlayerByFid(fid, gameId);
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