// app/api/bet/route.ts - Enhanced error handling
import { NextResponse } from "next/server";
import * as db from "@/lib/db";
import { BetType } from "@/lib/db-types";

// Place a bet
export async function POST(request: Request) {
  try {
    console.log("Received bet request");
    const body = await request.json();
    console.log("Bet request body:", body);
    
    const { playerId, bet, betAmount } = body;
    
    if (!playerId || !bet) {
      console.log("Missing required fields:", { playerId, bet });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Validate bet type
    if (bet !== BetType.YES && bet !== BetType.NO) {
      console.log("Invalid bet type:", bet);
      return NextResponse.json(
        { error: "Invalid bet type. Must be 'yes' or 'no'." },
        { status: 400 }
      );
    }
    
    // Record the bet
    try {
      console.log(`REcording bet for player ${playerId}: ${bet} (Amount: ${betAmount || '0'})`);
      await db.recordPlayerBet(playerId, bet);
      console.log("Bet recorded successfully for player:", playerId);
    } catch (dbError) {
      console.error("Database error recording bet:", dbError);
      return NextResponse.json(
        { 
          error: "Database error recording bet",
          details: dbError instanceof Error ? dbError.message : String(dbError)
        },
        { status: 500 }
      );
    }
    
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