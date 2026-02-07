"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface PostImageUploadProps {
  images: string[]; // storage IDs
  imageUrls: string[]; // preview URLs
  onImagesChange: (images: string[], urls: string[]) => void;
  maxImages?: number;
}

export default function PostImageUpload({
  images,
  imageUrls,
  onImagesChange,
  maxImages = 5,
}: PostImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remaining);

    setIsUploading(true);
    try {
      const newIds: string[] = [];
      const newUrls: string[] = [];

      for (const file of filesToUpload) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 5MB)`);
          continue;
        }

        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image`);
          continue;
        }

        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!result.ok) {
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { storageId } = await result.json();
        newIds.push(storageId);
        newUrls.push(URL.createObjectURL(file));
      }

      onImagesChange([...images, ...newIds], [...imageUrls, ...newUrls]);
    } catch {
      toast.error("Failed to upload images");
    } finally {
      setIsUploading(false);
      // Reset file input
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newUrls = imageUrls.filter((_, i) => i !== index);
    onImagesChange(newImages, newUrls);
  };

  return (
    <div className="space-y-2">
      {imageUrls.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {imageUrls.map((url, index) => (
            <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden">
              <Image
                src={url}
                alt={`Upload ${index + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 text-white hover:bg-black/80"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length < maxImages && (
        <div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
            id="post-image-upload"
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => document.getElementById("post-image-upload")?.click()}
            disabled={isUploading}
            className="gap-1.5"
          >
            <ImagePlus className="h-4 w-4" />
            {isUploading ? "Uploading..." : `Add Images (${images.length}/${maxImages})`}
          </Button>
        </div>
      )}
    </div>
  );
}
