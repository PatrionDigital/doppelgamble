// app/api/payment/route.ts - Enhanced error handling
import { NextResponse } from "next/server";
import * as db from "@/lib/db";

// Record payment
export async function POST(request: Request) {
  try {
    console.log("Received payment request");
    const body = await request.json();
    console.log("Payment request body:", body);
    
    const { playerId, transactionHash, betAmount } = body;
    
    if (!playerId || !transactionHash) {
      console.log("Missing required fields:", { playerId, transactionHash });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(`Processing payment for player ${playerId} with bet amount: ${betAmount || '0'}`);
    
    // Mark player as paid
    try {
      await db.markPlayerAsPaid(playerId);
      console.log("Player marked as paid:", playerId);
    } catch (dbError) {
      console.error("Database error marking player as paid:", dbError);
      return NextResponse.json(
        { 
          error: "Database error marking player as paid",
          details: dbError instanceof Error ? dbError.message : String(dbError)
        },
        { status: 500 }
      );
    }
    
    // Log the transaction for verification
    console.log(`Payment recorded: Player ${playerId}, Transaction: ${transactionHash}, Amount: ${betAmount || '0'} USDC`);
    
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