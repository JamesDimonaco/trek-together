import { useEffect, useRef } from "react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";
import MessageActions from "./MessageActions";

interface Message {
  _id: string;
  _creationTime: number;
  sessionId?: string;
  userId?: Id<"users">;
  username: string;
  content: string;
}

interface MessageListProps {
  messages: Message[];
  currentSessionId: string;
  currentUserId?: Id<"users">;
  messageType?: "city_message" | "dm" | "country_message";
  // When set, the empty state offers a jump to the Requests tab
  onShowRequests?: () => void;
}

export default function MessageList({
  messages,
  currentSessionId,
  currentUserId,
  messageType = "city_message",
  onShowRequests,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  // Check if user is near bottom before new messages arrive
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    const threshold = 100; // pixels from bottom
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    isNearBottomRef.current = isNearBottom;
  };

  // Only auto-scroll if user was already near the bottom
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isNearBottomRef.current) return;

    container.scrollTop = container.scrollHeight;
  }, [messages]);

  const isOwnMessage = (message: Message) => {
    return message.sessionId === currentSessionId;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!messages?.length) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className="text-4xl">🏔️</div>
          <p className="text-gray-500 dark:text-gray-400">
            No messages yet. Start the conversation!
          </p>
          {onShowRequests && (
            <div className="space-y-1">
              <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs mx-auto">
                Chat is quiet when nobody&apos;s online — trek plans stick
                around and get answered later.
              </p>
              <button
                onClick={onShowRequests}
                className="text-sm text-green-600 dark:text-green-400 hover:underline font-medium"
              >
                See trek plans instead →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 space-y-3"
    >
      {messages.map((message) => {
        const isOwn = isOwnMessage(message);
        const canShowActions = !isOwn && message.userId && currentUserId;

        return (
          <div
            key={message._id}
            className={`flex group ${isOwn ? "justify-end" : "justify-start"}`}
          >
            <div className="flex items-start gap-2">
              <div
                className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                  isOwn
                    ? "bg-green-600 text-white"
                    : "bg-white dark:bg-gray-700 border"
                }`}
              >
                {!isOwn && (
                  <div className="text-xs font-medium mb-1 opacity-70">
                    {message.userId ? (
                      <Link
                        href={`/profile/${message.userId}`}
                        className="hover:underline cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {message.username}
                      </Link>
                    ) : (
                      <span>{message.username}</span>
                    )}
                  </div>
                )}
                <div className="text-sm">{message.content}</div>
                <div className="text-xs mt-1 opacity-70">
                  {formatTime(message._creationTime)}
                </div>
              </div>

              {canShowActions && message.userId && (
                <MessageActions
                  messageId={message._id}
                  messageType={messageType}
                  reportedUserId={message.userId}
                  reporterUserId={currentUserId}
                  reportedUsername={message.username}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}