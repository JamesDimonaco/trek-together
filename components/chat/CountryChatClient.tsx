"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SessionData } from "@/lib/types";

import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";

interface CountryChatClientProps {
  countryId: Id<"countries">;
  countryName: string;
  countrySlug: string;
}

export default function CountryChatClient({
  countryId,
  countryName,
  countrySlug,
}: CountryChatClientProps) {
  const [session, setSession] = useState<SessionData | null>(null);

  // Only use userId for Convex queries if user is authenticated (has valid Convex user ID)
  const hasValidConvexUserId = session?.isAuthenticated && session?.userId;

  // Convex queries and mutations
  const messages = useQuery(
    api.countryMessages.getMessages,
    hasValidConvexUserId
      ? { countryId, currentUserId: session.userId as Id<"users"> }
      : { countryId }
  );
  const activeUsersCount = useQuery(api.countries.getActiveCountryUsers, {
    countryId,
  });
  const sendMessage = useMutation(api.countryMessages.sendMessage);
  const updateLastSeen = useMutation(api.users.updateLastSeen);

  // Get session from API
  useEffect(() => {
    fetch("/api/session")
      .then((res) => res.json())
      .then(setSession)
      .catch(console.error);
  }, []);

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
      countryId,
      content: content.trim(),
      userId: hasValidConvexUserId
        ? (session.userId as Id<"users">)
        : undefined,
      sessionId: session.sessionId,
      username: session.username || "Anonymous",
    });
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
          <span className="text-gray-600 dark:text-gray-300">
            Country Chat
          </span>
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
          currentUserId={
            hasValidConvexUserId ? (session.userId as Id<"users">) : undefined
          }
          messageType="country_message"
        />

        <TypingIndicator
          conversationId={countryId}
          currentUserId={
            hasValidConvexUserId ? (session.userId as Id<"users">) : undefined
          }
        />

        <MessageInput
          onSendMessage={handleSendMessage}
          placeholder={`Message ${countryName} trekkers...`}
          conversationId={countryId}
          currentUserId={
            hasValidConvexUserId ? (session.userId as Id<"users">) : undefined
          }
          conversationType="country"
        />
      </div>
    </>
  );
}
