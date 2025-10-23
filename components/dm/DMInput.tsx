import { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

interface DMInputProps {
  onSendMessage: (content: string) => Promise<void>;
  conversationId?: string;
  currentUserId?: Id<"users">;
}

export default function DMInput({ onSendMessage, conversationId, currentUserId }: DMInputProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setTyping = useMutation(api.typing.setTyping);
  const clearTyping = useMutation(api.typing.clearTyping);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(message);
      setMessage("");

      // Clear typing indicator when sending
      if (conversationId && currentUserId) {
        clearTyping({ userId: currentUserId, conversationId }).catch(console.error);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const formEvent = new Event("submit", { bubbles: true, cancelable: true });
      handleSubmit(formEvent as unknown as React.FormEvent);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setMessage(newValue);

    // Set typing indicator
    if (newValue && conversationId && currentUserId) {
      setTyping({
        userId: currentUserId,
        conversationId,
        conversationType: "dm",
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
    <div className="sticky bottom-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 z-10">
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <Textarea
          value={message}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 min-h-[60px] max-h-[120px] resize-none"
          disabled={isSending}
        />
        <Button
          type="submit"
          disabled={!message.trim() || isSending}
          className="bg-green-600 hover:bg-green-700 self-end"
        >
          {isSending ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Press Enter to send, Shift + Enter for new line
      </p>
    </div>
  );
}
