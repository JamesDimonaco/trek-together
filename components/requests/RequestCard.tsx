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
import { activityColors, formatDateRange } from "@/lib/request-utils";

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
  cityId: string;
  // Parent decides what interest means for guests (email capture first)
  onToggleInterest: () => void;
  onClick: () => void;
}

export default function RequestCard({
  request,
  cityId,
  onToggleInterest,
  onClick,
}: RequestCardProps) {
  return (
    <Card
      className="cursor-pointer gap-2 hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge
                variant="secondary"
                className={`capitalize ${activityColors[request.activityType] || activityColors.other}`}
              >
                {request.activityType}
              </Badge>
              {request.status === "closed" && (
                <Badge variant="secondary" className="bg-gray-200 text-gray-600">
                  Closed
                </Badge>
              )}
            </div>
            <h2 className="text-lg font-semibold leading-snug line-clamp-2">
              <Link
                href={`/chat/${cityId}/requests/${request._id}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:text-green-800 dark:hover:text-green-400"
              >
                {request.title}
              </Link>
            </h2>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
          {request.description}
        </p>

        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatDateRange(request.dateFrom, request.dateTo)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {request.author?._id ? (
              <Link
                href={`/profile/${request.author._id}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:text-green-800 dark:hover:text-green-400"
              >
                {request.author.username}
              </Link>
            ) : (
              <span className="hover:text-green-800 dark:hover:text-green-400">
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
                className="gap-1"
                onClick={onToggleInterest}
              >
                <HandHelping className="h-3.5 w-3.5" />
                {request.hasExpressedInterest ? "Interested" : "I'm in"}
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
