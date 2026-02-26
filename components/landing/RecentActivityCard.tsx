"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import Link from "next/link";
import { typeLabels, typeColors, stripHtml, isHtmlContent } from "@/lib/post-utils";
import { activityColors } from "@/lib/request-utils";

interface PostItem {
  itemType: "post";
  _id: string;
  _creationTime: number;
  cityId: string;
  title: string;
  content: string;
  type: "trail_report" | "recommendation" | "general";
  author: { _id: string; username: string; avatarUrl?: string } | null;
  city: { _id: string; name: string; country: string } | null;
}

interface RequestItem {
  itemType: "request";
  _id: string;
  _creationTime: number;
  cityId: string;
  title: string;
  description: string;
  activityType: string;
  author: { _id: string; username: string; avatarUrl?: string } | null;
  city: { _id: string; name: string; country: string } | null;
}

type RecentActivityCardProps = {
  item: PostItem | RequestItem;
};

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function RecentActivityCard({ item }: RecentActivityCardProps) {
  const href =
    item.itemType === "post"
      ? `/chat/${item.cityId}/posts/${item._id}`
      : `/chat/${item.cityId}/requests/${item._id}`;

  const preview =
    item.itemType === "post"
      ? isHtmlContent(item.content)
        ? stripHtml(item.content)
        : item.content
      : item.description;

  return (
    <Link href={href} className="block flex-shrink-0 w-[280px] snap-start">
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="px-4 py-3 h-full flex flex-col">
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            {item.itemType === "post" ? (
              <Badge
                variant="secondary"
                className={`text-xs ${typeColors[item.type]}`}
              >
                {typeLabels[item.type]}
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className={`text-xs ${activityColors[item.activityType] || activityColors.other}`}
              >
                {item.activityType}
              </Badge>
            )}
          </div>

          <h3 className="font-semibold text-sm line-clamp-2 mb-1">
            {item.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-auto">
            {preview}
          </p>

          <div className="flex items-center justify-between text-xs text-gray-400 mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-1 min-w-0 truncate">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {item.city?.name ?? "Unknown"}
              </span>
              {item.author && (
                <>
                  <span className="mx-1">·</span>
                  <span className="truncate">{item.author.username}</span>
                </>
              )}
            </div>
            <span className="flex-shrink-0 ml-2">{timeAgo(item._creationTime)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
