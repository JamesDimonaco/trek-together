"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, User } from "lucide-react";
import Link from "next/link";
import DMMessageList from "./DMMessageList";
import DMInput from "./DMInput";
import AuthPromptModal from "./AuthPromptModal";

interface DMChatProps {
  receiverId: string;
}

export default function DMChat({ receiverId }: DMChatProps) {
  const router = useRouter();
  const { userId: authUserId, isLoaded } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Get current user's Convex ID
  const currentUser = useQuery(
    api.users.getUserByAuthId,
    authUserId ? { authId: authUserId } : "skip"
  );

  // Validate receiverId format before querying
  const isValidReceiverId = receiverId && /^[0-9a-z]{28,34}$/i.test(receiverId);

  // Get receiver's profile
  const receiver = useQuery(
    api.users.getUserById,
    isValidReceiverId ? { userId: receiverId as Id<"users"> } : "skip"
  );

  // Get conversation messages
  const messages = useQuery(
    api.dms.getConversation,
    currentUser && receiver
      ? {
          userId1: currentUser._id,
          userId2: receiver._id,
        }
      : "skip"
  );

  const sendDM = useMutation(api.dms.sendDM);

  // Check auth on mount
  useEffect(() => {
    if (isLoaded && !authUserId) {
      setShowAuthModal(true);
    }
  }, [isLoaded, authUserId]);

  const handleSendMessage = async (content: string) => {
    if (!currentUser || !receiver || !content.trim()) return;

    await sendDM({
      senderId: currentUser._id,
      receiverId: receiver._id,
      content: content.trim(),
    });
  };

  // Loading state
  if (!isLoaded || currentUser === undefined || receiver === undefined) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Not authenticated - show modal only
  if (!authUserId || !currentUser) {
    return (
      <AuthPromptModal
        isOpen={showAuthModal}
        onClose={() => router.push("/")}
      />
    );
  }

  // Invalid receiver ID or receiver not found or is guest
  if (!isValidReceiverId || !receiver || !receiver.authId) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center space-y-4">
            <User className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <h2 className="text-xl font-semibold mb-2">User Not Available</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This user cannot receive direct messages
              </p>
              <Button onClick={() => router.back()} variant="outline">
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <Link
            href={`/profile/${receiver._id}`}
            className="flex items-center space-x-3 hover:opacity-80 transition"
          >
            {/* Avatar */}
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              {receiver.avatarUrl ? (
                <img
                  src={receiver.avatarUrl}
                  alt={receiver.username}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-green-600 dark:text-green-400" />
              )}
            </div>

            <div>
              <h1 className="font-semibold text-gray-900 dark:text-white">
                {receiver.username}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Direct Message
              </p>
            </div>
          </Link>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <DMMessageList
          messages={messages || []}
          currentUserId={currentUser._id}
          receiver={receiver}
        />

        <DMInput onSendMessage={handleSendMessage} />
      </div>
    </>
  );
}
