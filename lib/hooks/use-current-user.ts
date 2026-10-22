"use client";

import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";

export function useCurrentUser() {
  const { user, isLoaded } = useUser();
  const convexUser = useQuery(
    api.users.getUserByAuthId,
    user?.id ? { authId: user.id } : "skip"
  );

  return {
    isSignedOut: isLoaded && !user,
    isLoading: !isLoaded || (!!user && convexUser === undefined),
    userId: convexUser?._id,
  };
}
