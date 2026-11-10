"use client";

import { formatPostDate } from "@/lib/post-utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Send } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface CommentAuthor {
  _id: string;
  username: string;
  avatarUrl?: string;
}

interface Comment {
  _id: string;
  content: string;
  _creationTime: number;
  author: CommentAuthor | null;
  authorId: string;
}

interface CommentSectionProps {
  comments: Comment[];
  currentUserId?: string;
  // Lets a page owner remove any comment, not only their own
  canDeleteAny?: boolean;
  onAddComment: (content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  // Whether the user can comment directly (auth user, or guest with contact)
  isAuthenticated: boolean;
  onAuthPrompt: () => void;
  placeholder?: string;
}

export default function CommentSection({
  comments,
  currentUserId,
  canDeleteAny = false,
  onAddComment,
  onDeleteComment,
  isAuthenticated,
  onAuthPrompt,
  placeholder,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      onAuthPrompt();
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatPostDate(date.getTime());
  };

  return (
    <div className="space-y-3">
      {/* Comment list */}
      {comments.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {comments.map((comment) => (
            <div
              key={comment._id}
              className="flex gap-2 text-sm group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {comment.author?._id ? (
                    <Link
                      href={`/profile/${comment.author._id}`}
                      className="font-medium text-gray-900 dark:text-gray-100 hover:text-green-800 dark:hover:text-green-400"
                    >
                      {comment.author.username}
                    </Link>
                  ) : (
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      Unknown
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {formatTime(comment._creationTime)}
                  </span>
                  {(canDeleteAny || currentUserId === comment.authorId) && (
                    <button
                      onClick={() => onDeleteComment(comment._id)}
                      aria-label="Delete comment"
                      // Always visible on touch screens; revealed on hover or focus where a mouse exists.
                      className="-my-3 flex size-11 items-center justify-center text-gray-500 transition-opacity hover:text-red-700 focus-visible:opacity-100 sm:-my-1 sm:size-6 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-300 break-words">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add comment */}
      <div className="flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={
            placeholder ??
            (isAuthenticated ? "Add a comment..." : "Sign in to comment")
          }
          aria-label="Comment"
          className="min-h-11 h-11 sm:min-h-9 sm:h-9 resize-none text-sm"
          onFocus={() => {
            if (!isAuthenticated) onAuthPrompt();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={isSubmitting || !newComment.trim()}
          className="px-3"
          aria-label="Post comment"
        >
          <Send className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
