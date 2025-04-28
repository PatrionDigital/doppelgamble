// app/api/farcaster-birthday/route.ts
import { NextResponse } from "next/server";

// For actual implementation
// We'll use the Farcaster API to get user data
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fid = searchParams.get("fid");

  if (!fid) {
    return NextResponse.json(
      { error: "Missing fid parameter" },
      { status: 400 }
    );
  }

  try {
    // In a production environment, this would call the actual Farcaster API
    // For now, we'll implement a more realistic mock that follows the implementation plan
    const FARCASTER_EPOCH = 1609459200; // Jan 1, 2021
    
    // Create a deterministic but more realistic mock
    const fidNum = parseInt(fid);
    // Generate a pseudo-random timestamp based on FID
    const randomOffset = (fidNum * 13) % 7890000; // Some arbitrary calculation for variance
    const timestamp = randomOffset;
    const unixTime = FARCASTER_EPOCH + timestamp;
    
    // Convert to date and extract month and day
    const date = new Date(unixTime * 1000);
    const month = date.getMonth() + 1; // getMonth() returns 0-11
    const day = date.getDate(); // 1-31
    
    // Format as MM-DD
    const birthday = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    return NextResponse.json({
      fid,
      timestamp,
      isoDate: date.toISOString(),
      birthday
    });
  } catch (error) {
    console.error("Error fetching Farcaster birthday:", error);
    return NextResponse.json(
      { 
        error: "Failed to get Farcaster birthday",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}