"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import CommentSection from "@/components/shared/CommentSection";
import AuthPromptModal from "@/components/dm/AuthPromptModal";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

// Client-side so the statically cached trek page stays valid as the thread changes.
export default function TrekComments({ trekId }: { trekId: Id<"treks"> }) {
  const { userId, isLoading } = useCurrentUser();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const trek = useQuery(api.treks.getTrek, isLoading ? "skip" : { trekId, viewerId: userId });
  const addComment = useMutation(api.treks.addTrekComment);
  const deleteComment = useMutation(api.treks.deleteTrekComment);

  if (!trek) return null;

  // Errors propagate so CommentSection keeps the draft and shows the reason.
  const handleAddComment = async (content: string) => {
    if (!userId) return;
    await addComment({ userId, trekId, content });
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!userId) return;
    try {
      await deleteComment({ userId, commentId: commentId as Id<"trek_comments"> });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete comment");
    }
  };

  return (
    <section className="space-y-3">
      <h2 className="font-semibold text-gray-900 dark:text-white">
        Comments{trek.comments.length > 0 && ` (${trek.comments.length})`}
      </h2>
      <CommentSection
        comments={trek.comments}
        currentUserId={userId}
        canDeleteAny={trek.userId === userId}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
        isAuthenticated={!!userId}
        onAuthPrompt={() => setShowAuthPrompt(true)}
        placeholder={userId ? "Ask a question or add a trail update..." : undefined}
      />
      <AuthPromptModal isOpen={showAuthPrompt} onClose={() => setShowAuthPrompt(false)} />
    </section>
  );
}
