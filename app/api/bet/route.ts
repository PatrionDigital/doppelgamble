import { NextResponse } from "next/server";
import * as db from "@/lib/db";
import { BetType } from "@/lib/db-types";

// Place a bet
export async function POST(request: Request) {
  try {
    const { playerId, bet } = await request.json();
    
    if (!playerId || !bet) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Validate bet type
    if (bet !== BetType.YES && bet !== BetType.NO) {
      return NextResponse.json(
        { error: "Invalid bet type. Must be 'yes' or 'no'." },
        { status: 400 }
      );
    }
    
    // Record the bet
    await db.recordPlayerBet(playerId, bet);
    
    return NextResponse.json({
      success: true,
      message: "Bet recorded successfully"
    });
  } catch (error) {
    console.error("Error placing bet:", error);
    return NextResponse.json(
      { 
        error: "Failed to place bet",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}