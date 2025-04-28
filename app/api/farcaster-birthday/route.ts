// app/api/farcaster-birthday/route.ts
import { NextResponse } from "next/server";

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
    // Call the actual Farcaster API as specified in the implementation plan
    const response = await fetch(`https://hoyt.farcaster.xyz:2281/v1/userDataByFid?fid=${fid}`);
    
    if (!response.ok) {
      throw new Error(`Farcaster API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract timestamp from the response
    const timestamp = data.messages[0].data.timestamp;
    
    // Decode the Farcaster timestamp
    const FARCASTER_EPOCH = 1609459200; // Jan 1, 2021
    const unixTime = FARCASTER_EPOCH + timestamp;
    
    // Convert to date and extract month and day
    const date = new Date(unixTime * 1000); // JavaScript uses milliseconds
    const month = date.getMonth() + 1; // getMonth() returns 0-11
    const day = date.getDate(); // 1-31
    
    // Format as MM-DD for birthday paradox game
    const birthday = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    return NextResponse.json({
      fid,
      timestamp,
      isoDate: date.toISOString(),
      birthday
    });
  } catch (error) {
    console.error("Error fetching Farcaster birthday:", error);
    
    // For development environments, fall back to mock data if API call fails
    if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') {
      console.log("Falling back to mock data for development environment");
      
      // Use mock calculation (maintaining the original mock logic)
      const FARCASTER_EPOCH = 1609459200;
      const fidNum = parseInt(fid);
      const randomOffset = (fidNum * 13) % 7890000;
      const timestamp = randomOffset;
      const unixTime = FARCASTER_EPOCH + timestamp;
      
      const date = new Date(unixTime * 1000);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      
      const birthday = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      return NextResponse.json({
        fid,
        timestamp,
        isoDate: date.toISOString(),
        birthday,
        note: "Using mock data as Farcaster API call failed"
      });
    }
    
    return NextResponse.json(
      { 
        error: "Failed to get Farcaster birthday",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}