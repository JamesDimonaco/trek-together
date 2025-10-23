"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface TypingIndicatorProps {
  conversationId: string;
  currentUserId?: Id<"users">;
}

export default function TypingIndicator({ conversationId, currentUserId }: TypingIndicatorProps) {
  const typingUsers = useQuery(api.typing.getTypingUsers, {
    conversationId,
    excludeUserId: currentUserId,
  });

  if (!typingUsers || typingUsers.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
      <div className="flex items-center space-x-2">
        {/* Typing dots animation */}
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>

        {/* Typing user names */}
        <span>
          {typingUsers.length === 1 && (
            <span>{typingUsers[0].username} is typing...</span>
          )}
          {typingUsers.length === 2 && (
            <span>{typingUsers[0].username} and {typingUsers[1].username} are typing...</span>
          )}
          {typingUsers.length > 2 && (
            <span>{typingUsers.length} people are typing...</span>
          )}
        </span>
      </div>
    </div>
  );
}
