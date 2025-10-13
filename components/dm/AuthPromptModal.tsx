"use client";

import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Lock, X } from "lucide-react";

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthPromptModal({
  isOpen,
  onClose,
}: AuthPromptModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X className="h-5 w-5" />
        </button>

        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Lock className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle>Sign In Required</CardTitle>
          <CardDescription>
            You need to be signed in to send direct messages and connect with
            other trekkers
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <SignInButton mode="modal">
            <Button className="w-full bg-green-600 hover:bg-green-700">
              Sign In to Continue
            </Button>
          </SignInButton>
          <Button variant="outline" onClick={onClose} className="w-full">
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
