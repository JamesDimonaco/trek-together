"use client";

import { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";

export default function AuthSync() {
  const { user, isSignedIn, isLoaded } = useUser();
  const clerk = useClerk();
  const [hasSynced, setHasSynced] = useState(false);

  // Pre-fill Clerk signup with existing username
  useEffect(() => {
    if (!isLoaded || isSignedIn) return;

    const prefilUsernameInClerk = async () => {
      try {
        // Get current session to check for existing username
        const response = await fetch("/api/session");
        if (response.ok) {
          const session = await response.json();
          
          if (session.username && !session.isAnonymous) {
            // Store username in localStorage for Clerk to pick up
            localStorage.setItem("trek_prefill_username", session.username);
            
            // If Clerk signup modal is open, we can prefill it
            // This is a bit tricky - we'll use Clerk's appearance customization
            console.log("Username available for prefill:", session.username);
          }
        }
      } catch (error) {
        console.error("Failed to get session for prefill:", error);
      }
    };

    prefilUsernameInClerk();
  }, [isLoaded, isSignedIn]);

  // Sync user data when authentication state changes
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || hasSynced) return;

    const syncUserData = async () => {
      try {
        console.log("Syncing authenticated user data...");
        
        const response = await fetch("/api/auth/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
          const result = await response.json();
          console.log("User sync successful:", result);
          
          if (result.migrated) {
            console.log("Successfully migrated anonymous user to authenticated");
          }
          
          setHasSynced(true);
        } else {
          console.error("User sync failed:", response.status);
        }
      } catch (error) {
        console.error("Failed to sync user data:", error);
      }
    };

    // Small delay to ensure auth is fully loaded
    const timeoutId = setTimeout(syncUserData, 1000);
    return () => clearTimeout(timeoutId);
  }, [isLoaded, isSignedIn, user, hasSynced]);

  // Reset sync status when user signs out
  useEffect(() => {
    if (isLoaded && !isSignedIn && hasSynced) {
      setHasSynced(false);
    }
  }, [isLoaded, isSignedIn, hasSynced]);

  // This component doesn't render anything visible
  return null;
}