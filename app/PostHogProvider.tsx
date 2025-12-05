"use client";

import { useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import posthog from "posthog-js";

export function PostHogIdentifier() {
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();

  useEffect(() => {
    // Only run if PostHog is loaded and auth state is ready
    if (!userLoaded || !authLoaded || !posthog.__loaded) return;

    if (isSignedIn && user) {
      // Identify authenticated users
      posthog.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        username: user.username,
        name: user.fullName,
        created_at: user.createdAt,
      });
    } else {
      // Reset for anonymous users
      posthog.reset();
    }
  }, [user, isSignedIn, userLoaded, authLoaded]);

  return null;
}
