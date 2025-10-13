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
}

export default function MessageList({
  messages,
  currentSessionId,
  currentUserId,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
        <div className="text-center">
          <div className="text-4xl mb-4">🏔️</div>
          <p className="text-gray-500 dark:text-gray-400">
            No messages yet. Start the conversation!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                  messageType="city_message"
                  reportedUserId={message.userId}
                  reporterUserId={currentUserId}
                  reportedUsername={message.username}
                />
              )}
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}