"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LikeButton from "@/components/shared/LikeButton";
import CommentSection from "@/components/shared/CommentSection";
import ImageLightbox from "@/components/shared/ImageLightbox";
import EditPostForm from "./EditPostForm";
import { Star, Trash2, ArrowUpRight, Pencil } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { analytics } from "@/lib/analytics";

interface PostDetailProps {
  postId: Id<"posts">;
  cityId: string;
  currentUserId?: Id<"users">;
  isAuthenticated: boolean;
  open: boolean;
  onClose: () => void;
  onAuthPrompt: () => void;
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
  easy: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  moderate: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  hard: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  expert: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function PostDetail({
  postId,
  cityId,
  currentUserId,
  isAuthenticated,
  open,
  onClose,
  onAuthPrompt,
}: PostDetailProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const post = useQuery(
    api.posts.getPostById,
    open ? { postId, currentUserId } : "skip"
  );
  const likePost = useMutation(api.posts.likePost);
  const addComment = useMutation(api.posts.addPostComment);
  const deleteComment = useMutation(api.posts.deletePostComment);
  const deletePost = useMutation(api.posts.deletePost);

  const handleLike = async () => {
    if (!isAuthenticated || !currentUserId) {
      onAuthPrompt();
      return;
    }
    try {
      const result = await likePost({ userId: currentUserId!, postId });
      analytics.postLiked(postId as string, result.liked);
    } catch {
      toast.error("Failed to like post");
    }
  };

  const handleAddComment = async (content: string) => {
    if (!currentUserId) return;
    try {
      await addComment({ userId: currentUserId!, postId, content });
      analytics.postCommented(postId as string);
    } catch {
      toast.error("Failed to add comment");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUserId) return;
    try {
      await deleteComment({
        userId: currentUserId!,
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
      await deletePost({ userId: currentUserId!, postId });
      toast.success("Post deleted");
      onClose();
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
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogTitle className="sr-only">Loading post</DialogTitle>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (post === null) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogTitle className="sr-only">Post not found</DialogTitle>
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <p className="text-gray-500">Post not found or has been deleted.</p>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Check if content looks like HTML (from rich text editor)
  const isHtmlContent = post.content.includes("<") && post.content.includes(">");

  return (
    <>
      <Dialog open={open && !showEditDialog} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 flex-wrap mb-1">
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
            <DialogTitle className="text-lg">{post.title}</DialogTitle>
            <Link
              href={`/chat/${cityId}/posts/${postId}`}
              onClick={onClose}
              className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-green-600 dark:hover:text-green-400 w-fit"
            >
              <ArrowUpRight className="h-3 w-3" />
              Open full page
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {post.author?._id ? (
                <Link
                  href={`/profile/${post.author._id}`}
                  className="hover:text-green-600 dark:hover:text-green-400 font-medium"
                >
                  {post.author.username}
                </Link>
              ) : (
                <span className="hover:text-green-600 dark:hover:text-green-400 font-medium">
                  Unknown
                </span>
              )}
              <span>{formatDate(post._creationTime)}</span>
              {currentUserId === post.authorId && (
                <div className="ml-auto flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEditDialog(true)}
                    className="text-gray-500 hover:text-green-600 h-7 px-2"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="text-red-500 hover:text-red-600 h-7 px-2"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>

          {/* Images */}
          {post.imageUrls.length > 0 && (
            <div className="flex gap-2 overflow-x-auto py-2">
              {post.imageUrls.map((url, i) => (
                <div
                  key={i}
                  className="relative w-48 h-36 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
                  onClick={() => setLightboxIndex(i)}
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
          {isHtmlContent ? (
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          ) : (
            <div className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
              {post.content}
            </div>
          )}

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
            isAuthenticated={isAuthenticated}
            onAuthPrompt={onAuthPrompt}
          />
        </DialogContent>
      </Dialog>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={post.imageUrls}
          initialIndex={lightboxIndex}
          open={true}
          onClose={() => setLightboxIndex(null)}
          alt={post.title}
        />
      )}

      {showEditDialog && currentUserId && (
        <EditPostForm
          cityId={cityId as Id<"cities">}
          userId={currentUserId}
          post={{
            _id: postId,
            title: post.title,
            content: post.content,
            type: post.type,
            images: post.images,
            imageUrls: post.imageUrls,
            difficulty: post.difficulty,
            rating: post.rating,
          }}
          open={showEditDialog}
          onClose={() => setShowEditDialog(false)}
        />
      )}
    </>
  );
}
