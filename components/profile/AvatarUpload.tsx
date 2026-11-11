"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X } from "lucide-react";
import Image from "next/image";

interface AvatarUploadProps {
  currentAvatar?: string;
  onAvatarChange: (file: File) => void;
}

export default function AvatarUpload({
  currentAvatar,
  onAvatarChange,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentAvatar || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Pass file to parent
    onAvatarChange(file);
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar Preview */}
      <div className="relative">
        <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-lg">
          {preview ? (
            <Image
              src={preview}
              alt="Avatar preview"
              width={128}
              height={128}
              className="object-cover w-full h-full"
              unoptimized={preview.startsWith('data:')}
            />
          ) : (
            <Camera className="h-12 w-12 text-gray-500" />
          )}
        </div>

        {/* Remove Button */}
        {preview && (
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remove photo"
            className="absolute -top-1 -right-1 flex size-11 items-center justify-center rounded-full bg-red-700 text-white shadow-lg transition hover:bg-red-800 sm:size-8"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Upload Button */}
      <div className="flex flex-col items-center space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="avatar-upload"
        />
        <label htmlFor="avatar-upload">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            asChild
          >
            <span>
              <Upload className="h-4 w-4 mr-2" />
              {preview ? "Change photo" : "Upload photo"}
            </span>
          </Button>
        </label>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          JPG, PNG or GIF (max 5MB)
        </p>
      </div>
    </div>
  );
}
