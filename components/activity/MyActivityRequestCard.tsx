"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MessageCircle, Users, MapPin } from "lucide-react";
import Link from "next/link";
import { activityColors, formatDateRange } from "@/lib/request-utils";
import { timeAgo } from "@/lib/time-utils";

interface MyActivityRequestCardProps {
  request: {
    _id: string;
    _creationTime: number;
    cityId: string;
    title: string;
    description: string;
    dateFrom: string;
    dateTo?: string;
    activityType: string;
    status: "open" | "closed";
    city: { _id: string; name: string; country: string } | null;
    interestCount: number;
    commentCount: number;
  };
}

export default function MyActivityRequestCard({
  request,
}: MyActivityRequestCardProps) {
  return (
    <Link href={`/chat/${request.cityId}/requests/${request._id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="px-4 py-3">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {request.city && (
              <Badge variant="outline" className="text-xs gap-1">
                <MapPin className="h-3 w-3" />
                {request.city.name}
              </Badge>
            )}
            <Badge
              variant="secondary"
              className={`text-xs ${activityColors[request.activityType] || activityColors.other}`}
            >
              {request.activityType}
            </Badge>
            {request.status === "closed" && (
              <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-600">
                Closed
              </Badge>
            )}
          </div>

          <h3 className="font-semibold text-sm line-clamp-1 mb-1">
            {request.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-2">
            {request.description}
          </p>

          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDateRange(request.dateFrom, request.dateTo)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span>{timeAgo(request._creationTime)}</span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {request.interestCount}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {request.commentCount}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
