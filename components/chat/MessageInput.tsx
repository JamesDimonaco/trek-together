import { useState, KeyboardEvent, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>;
  placeholder?: string;
  conversationId?: string;
  currentUserId?: Id<"users">;
  conversationType?: "city" | "dm";
}

export default function MessageInput({
  onSendMessage,
  placeholder,
  conversationId,
  currentUserId,
  conversationType = "city",
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setTyping = useMutation(api.typing.setTyping);
  const clearTyping = useMutation(api.typing.clearTyping);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(message);
      setMessage("");

      // Clear typing indicator when sending
      if (conversationId && currentUserId) {
        clearTyping({ userId: currentUserId, conversationId }).catch(console.error);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setMessage(newValue);

    // Set typing indicator
    if (newValue && conversationId && currentUserId) {
      setTyping({
        userId: currentUserId,
        conversationId,
        conversationType,
      }).catch(console.error);

      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to clear typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        if (conversationId && currentUserId) {
          clearTyping({ userId: currentUserId, conversationId }).catch(console.error);
        }
      }, 3000);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (conversationId && currentUserId) {
        clearTyping({ userId: currentUserId, conversationId }).catch(console.error);
      }
    };
  }, [conversationId, currentUserId, clearTyping]);

  return (
    <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t p-4 z-10">
      <div className="flex space-x-2">
        <Input
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          placeholder={placeholder || "Type a message..."}
          disabled={isSending}
          className="flex-1"
          maxLength={500}
        />

        <Button
          onClick={handleSend}
          disabled={!message.trim() || isSending}
          className="bg-green-600 hover:bg-green-700"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
