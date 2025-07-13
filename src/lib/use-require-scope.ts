"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const useRequireScope = (requiredScope: string) => {
  const { session, signOut } = useClerk();
  const { user } = useUser();
  const router = useRouter();
  const [hasScope, setHasScope] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsGoogleAuth, setNeedsGoogleAuth] = useState(false);
  const [needsReauth, setNeedsReauth] = useState(false);

  useEffect(() => {
    const checkScope = async () => {
      if (!session) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/reauth");
        
        if (res.ok) {
          const { scopes, calendarConnected } = await res.json();
          
          // If calendar status was updated, trigger a sync but don't refresh org chart unnecessarily
          if (calendarConnected !== undefined) {
            // Clear session storage to allow fresh calendar sync
            sessionStorage.removeItem('calendar-synced');
            
            // Trigger calendar sync to update database - but only refresh org chart if needed
            try {
              await fetch('/api/user/sync-calendar', { method: 'POST' });
              // Only trigger org chart refresh if this is during initial setup, not during normal usage
              // The org chart will get calendar status updates through normal state management
            } catch (syncError) {
              console.error('Failed to sync calendar after reauth:', syncError);
            }
          }
          
          if (scopes && scopes.includes(requiredScope)) {
            setHasScope(true);
          } else {
            // User has Google OAuth but missing the required scope
            // Check if they need additional scopes
            const scopeRes = await fetch(`/api/reauth?scope=${encodeURIComponent(requiredScope)}`);
            
            if (scopeRes.ok) {
              const scopeData = await scopeRes.json();
              if (scopeData.success) {
                setHasScope(true);
              }
            } else {
              let scopeErrorData;
              try {
                scopeErrorData = await scopeRes.json();
              } catch (parseError) {
                console.error("Failed to parse scope error response as JSON:", parseError);
                setError("Unable to check calendar permissions - server error");
                return;
              }
              
              if (scopeErrorData.error === "additional_scopes_required") {
                if (scopeErrorData.action === "client_reauthorize") {
                  // Use Clerk's reauthorization flow
                  setNeedsReauth(true);
                  setError(scopeErrorData.message);
                } else {
                  // Fallback to sign-in flow
                  setNeedsReauth(true);
                  setError(scopeErrorData.message);
                }
              } else if (scopeErrorData.error === "oauth_token_expired") {
                // OAuth token has expired, trigger reauth
                setNeedsReauth(true);
                setError(scopeErrorData.message);
              } else {
                setError(scopeErrorData.message || "Unable to check calendar permissions");
                console.error("Error checking additional scopes:", scopeErrorData);
              }
            }
          }
        } else {
          let errorData;
          try {
            errorData = await res.json();
          } catch (parseError) {
            console.error("Failed to parse error response as JSON:", parseError);
            setError("Unable to check calendar permissions - server error");
            return;
          }
          
          if (errorData.error === "google_oauth_required") {
            // User needs to sign in with Google OAuth
            setNeedsGoogleAuth(true);
            setError(errorData.message);
          } else if (errorData.error === "oauth_token_expired") {
            // OAuth token has expired, trigger reauth
            setNeedsReauth(true);
            setError(errorData.message);
          } else {
            setError(errorData.message || "Unable to check calendar permissions");
            console.error("Error checking scope:", errorData);
          }
        }
      } catch (error) {
        console.error("Error checking scope:", error);
        setError("Unable to check calendar permissions");
      } finally {
        setIsLoading(false);
      }
    };

    checkScope();
  }, [session, requiredScope, router]);

  const handleSignInWithGoogle = async () => {
    try {
      await signOut();
      // Redirect to sign-in page where user can choose Google OAuth
      router.push('/sign-in');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleReauthorize = async () => {
    if (!user) {
      console.error("No user found for reauthorization");
      return;
    }

    try {
      console.log("Starting reauthorization flow...");
      
      // Find the Google external account (BookMate pattern)
      const googleAccount = user.externalAccounts
        .find(ea => ea.provider === "google");

      if (!googleAccount) {
        console.error("No Google account found");
        setError("No Google account linked. Please sign in with Google.");
        setNeedsGoogleAuth(true);
        return;
      }

      console.log("Found Google account, calling reauthorize...");

      // Call reauthorize with additional scopes (BookMate pattern)
      const reauth = await googleAccount.reauthorize({
        redirectUrl: window.location.href,
        additionalScopes: [
          "https://www.googleapis.com/auth/calendar.readonly",
          "https://www.googleapis.com/auth/calendar.events"
        ]
      });

      console.log("Reauth response:", reauth);

      // Redirect to Google for reauthorization (BookMate pattern)
      if (reauth?.verification?.externalVerificationRedirectURL) {
        console.log("Redirecting to Google for reauthorization");
        window.location.href = reauth.verification.externalVerificationRedirectURL.href;
      } else {
        console.error("No redirect URL received from reauthorization");
        setError("Failed to start reauthorization. Please try again.");
      }
    } catch (error) {
      console.error("Error during reauthorization:", error);
      setError("Failed to reauthorize. Please try signing out and signing in again.");
    }
  };

  return { 
    hasScope, 
    isLoading, 
    error, 
    needsGoogleAuth,
    needsReauth,
    handleSignInWithGoogle,
    handleReauthorize
  };
};
