"use client";

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  liked: boolean;
  count: number;
  onToggle: () => void;
  disabled?: boolean;
}

export default function LikeButton({
  liked,
  count,
  onToggle,
  disabled,
}: LikeButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      disabled={disabled}
      className="gap-1.5 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-colors",
          liked && "fill-red-500 text-red-500"
        )}
      />
      <span className="text-xs">{count}</span>
    </Button>
  );
}
