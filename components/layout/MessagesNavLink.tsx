"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Mail } from "lucide-react";
import Link from "next/link";

export default function MessagesNavLink() {
  // Get unread count for authenticated user (returns 0 if not authenticated)
  const unreadCount = useQuery(api.dms.getTotalUnreadCount);

  return (
    <Link
      href="/messages"
      className="flex items-center justify-center relative h-9 w-9 sm:w-auto px-0 sm:px-3 rounded-md hover:bg-accent transition-colors"
      aria-label="Messages"
    >
      <Mail className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-1" aria-hidden="true" />
      <span className="hidden sm:inline">Messages</span>
      {unreadCount !== undefined && unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 sm:top-0 sm:right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
