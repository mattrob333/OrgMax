import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const client = await clerkClient();
    
    try {
      const clerkResponse = await client.users.getUserOauthAccessToken(
        userId,
        "google"
      );

      if (!clerkResponse || !clerkResponse.data || clerkResponse.data.length === 0) {
        await db.user.update({ 
          where: { clerkId: userId }, 
          data: { calendarConnected: false } 
        });
        return NextResponse.json({ calendarConnected: false });
      }

      const scopes = clerkResponse.data[0]?.scopes || [];
      
      // Check if user has calendar access
      const hasCalendarAccess = scopes.includes('https://www.googleapis.com/auth/calendar.readonly') || 
        scopes.includes('https://www.googleapis.com/auth/calendar.events');
      
      await db.user.update({ 
        where: { clerkId: userId }, 
        data: { calendarConnected: hasCalendarAccess } 
      });

      return NextResponse.json({ calendarConnected: hasCalendarAccess });
      
    } catch (clerkError) {
      await db.user.update({ 
        where: { clerkId: userId }, 
        data: { calendarConnected: false } 
      });
      return NextResponse.json({ calendarConnected: false });
    }
  } catch (error) {
    console.error("Error syncing calendar status:", error);
    return new Response("Internal server error", { status: 500 });
  }
}