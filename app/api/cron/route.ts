import { NextResponse } from "next/server";
import * as db from "@/lib/db";

// Cron job endpoint to initialize the database and check for games to resolve
export async function GET(request: Request) {
  try {
    // This endpoint should be secured in production with a secret key
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!process.env.CRON_SECRET_KEY || key !== process.env.CRON_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Initialize the database if it hasn't been initialized yet
    try {
      await db.initializeDatabase();
      console.log("Database initialized");
    } catch (error) {
      console.error("Error initializing database:", error);
    }

    // Call the resolver endpoint to check for games to resolve
    // Create a new request to the resolver endpoint
    const resolverUrl = new URL("/api/resolver", request.url).toString();
    const resolverResponse = await fetch(resolverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESOLVER_SECRET_KEY || ""}`
      },
    });

    if (!resolverResponse.ok) {
      throw new Error(`Resolver API returned: ${resolverResponse.status}`);
    }

    const resolverData = await resolverResponse.json();

    return NextResponse.json({
      success: true,
      databaseInitialized: true,
      resolverResult: resolverData
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      {
        error: "Cron job failed",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}