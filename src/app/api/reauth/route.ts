import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  console.log("--- /api/reauth called ---");
  
  try {
    const { userId } = await auth();
    console.log("Auth object in API route:", JSON.stringify({ userId }, null, 2));

    if (!userId) {
      console.error("API Route: Unauthorized. No userId found.");
      return NextResponse.json({
        error: "unauthorized",
        message: "Authentication required to check calendar permissions.",
        action: "login_required"
      }, { status: 401 });
    }

    console.log(`API Route: Authenticated as user ${userId}`);

    const client = await clerkClient();
    
    try {
      const clerkResponse = await client.users.getUserOauthAccessToken(
        userId,
        "google"
      );

      console.log("Clerk response:", clerkResponse);

      if (!clerkResponse || !clerkResponse.data || clerkResponse.data.length === 0) {
        console.error("API Route: No Google OAuth token found for user.");
        return NextResponse.json({
          error: "google_oauth_required",
          message: "To access calendar features, you need to sign in with Google. Please sign out and sign back in using the 'Continue with Google' option.",
          action: "redirect_to_google_signin"
        }, { status: 400 });
      }

      const accessToken = clerkResponse.data[0]?.token;
      const scopes = clerkResponse.data[0]?.scopes || [];
      
      
      if (!accessToken) {
        console.error("API Route: No access token in response.");
        return NextResponse.json({
          error: "google_oauth_required", 
          message: "Google authentication is required for calendar access.",
          action: "redirect_to_google_signin"
        }, { status: 400 });
      }

      console.log("API Route: Successfully retrieved Google OAuth token.");
      console.log("Current scopes:", scopes);

      const { searchParams } = new URL(req.url);
      const requiredScope = searchParams.get("scope");

      if (requiredScope) {
        console.log(`API Route: Checking for required scope: ${requiredScope}`);
        
        // Check if the user already has the required scope or equivalent calendar access
        const hasCalendarAccess = scopes.includes(requiredScope) || 
          (requiredScope === 'https://www.googleapis.com/auth/calendar.readonly' && 
           scopes.includes('https://www.googleapis.com/auth/calendar.events'));
        
        if (hasCalendarAccess) {
          console.log("API Route: User already has the required scope");
          await db.user.update({ where: { clerkId: userId }, data: { calendarConnected: true } });
          return NextResponse.json({ 
            success: true, 
            message: "Scope already granted",
            scopes: scopes 
          });
        }
        
        // User needs additional scopes - client should handle reauthorization
        console.log("API Route: User needs additional scopes, client should handle reauthorization");
        await db.user.update({ where: { clerkId: userId }, data: { calendarConnected: false } });
        
        return NextResponse.json({
          error: "additional_scopes_required",
          message: "Additional calendar permissions are required.",
          action: "client_reauthorize",
          required_scope: requiredScope,
          current_scopes: scopes
        }, { status: 403 });
        
      } else {
        console.log("API Route: Scope check flow initiated.");
        
        // Check if user has calendar access and update database accordingly
        const hasCalendarAccess = scopes.includes('https://www.googleapis.com/auth/calendar.readonly') || 
          scopes.includes('https://www.googleapis.com/auth/calendar.events');
        
        console.log(`API Route: User has calendar access: ${hasCalendarAccess}`);
        
        // Update the calendarConnected field based on current scopes
        await db.user.update({ 
          where: { clerkId: userId }, 
          data: { calendarConnected: hasCalendarAccess } 
        });
        
        console.log(`API Route: Updated calendarConnected to ${hasCalendarAccess} for user ${userId}`);
        
        // Return current scopes
        console.log("API Route: Returning current scopes:", scopes);
        return NextResponse.json({ 
          scopes: scopes,
          calendarConnected: hasCalendarAccess 
        });
      }
    } catch (clerkError) {
      console.error("API Route: Error getting OAuth token from Clerk:", clerkError);
      
      // Check if this is a "user doesn't have Google OAuth" error
      if ((clerkError as any)?.status === 400) {
        return NextResponse.json({
          error: "google_oauth_required",
          message: "To access calendar features, you need to sign in with Google. Please sign out and sign back in using the 'Continue with Google' option.",
          action: "redirect_to_google_signin",
          details: "The current account was not created with Google OAuth. Calendar features require Google authentication."
        }, { status: 400 });
      }
      
      // Handle 422 (token expired/invalid) and other Clerk errors
      if ((clerkError as any)?.status === 422) {
        // Update database to reflect disconnected state
        try {
          await db.user.update({ 
            where: { clerkId: userId }, 
            data: { calendarConnected: false } 
          });
        } catch (dbError) {
          console.error("Failed to update calendar connection status:", dbError);
        }
        
        return NextResponse.json({
          error: "oauth_token_expired",
          message: "Your Google calendar connection has expired. Please reconnect to access calendar features.",
          action: "reauth_required",
          details: "The OAuth token is no longer valid and needs to be refreshed."
        }, { status: 401 });
      }
      
      // Generic Clerk error
      return NextResponse.json({
        error: "oauth_error",
        message: "Unable to verify calendar permissions at this time.",
        action: "retry_later",
        details: `Clerk error: ${(clerkError as any)?.message || 'Unknown error'}`
      }, { status: 500 });
    }
  } catch (error) {
    console.error("API Route: Error in /api/reauth:", error);
    return NextResponse.json({
      error: "internal_server_error",
      message: "An unexpected error occurred while checking calendar permissions.",
      action: "retry_later",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
