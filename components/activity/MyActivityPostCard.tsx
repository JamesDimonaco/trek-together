"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageCircle, MapPin } from "lucide-react";
import Link from "next/link";
import { typeLabels, typeColors, stripHtml, isHtmlContent } from "@/lib/post-utils";
import { timeAgo } from "@/lib/time-utils";
import { analytics } from "@/lib/analytics";

interface MyActivityPostCardProps {
  post: {
    _id: string;
    _creationTime: number;
    cityId: string;
    title: string;
    content: string;
    type: "trail_report" | "recommendation" | "general";
    city: { _id: string; name: string; country: string } | null;
    likeCount: number;
    commentCount: number;
  };
}

export default function MyActivityPostCard({ post }: MyActivityPostCardProps) {
  const preview = isHtmlContent(post.content)
    ? stripHtml(post.content)
    : post.content;

  return (
    <Link
      href={`/chat/${post.cityId}/posts/${post._id}`}
      onClick={() => analytics.activityCardClicked("post", post._id, post.cityId)}
    >
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="px-4 py-3">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {post.city && (
              <Badge variant="outline" className="text-xs gap-1">
                <MapPin className="h-3 w-3" />
                {post.city.name}
              </Badge>
            )}
            <Badge
              variant="secondary"
              className={`text-xs ${typeColors[post.type]}`}
            >
              {typeLabels[post.type]}
            </Badge>
          </div>

          <h3 className="font-semibold text-sm line-clamp-1 mb-1">
            {post.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">
            {preview}
          </p>

          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{timeAgo(post._creationTime)}</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {post.likeCount}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {post.commentCount}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
