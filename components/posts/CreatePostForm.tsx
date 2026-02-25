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
  DialogTrigger,
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
import { Plus, Star, Maximize2, Minimize2 } from "lucide-react";
import { toast } from "sonner";
import PostImageUpload from "./PostImageUpload";
import PostEditor from "./PostEditor";
import { analytics } from "@/lib/analytics";

interface CreatePostFormProps {
  cityId: Id<"cities">;
  userId: Id<"users">;
}

export default function CreatePostForm({ cityId, userId }: CreatePostFormProps) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"trail_report" | "recommendation" | "general">("general");
  const [difficulty, setDifficulty] = useState<string>("");
  const [rating, setRating] = useState<number>(0);
  const [images, setImages] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createPost = useMutation(api.posts.createPost);

  // Clear difficulty and rating when type changes away from trail_report/recommendation
  useEffect(() => {
    if (type !== "trail_report" && type !== "recommendation") {
      setDifficulty("");
      setRating(0);
    }
  }, [type]);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setType("general");
    setDifficulty("");
    setRating(0);
    setImages([]);
    setImageUrls([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      await createPost({
        userId,
        cityId,
        title: title.trim(),
        content: content.trim(),
        type,
        images,
        difficulty: difficulty
          ? (difficulty as "easy" | "moderate" | "hard" | "expert")
          : undefined,
        rating: rating > 0 ? rating : undefined,
      });

      analytics.postCreated(cityId, type);
      toast.success("Post created!");
      resetForm();
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create post"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-green-600 hover:bg-green-700 gap-1.5">
          <Plus className="h-4 w-4" />
          New Post
        </Button>
      </DialogTrigger>
      <DialogContent className={expanded ? "sm:max-w-4xl w-[90vw] h-[90vh] flex flex-col" : "max-w-lg max-h-[90vh] overflow-y-auto"}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Create a Post</DialogTitle>
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
            <Label htmlFor="post-type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
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
            <Label htmlFor="post-title">Title</Label>
            <Input
              id="post-title"
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
            disabled={isSubmitting || !title.trim() || !content.trim()}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? "Creating..." : "Create Post"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
