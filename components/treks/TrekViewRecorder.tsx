"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

// Renders nothing, so the statically cached trek page stays valid.
export default function TrekViewRecorder({ trekId }: { trekId: Id<"treks"> }) {
  const { userId, isLoading } = useCurrentUser();
  const recordView = useMutation(api.treks.recordTrekView);
  const recorded = useRef(false);

  useEffect(() => {
    // The ref stops strict mode's double effect run from firing twice.
    if (isLoading || !userId || recorded.current) return;
    recorded.current = true;
    // A failed view record is not the reader's problem; never surface it.
    recordView({ userId, trekId }).catch(() => {});
  }, [isLoading, userId, trekId, recordView]);

  return null;
}
