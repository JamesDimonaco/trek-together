"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SessionData } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LikeButton from "@/components/shared/LikeButton";
import CommentSection from "@/components/shared/CommentSection";
import AuthPromptModal from "@/components/dm/AuthPromptModal";
import { Star, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { analytics } from "@/lib/analytics";
import { useRouter } from "next/navigation";

interface PostPageContentProps {
  postId: string;
  cityId: string;
}

const typeLabels = {
  trail_report: "Trail Report",
  recommendation: "Recommendation",
  general: "General",
};

const typeColors = {
  trail_report: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  recommendation: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  general: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const difficultyColors = {
  easy: "bg-green-100 text-green-700",
  moderate: "bg-yellow-100 text-yellow-700",
  hard: "bg-orange-100 text-orange-700",
  expert: "bg-red-100 text-red-700",
};

export default function PostPageContent({ postId, cityId }: PostPageContentProps) {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  useEffect(() => {
    fetch("/api/session")
      .then((res) => res.json())
      .then(setSession)
      .catch(() => setSession(null));
  }, []);

  const hasValidConvexUserId = session?.isAuthenticated && session?.userId;
  const currentUserId = hasValidConvexUserId
    ? (session.userId as Id<"users">)
    : undefined;

  const post = useQuery(api.posts.getPostById, {
    postId: postId as Id<"posts">,
    currentUserId,
  });

  const likePost = useMutation(api.posts.likePost);
  const addComment = useMutation(api.posts.addPostComment);
  const deleteComment = useMutation(api.posts.deletePostComment);
  const deletePost = useMutation(api.posts.deletePost);

  const handleLike = async () => {
    if (!hasValidConvexUserId || !currentUserId) {
      setShowAuthPrompt(true);
      return;
    }
    try {
      const result = await likePost({ userId: currentUserId, postId: postId as Id<"posts"> });
      analytics.postLiked(postId, result.liked);
    } catch {
      toast.error("Failed to like post");
    }
  };

  const handleAddComment = async (content: string) => {
    if (!currentUserId) return;
    try {
      await addComment({ userId: currentUserId, postId: postId as Id<"posts">, content });
      analytics.postCommented(postId);
    } catch {
      toast.error("Failed to add comment");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUserId) return;
    try {
      await deleteComment({
        userId: currentUserId,
        commentId: commentId as Id<"post_comments">,
      });
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  const handleDelete = async () => {
    if (!currentUserId) return;
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await deletePost({ userId: currentUserId, postId: postId as Id<"posts"> });
      toast.success("Post deleted");
      router.push(`/chat/${cityId}`);
    } catch {
      toast.error("Failed to delete post");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (post === undefined) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (post === null) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-4">
        <p className="text-gray-500">Post not found or has been deleted.</p>
        <Button variant="outline" asChild>
          <Link href={`/chat/${cityId}`}>Back to city</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className={typeColors[post.type]}>
            {typeLabels[post.type]}
          </Badge>
          {post.difficulty && (
            <Badge variant="secondary" className={difficultyColors[post.difficulty]}>
              {post.difficulty}
            </Badge>
          )}
          {post.rating && (
            <span className="flex items-center gap-0.5 text-sm text-yellow-500">
              <Star className="h-4 w-4 fill-yellow-400" />
              {post.rating}/5
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {post.title}
        </h1>

        {/* Author + date */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {post.author?._id ? (
            <Link
              href={`/profile/${post.author._id}`}
              className="hover:text-green-600 dark:hover:text-green-400 font-medium"
            >
              {post.author.username}
            </Link>
          ) : (
            <span className="font-medium">Unknown</span>
          )}
          <span>{formatDate(post._creationTime)}</span>
          {currentUserId === post.authorId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="ml-auto text-red-500 hover:text-red-600 h-7 px-2"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Images */}
        {post.imageUrls.length > 0 && (
          <div className="flex gap-2 overflow-x-auto py-2">
            {post.imageUrls.map((url, i) => (
              <div
                key={i}
                className="relative w-48 h-36 rounded-lg overflow-hidden flex-shrink-0"
              >
                <Image
                  src={url}
                  alt={`${post.title} image ${i + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
          {post.content}
        </div>

        {/* Like */}
        <div className="flex items-center border-t border-b border-gray-200 dark:border-gray-700 py-1">
          <LikeButton
            liked={post.hasLiked}
            count={post.likeCount}
            onToggle={handleLike}
          />
        </div>

        {/* Comments */}
        <CommentSection
          comments={post.comments}
          currentUserId={currentUserId as string | undefined}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
          isAuthenticated={!!hasValidConvexUserId}
          onAuthPrompt={() => setShowAuthPrompt(true)}
        />
      </div>

      <AuthPromptModal
        isOpen={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
      />
    </>
  );
}
