import { NextResponse } from "next/server";

// In a real implementation, this would call the Farcaster API
// For now, we'll generate random birthdays for testing
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
    // For testing, generate a deterministic birthday based on the FID
    // This ensures the same FID always gets the same birthday
    const fidNum = parseInt(fid);
    const month = (fidNum % 12) + 1; // 1-12
    const day = (fidNum % 28) + 1; // 1-28 (avoiding edge cases with month lengths)
    
    // Format: MM-DD
    const birthday = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    // Mock timestamp for completeness
    const timestamp = fidNum * 1000;
    const unixTime = 1609459200 + timestamp; // Jan 1, 2021 + offset
    const isoDate = new Date(unixTime * 1000).toISOString();

    return NextResponse.json({
      fid,
      timestamp,
      isoDate,
      birthday
    });
  } catch (error) {
    console.error("Error generating mock Farcaster birthday:", error);
    return NextResponse.json(
      { 
        error: "Failed to get Farcaster birthday",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}