"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, Maximize2, Minimize2 } from "lucide-react";
import { toast } from "sonner";
import PostImageUpload from "./PostImageUpload";
import PostEditor from "./PostEditor";
import { analytics } from "@/lib/analytics";
import { stripHtml } from "@/lib/post-utils";

interface EditPostFormProps {
  cityId: Id<"cities">;
  userId: Id<"users">;
  post: {
    _id: Id<"posts">;
    title: string;
    content: string;
    type: "trail_report" | "recommendation" | "general";
    images: string[];
    imageUrls: string[];
    difficulty?: "easy" | "moderate" | "hard" | "expert";
    rating?: number;
  };
  open: boolean;
  onClose: () => void;
}

export default function EditPostForm({
  cityId,
  userId,
  post,
  open,
  onClose,
}: EditPostFormProps) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [type, setType] = useState<"trail_report" | "recommendation" | "general">(post.type);
  const [difficulty, setDifficulty] = useState<string>(post.difficulty ?? "");
  const [rating, setRating] = useState<number>(post.rating ?? 0);
  const [images, setImages] = useState<string[]>(post.images);
  const [imageUrls, setImageUrls] = useState<string[]>(post.imageUrls);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updatePost = useMutation(api.posts.updatePost);

  // Reset form when a different post is loaded
  useEffect(() => {
    setTitle(post.title);
    setContent(post.content);
    setType(post.type);
    setDifficulty(post.difficulty ?? "");
    setRating(post.rating ?? 0);
    setImages(post.images);
    setImageUrls(post.imageUrls);
  }, [post._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTypeChange = (newType: typeof type) => {
    setType(newType);
    if (newType !== "trail_report" && newType !== "recommendation") {
      setDifficulty("");
      setRating(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!stripHtml(content).length) {
      toast.error("Content is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePost({
        userId,
        postId: post._id,
        title: title.trim(),
        content: content.trim(),
        type,
        images,
        difficulty: difficulty
          ? (difficulty as "easy" | "moderate" | "hard" | "expert")
          : undefined,
        rating: rating > 0 ? rating : undefined,
      });

      analytics.postEdited(post._id as string);
      toast.success("Post updated!");
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update post"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={expanded ? "sm:max-w-4xl w-[90vw] h-[90vh] flex flex-col" : "max-w-lg max-h-[90vh] overflow-y-auto"}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Edit Post</DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? "Collapse editor" : "Expand editor"}
              className="h-7 w-7 p-0"
            >
              {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className={expanded ? "space-y-4 flex-1 flex flex-col min-h-0 overflow-y-auto" : "space-y-4"}>
          <div className="space-y-2">
            <Label htmlFor="edit-post-type">Type</Label>
            <Select value={type} onValueChange={(v) => handleTypeChange(v as typeof type)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="trail_report">Trail Report</SelectItem>
                <SelectItem value="recommendation">Recommendation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-post-title">Title</Label>
            <Input
              id="edit-post-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Your post title..."
              maxLength={200}
            />
          </div>

          <div className={expanded ? "space-y-2 flex-1 flex flex-col min-h-0" : "space-y-2"}>
            <Label>Content</Label>
            <div className={expanded ? "flex-1 min-h-0 [&_.tiptap]:min-h-full [&_.tiptap]:h-full overflow-y-auto" : ""}>
              <PostEditor
                content={content}
                onChange={setContent}
                placeholder="Share your experience, tips, or recommendations..."
              />
            </div>
          </div>

          {(type === "trail_report" || type === "recommendation") && (
            <>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Rating</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(rating === star ? 0 : star)}
                      aria-label={`Rate ${star} star${star === 1 ? "" : "s"}`}
                      className="p-0.5"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          star <= rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <PostImageUpload
            images={images}
            imageUrls={imageUrls}
            onImagesChange={(ids, urls) => {
              setImages(ids);
              setImageUrls(urls);
            }}
          />

          <Button
            type="submit"
            disabled={isSubmitting || !title.trim() || !stripHtml(content).length}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? "Updating..." : "Update Post"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
