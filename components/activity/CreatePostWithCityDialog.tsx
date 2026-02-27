"use client";

import { useState } from "react";
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
import { Plus, Star } from "lucide-react";
import { toast } from "sonner";
import PostEditor from "@/components/posts/PostEditor";
import PostImageUpload from "@/components/posts/PostImageUpload";
import CitySelector from "./CitySelector";
import { analytics } from "@/lib/analytics";
import { stripHtml } from "@/lib/post-utils";

interface CreatePostWithCityDialogProps {
  userId: Id<"users">;
}

export default function CreatePostWithCityDialog({
  userId,
}: CreatePostWithCityDialogProps) {
  const [open, setOpen] = useState(false);
  const [cityId, setCityId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<
    "trail_report" | "recommendation" | "general"
  >("general");
  const [difficulty, setDifficulty] = useState<string>("");
  const [rating, setRating] = useState<number>(0);
  const [images, setImages] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createPost = useMutation(api.posts.createPost);

  const handleTypeChange = (newType: typeof type) => {
    setType(newType);
    if (newType !== "trail_report" && newType !== "recommendation") {
      setDifficulty("");
      setRating(0);
    }
  };

  const resetForm = () => {
    setCityId("");
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
    if (!cityId) {
      toast.error("Please select a city");
      return;
    }
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
      await createPost({
        userId,
        cityId: cityId as Id<"cities">,
        title: title.trim(),
        content: content.trim(),
        type,
        images,
        difficulty: difficulty
          ? (difficulty as "easy" | "moderate" | "hard" | "expert")
          : undefined,
        rating: rating > 0 ? rating : undefined,
      });

      analytics.postCreated(cityId as Id<"cities">, type);
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a Post</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <CitySelector
            userId={userId}
            value={cityId}
            onValueChange={setCityId}
          />

          <div className="space-y-2">
            <Label htmlFor="post-type-activity">Type</Label>
            <Select
              value={type}
              onValueChange={(v) => handleTypeChange(v as typeof type)}
            >
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
            <Label htmlFor="post-title-activity">Title</Label>
            <Input
              id="post-title-activity"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Your post title..."
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <PostEditor
              content={content}
              onChange={setContent}
              placeholder="Share your experience, tips, or recommendations..."
            />
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
            disabled={
              isSubmitting ||
              !cityId ||
              !title.trim() ||
              !stripHtml(content).length
            }
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? "Creating..." : "Create Post"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
