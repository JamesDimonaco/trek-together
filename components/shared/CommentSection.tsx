"use client";

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
  onAddComment: (content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  isAuthenticated: boolean;
  onAuthPrompt: () => void;
}

export default function CommentSection({
  comments,
  currentUserId,
  onAddComment,
  onDeleteComment,
  isAuthenticated,
  onAuthPrompt,
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
    } catch {
      toast.error("Failed to add comment");
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
    return date.toLocaleDateString();
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
                  <Link
                    href={`/profile/${comment.author?._id}`}
                    className="font-medium text-gray-900 dark:text-gray-100 hover:text-green-600 dark:hover:text-green-400"
                  >
                    {comment.author?.username || "Unknown"}
                  </Link>
                  <span className="text-xs text-gray-400">
                    {formatTime(comment._creationTime)}
                  </span>
                  {currentUserId === comment.authorId && (
                    <button
                      onClick={() => onDeleteComment(comment._id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
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
            isAuthenticated ? "Add a comment..." : "Sign in to comment"
          }
          className="min-h-[36px] h-9 resize-none text-sm"
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
          className="bg-green-600 hover:bg-green-700 h-9 px-3"
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
