// app/api/cancel-joining/route.ts
import { NextResponse } from "next/server";
import * as db from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { playerId } = await request.json();
    
    if (!playerId) {
      return NextResponse.json(
        { error: "Missing playerId" },
        { status: 400 }
      );
    }
    
    // Remove the player from the game
    await db.removePlayer(playerId);
    
    return NextResponse.json({
      success: true,
      message: "Joining process cancelled successfully"
    });
  } catch (error) {
    console.error("Error cancelling joining process:", error);
    return NextResponse.json(
      { 
        error: "Failed to cancel joining process",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}