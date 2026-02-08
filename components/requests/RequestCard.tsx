"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MessageCircle,
  HandHelping,
  Users,
} from "lucide-react";
import Link from "next/link";

interface RequestCardProps {
  request: {
    _id: string;
    _creationTime: number;
    title: string;
    description: string;
    dateFrom: string;
    dateTo?: string;
    activityType: string;
    status: "open" | "closed";
    author: {
      _id: string;
      username: string;
      avatarUrl?: string;
    } | null;
    interestCount: number;
    commentCount: number;
    hasExpressedInterest: boolean;
  };
  onToggleInterest: () => void;
  onClick: () => void;
  isAuthenticated: boolean;
  onAuthPrompt: () => void;
}

const activityColors: Record<string, string> = {
  trekking: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  hiking: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  climbing: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  camping: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

function formatDateRange(from: string, to?: string) {
  const fromDate = new Date(from + "T00:00:00");
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };

  if (!to) return fromDate.toLocaleDateString("en-US", options);

  const toDate = new Date(to + "T00:00:00");
  return `${fromDate.toLocaleDateString("en-US", options)} – ${toDate.toLocaleDateString("en-US", options)}`;
}

export default function RequestCard({
  request,
  onToggleInterest,
  onClick,
  isAuthenticated,
  onAuthPrompt,
}: RequestCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge
                variant="secondary"
                className={activityColors[request.activityType] || activityColors.other}
              >
                {request.activityType}
              </Badge>
              {request.status === "closed" && (
                <Badge variant="secondary" className="bg-gray-200 text-gray-600">
                  Closed
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-sm line-clamp-1">
              {request.title}
            </h3>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-0">
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
          {request.description}
        </p>

        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatDateRange(request.dateFrom, request.dateTo)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {request.author?._id ? (
              <Link
                href={`/profile/${request.author._id}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:text-green-600 dark:hover:text-green-400"
              >
                {request.author.username}
              </Link>
            ) : (
              <span className="hover:text-green-600 dark:hover:text-green-400">
                Unknown
              </span>
            )}
          </div>
          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {request.status === "open" && (
              <Button
                variant={request.hasExpressedInterest ? "default" : "outline"}
                size="sm"
                className={
                  request.hasExpressedInterest
                    ? "bg-green-600 hover:bg-green-700 h-7 text-xs gap-1"
                    : "h-7 text-xs gap-1"
                }
                onClick={() => {
                  if (!isAuthenticated) {
                    onAuthPrompt();
                    return;
                  }
                  onToggleInterest();
                }}
              >
                <HandHelping className="h-3.5 w-3.5" />
                {request.hasExpressedInterest ? "Interested" : "I'm In"}
              </Button>
            )}
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Users className="h-3.5 w-3.5" />
              {request.interestCount}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <MessageCircle className="h-3.5 w-3.5" />
              {request.commentCount}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
