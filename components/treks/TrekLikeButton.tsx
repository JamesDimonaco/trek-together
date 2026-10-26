"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import LikeButton from "@/components/shared/LikeButton";
import AuthPromptModal from "@/components/dm/AuthPromptModal";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

// Client-side so the statically cached trek page stays valid as the count changes.
export default function TrekLikeButton({ trekId }: { trekId: Id<"treks"> }) {
  const { userId, isLoading } = useCurrentUser();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [pending, setPending] = useState(false);
  const trek = useQuery(api.treks.getTrek, isLoading ? "skip" : { trekId, viewerId: userId });
  const toggleLike = useMutation(api.treks.toggleTrekLike);

  if (!trek) return null;

  const handleToggle = async () => {
    if (!userId) {
      setShowAuthPrompt(true);
      return;
    }
    setPending(true);
    try {
      await toggleLike({ userId, trekId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update like");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <LikeButton
        liked={trek.hasLiked}
        count={trek.likeCount}
        onToggle={handleToggle}
        disabled={pending}
      />
      <AuthPromptModal isOpen={showAuthPrompt} onClose={() => setShowAuthPrompt(false)} />
    </>
  );
}
