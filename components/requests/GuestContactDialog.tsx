"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail } from "lucide-react";
import Link from "next/link";

interface GuestContactDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (email: string) => Promise<void>;
  // What the email will be used for, e.g. "when someone replies"
  purpose?: string;
}

// Asks a guest for an email so an async match can complete without an account.
// This is the moment intent becomes reachable - keep it one field, one promise.
export default function GuestContactDialog({
  open,
  onClose,
  onSubmit,
  purpose = "when someone replies",
}: GuestContactDialogProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setError("");
    try {
      await onSubmit(email.trim());
      setEmail("");
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong, try again"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-green-600" />
            Where should replies go?
          </DialogTitle>
          <DialogDescription>
            No account needed. We&apos;ll email you {purpose} — one-click
            unsubscribe, nothing else.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="guest-email">Email</Label>
            <Input
              id="guest-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
              required
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !email.trim()}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? "Saving..." : "Notify me"}
          </Button>

          <p className="text-xs text-center text-gray-400">
            Prefer an account?{" "}
            <Link href="/sign-up" className="text-green-600 hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
