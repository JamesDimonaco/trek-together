"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SessionData } from "@/lib/types";

import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";
import { analytics } from "@/lib/analytics";

interface ChatClientProps {
  cityId: Id<"cities">;
  cityName: string;
  session: SessionData;
}

export default function ChatClient({ cityId, cityName, session }: ChatClientProps) {
  const hasValidConvexUserId = session.isAuthenticated && session.userId;

  const messages = useQuery(
    api.messages.getMessages,
    hasValidConvexUserId
      ? { cityId, currentUserId: session.userId as Id<"users"> }
      : { cityId }
  );
  const sendMessage = useMutation(api.messages.sendMessage);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    await sendMessage({
      cityId,
      content: content.trim(),
      userId: hasValidConvexUserId ? (session.userId as Id<"users">) : undefined,
      sessionId: session.sessionId,
      username: session.username || "Anonymous",
    });
    analytics.messageSent("city", cityId);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <MessageList
        messages={messages || []}
        currentSessionId={session.sessionId}
        currentUserId={
          hasValidConvexUserId ? (session.userId as Id<"users">) : undefined
        }
      />

      <TypingIndicator
        conversationId={cityId}
        currentUserId={
          hasValidConvexUserId ? (session.userId as Id<"users">) : undefined
        }
      />

      <MessageInput
        onSendMessage={handleSendMessage}
        placeholder={`Message ${cityName} trekkers...`}
        conversationId={cityId}
        currentUserId={
          hasValidConvexUserId ? (session.userId as Id<"users">) : undefined
        }
        conversationType="city"
      />
    </div>
  );
}
