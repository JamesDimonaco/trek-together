"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SessionData } from "@/lib/types";

import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";
import GuestContactDialog from "@/components/requests/GuestContactDialog";
import { analytics } from "@/lib/analytics";
import { toast } from "sonner";

interface ChatClientProps {
  cityId: Id<"cities">;
  cityName: string;
  session: SessionData;
  onShowRequests?: () => void;
}

export default function ChatClient({ cityId, cityName, session, onShowRequests }: ChatClientProps) {
  const hasValidConvexUserId = session.isAuthenticated && session.userId;

  const messages = useQuery(
    api.messages.getMessages,
    hasValidConvexUserId
      ? { cityId, currentUserId: session.userId as Id<"users"> }
      : { cityId }
  );
  const sendMessage = useMutation(api.messages.sendMessage);

  // A guest posting into a quiet room is the whole cold-start problem: without an
  // email they never learn that someone answered days later. Ask once per session,
  // after they have already posted, so it never blocks the message itself.
  const guestContact = useQuery(
    api.users.getGuestContact,
    !session.isAuthenticated && session.sessionId
      ? { sessionId: session.sessionId }
      : "skip"
  );
  const setGuestEmail = useMutation(api.users.setGuestEmail);
  const [askForEmail, setAskForEmail] = useState(false);
  const [alreadyAsked, setAlreadyAsked] = useState(false);
  const [hasPosted, setHasPosted] = useState(false);

  // Watch the query rather than reading it inside the send handler. A guest has
  // no users row until their first message creates one, so the handler's closure
  // still holds null at that point - which is exactly the person we need to ask.
  useEffect(() => {
    if (
      hasPosted &&
      !alreadyAsked &&
      !session.isAuthenticated &&
      session.sessionId &&
      guestContact &&
      !guestContact.hasEmailAddress
    ) {
      setAlreadyAsked(true);
      setAskForEmail(true);
    }
  }, [hasPosted, alreadyAsked, guestContact, session]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    try {
      await sendMessage({
        cityId,
        content: content.trim(),
        userId: hasValidConvexUserId ? (session.userId as Id<"users">) : undefined,
        sessionId: session.sessionId,
        username: session.username || "Anonymous",
      });
      analytics.messageSent("city", cityId);
      setHasPosted(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send message"
      );
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <MessageList
        messages={messages || []}
        currentSessionId={session.sessionId}
        currentUserId={
          hasValidConvexUserId ? (session.userId as Id<"users">) : undefined
        }
        onShowRequests={onShowRequests}
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

      <GuestContactDialog
        open={askForEmail}
        onClose={() => setAskForEmail(false)}
        purpose={`when someone replies in ${cityName}`}
        onSubmit={async (email) => {
          if (!session.sessionId) return;
          await setGuestEmail({ sessionId: session.sessionId, email });
          toast.success("Check your inbox to confirm - then we'll email you replies");
        }}
      />
    </div>
  );
}
