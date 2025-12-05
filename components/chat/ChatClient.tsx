"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SessionData } from "@/lib/types";
import { Users } from "lucide-react";

import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";
import { analytics } from "@/lib/analytics";

interface ChatClientProps {
  cityId: Id<"cities">;
  cityName: string;
}

export default function ChatClient({ cityId, cityName }: ChatClientProps) {
  const [session, setSession] = useState<SessionData | null>(null);

  // Only use userId for Convex queries if user is authenticated (has valid Convex user ID)
  const hasValidConvexUserId = session?.isAuthenticated && session?.userId;

  // Convex queries and mutations
  const messages = useQuery(
    api.messages.getMessages,
    hasValidConvexUserId
      ? { cityId, currentUserId: session.userId as Id<"users"> }
      : { cityId }
  );
  const activeUsersCount = useQuery(api.users.getActiveCityUsers, { cityId });
  const sendMessage = useMutation(api.messages.sendMessage);
  const updateLastSeen = useMutation(api.users.updateLastSeen);

  // Get session from API
  useEffect(() => {
    fetch("/api/session")
      .then(res => res.json())
      .then(setSession)
      .catch(console.error);
  }, []);

  // Set current city when component mounts
  useEffect(() => {
    const setCurrentCity = async () => {
      try {
        await fetch("/api/set-current-city", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cityId }),
        });
        // Track city joined - cityName is available from props
        analytics.cityJoined(cityId, cityName, "");
      } catch (error) {
        console.error("Failed to set current city:", error);
      }
    };

    setCurrentCity();
  }, [cityId, cityName]);

  // Update lastSeen periodically (every 2 minutes) while user is active
  // Only for authenticated users with valid Convex user IDs
  useEffect(() => {
    if (!hasValidConvexUserId) return;

    // Update immediately when entering chat
    updateLastSeen({ userId: session!.userId as Id<"users"> });

    // Then update every 2 minutes
    const interval = setInterval(() => {
      updateLastSeen({ userId: session!.userId as Id<"users"> });
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(interval);
  }, [hasValidConvexUserId, session, updateLastSeen]);

  const handleSendMessage = async (content: string) => {
    if (!session || !content.trim()) return;

    await sendMessage({
      cityId,
      content: content.trim(),
      userId: hasValidConvexUserId ? session.userId as Id<"users"> : undefined,
      sessionId: session.sessionId,
      username: session.username || "Anonymous",
    });
    analytics.messageSent("city", cityId);
  };

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <>
      {/* User info bar */}
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-300">
            <Users className="h-4 w-4" />
            <span>{activeUsersCount || 0} active</span>
          </div>
          <span className="text-gray-600 dark:text-gray-300">
            {session.username || "Anonymous"}
          </span>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-h-0">
        <MessageList
          messages={messages || []}
          currentSessionId={session.sessionId}
          currentUserId={hasValidConvexUserId ? session.userId as Id<"users"> : undefined}
        />

        <TypingIndicator
          conversationId={cityId}
          currentUserId={hasValidConvexUserId ? session.userId as Id<"users"> : undefined}
        />

        <MessageInput
          onSendMessage={handleSendMessage}
          placeholder={`Message ${cityName} trekkers...`}
          conversationId={cityId}
          currentUserId={hasValidConvexUserId ? session.userId as Id<"users"> : undefined}
          conversationType="city"
        />
      </div>
    </>
  );
}