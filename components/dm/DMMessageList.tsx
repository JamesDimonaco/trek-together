import { useEffect, useRef } from "react";
import { Id } from "@/convex/_generated/dataModel";
import MessageActions from "../chat/MessageActions";

interface Message {
  _id: Id<"dms">;
  _creationTime: number;
  senderId: Id<"users">;
  receiverId: Id<"users">;
  content: string;
}

interface Receiver {
  _id: Id<"users">;
  username: string;
  avatarUrl?: string;
}

interface DMMessageListProps {
  messages: Message[];
  currentUserId: Id<"users">;
  receiver: Receiver;
}

export default function DMMessageList({
  messages,
  currentUserId,
  receiver,
}: DMMessageListProps) {
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
    return message.senderId === currentUserId;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!messages?.length) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">💬</div>
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            No messages yet
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Send a message to {receiver.username} to start the conversation
          </p>
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
                <div className="text-sm break-words">{message.content}</div>
                <div className="text-xs mt-1 opacity-70">
                  {formatTime(message._creationTime)}
                </div>
              </div>

              {!isOwn && (
                <MessageActions
                  messageId={message._id}
                  messageType="dm"
                  reportedUserId={message.senderId}
                  reporterUserId={currentUserId}
                  reportedUsername={receiver.username}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
