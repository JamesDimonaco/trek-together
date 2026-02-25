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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { typeLabels, typeColors, difficultyColors, formatPostDate, isHtmlContent } from "@/lib/post-utils";
import DOMPurify from "isomorphic-dompurify";

interface PostDetailProps {
  postId: Id<"posts">;
  cityId: string;
  currentUserId?: Id<"users">;
  isAuthenticated: boolean;
  open: boolean;
  onClose: () => void;
  onAuthPrompt: () => void;
}

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

  const handleConfirmDelete = async () => {
    if (!currentUserId) return;
    try {
      await deletePost({ userId: currentUserId!, postId });
      toast.success("Post deleted");
      onClose();
    } catch {
      toast.error("Failed to delete post");
    }
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

  const htmlContent = isHtmlContent(post.content);

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
              <span>{formatPostDate(post._creationTime)}</span>
              {currentUserId === post.authorId && (
                <div className="ml-auto flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEditDialog(true)}
                    aria-label="Edit post"
                    className="text-gray-500 hover:text-green-600 h-7 px-2"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Delete post"
                        className="text-red-500 hover:text-red-600 h-7 px-2"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete post?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this post and all its comments. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleConfirmDelete}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </DialogHeader>

          {/* Images */}
          {post.imageUrls.length > 0 && (
            <div className="flex gap-2 overflow-x-auto py-2">
              {post.imageUrls.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`View ${post.title} image ${i + 1}`}
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
                </button>
              ))}
            </div>
          )}

          {/* Content */}
          {htmlContent ? (
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
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
