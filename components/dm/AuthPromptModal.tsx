"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Shown wherever a guest tries something that needs an account (messages, comments, likes).
export default function AuthPromptModal({ isOpen, onClose }: AuthPromptModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md text-center">
        <DialogHeader className="items-center sm:text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <Lock className="h-6 w-6 text-primary dark:text-green-400" aria-hidden="true" />
          </div>
          <DialogTitle>Sign in to continue</DialogTitle>
          <DialogDescription>
            You need an account to message, comment and connect with other trekkers.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button className="w-full" asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">
            Not now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
