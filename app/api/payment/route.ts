import { NextResponse } from "next/server";
import * as db from "@/lib/db";

// Record payment
export async function POST(request: Request) {
  try {
    const { playerId, transactionHash } = await request.json();
    
    if (!playerId || !transactionHash) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Mark player as paid
    await db.markPlayerAsPaid(playerId);
    
    // Log the transaction for verification
    console.log(`Payment recorded: Player ${playerId}, Transaction: ${transactionHash}`);
    
    return NextResponse.json({
      success: true,
      message: "Payment recorded successfully"
    });
  } catch (error) {
    console.error("Error recording payment:", error);
    return NextResponse.json(
      { 
        error: "Failed to record payment",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}