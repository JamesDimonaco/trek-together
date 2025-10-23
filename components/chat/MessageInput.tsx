import { useState, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>;
  placeholder?: string;
}

export default function MessageInput({
  onSendMessage,
  placeholder,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(message);
      setMessage("");
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

  return (
    <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t p-4 z-10">
      <div className="flex space-x-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
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
