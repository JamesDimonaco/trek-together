"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function MessagesClient() {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const [convexUserId, setConvexUserId] = useState<Id<"users"> | null>(null);

  const currentUser = useQuery(
    api.users.getUserByAuthId,
    clerkUser?.id ? { authId: clerkUser.id } : "skip"
  );

  const conversations = useQuery(
    api.dms.getUserConversations,
    convexUserId ? { userId: convexUserId } : "skip"
  );

  useEffect(() => {
    if (currentUser?._id) {
      setConvexUserId(currentUser._id);
    }
  }, [currentUser]);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !clerkUser) {
      router.push("/sign-in");
    }
  }, [isLoaded, clerkUser, router]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 168) {
      // Less than a week
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const truncateMessage = (content: string, maxLength: number = 60) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  if (!isLoaded || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b sticky top-0 z-10">
          <div className="px-4 py-4 flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-xl font-semibold">Messages</h1>
          </div>
        </div>

        {/* Conversations List */}
        <div className="p-4 space-y-2">
          {!conversations || conversations.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Start a conversation by visiting a user&apos;s profile
                </p>
                <Button asChild>
                  <Link href="/">Browse Cities</Link>
                </Button>
              </div>
            </Card>
          ) : (
            conversations.map((conversation) => {
              const partner = conversation.partner as {
                _id: Id<"users">;
                username: string;
                avatarUrl?: string;
              };

              return (
                <Link
                  key={partner._id}
                  href={`/dm/${partner._id}`}
                  className="block"
                >
                  <Card className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {partner.avatarUrl ? (
                          <Image
                            src={partner.avatarUrl}
                            alt={partner.username}
                            width={48}
                            height={48}
                            className="rounded-full"
                            unoptimized
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <span className="text-green-600 dark:text-green-300 font-medium text-lg">
                              {partner.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2 mb-1">
                          <h3 className="font-medium truncate">
                            {partner.username}
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                            {formatTime(conversation.lastMessageTime)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {conversation.lastMessage.senderId === convexUserId
                            ? "You: "
                            : ""}
                          {truncateMessage(conversation.lastMessage.content)}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
