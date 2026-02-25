"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import LikeButton from "@/components/shared/LikeButton";
import { MessageCircle, Star } from "lucide-react";
import Link from "next/link";

interface PostCardProps {
  post: {
    _id: string;
    _creationTime: number;
    title: string;
    content: string;
    type: "trail_report" | "recommendation" | "general";
    difficulty?: "easy" | "moderate" | "hard" | "expert";
    rating?: number;
    author: {
      _id: string;
      username: string;
      avatarUrl?: string;
    } | null;
    likeCount: number;
    commentCount: number;
    hasLiked: boolean;
  };
  cityId: string;
  onLike: () => void;
  onClick: () => void;
  isAuthenticated: boolean;
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
  easy: "bg-green-100 text-green-700",
  moderate: "bg-yellow-100 text-yellow-700",
  hard: "bg-orange-100 text-orange-700",
  expert: "bg-red-100 text-red-700",
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export default function PostCard({
  post,
  cityId,
  onLike,
  onClick,
  isAuthenticated,
  onAuthPrompt,
}: PostCardProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="secondary" className={typeColors[post.type]}>
                {typeLabels[post.type]}
              </Badge>
              {post.difficulty && (
                <Badge variant="secondary" className={difficultyColors[post.difficulty]}>
                  {post.difficulty}
                </Badge>
              )}
              {post.rating && (
                <span className="flex items-center gap-0.5 text-xs text-yellow-500">
                  <Star className="h-3 w-3 fill-yellow-400" />
                  {post.rating}
                </span>
              )}
            </div>
            <h3 className="font-semibold text-sm line-clamp-1">
              <Link
                href={`/chat/${cityId}/posts/${post._id}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:text-green-600 dark:hover:text-green-400"
              >
                {post.title}
              </Link>
            </h3>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-0">
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
          {stripHtml(post.content)}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {post.author?._id ? (
              <Link
                href={`/profile/${post.author._id}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:text-green-600 dark:hover:text-green-400"
              >
                {post.author.username}
              </Link>
            ) : (
              <span className="hover:text-green-600 dark:hover:text-green-400">
                Unknown
              </span>
            )}
            <span>{formatTime(post._creationTime)}</span>
          </div>
          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <LikeButton
              liked={post.hasLiked}
              count={post.likeCount}
              onToggle={() => {
                if (!isAuthenticated) {
                  onAuthPrompt();
                  return;
                }
                onLike();
              }}
            />
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <MessageCircle className="h-3.5 w-3.5" />
              {post.commentCount}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
