"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SessionData } from "@/lib/types";
import { initializeSession } from "@/lib/helpers/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { analytics } from "@/lib/analytics";

interface CreateRequestFormProps {
  cityId: Id<"cities">;
  session: SessionData;
  // Whether this guest already left an email (skips the email field)
  guestHasEmail?: boolean;
  // Optional custom trigger (e.g. a large CTA in the empty state)
  trigger?: React.ReactNode;
}

export default function CreateRequestForm({
  cityId,
  session,
  guestHasEmail = false,
  trigger,
}: CreateRequestFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activityType, setActivityType] = useState<string>("trekking");
  const [email, setEmail] = useState("");
  const [notifyByEmail, setNotifyByEmail] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createRequest = useMutation(api.requests.createRequest);

  const isAuthenticated = session.isAuthenticated && !!session.userId;
  const needsEmail = !isAuthenticated && !guestHasEmail;

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDateFrom("");
    setDateTo("");
    setActivityType("trekking");
    setEmail("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !dateFrom) return;
    if (needsEmail && !email.trim()) return;

    setIsSubmitting(true);
    try {
      const common = {
        cityId,
        title: title.trim(),
        description: description.trim(),
        dateFrom,
        dateTo: dateTo || undefined,
        activityType: activityType as
          | "trekking"
          | "hiking"
          | "climbing"
          | "camping"
          | "other",
      };

      if (isAuthenticated) {
        await createRequest({
          ...common,
          userId: session.userId as Id<"users">,
          notifyByEmail,
        });
      } else {
        // Guests may arrive without a session cookie (e.g. straight from
        // a search result) - initialize one so the request has an owner
        let sessionId: string | undefined = session.sessionId;
        let username: string | undefined = session.username;
        if (!sessionId) {
          const fresh = await initializeSession();
          sessionId = fresh?.sessionId;
          username = fresh?.username;
        }
        if (!sessionId) {
          throw new Error("Could not start a session, please try again");
        }

        await createRequest({
          ...common,
          sessionId,
          username,
          email: email.trim() || undefined,
        });
      }

      analytics.requestCreated(cityId, activityType);
      toast.success(
        needsEmail
          ? "Request posted! We'll email you when someone responds."
          : "Request created!"
      );
      resetForm();
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create request"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="bg-green-600 hover:bg-green-700 gap-1.5">
            <Plus className="h-4 w-4" />
            Post a trek plan
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post your trek plan</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="req-activity">Activity Type</Label>
            <Select
              value={activityType}
              onValueChange={setActivityType}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trekking">Trekking</SelectItem>
                <SelectItem value="hiking">Hiking</SelectItem>
                <SelectItem value="climbing">Climbing</SelectItem>
                <SelectItem value="camping">Camping</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="req-title">Title</Label>
            <Input
              id="req-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Looking for hiking buddies for Inca Trail"
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="req-description">Description</Label>
            <Textarea
              id="req-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your plans, experience level, what you're looking for..."
              rows={4}
              maxLength={2000}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="req-date-from">From</Label>
              <Input
                id="req-date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="req-date-to">To (optional)</Label>
              <Input
                id="req-date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                min={dateFrom}
              />
            </div>
          </div>

          {needsEmail && (
            <div className="space-y-2">
              <Label htmlFor="req-email">Your email</Label>
              <Input
                id="req-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
              <p className="text-xs text-gray-400">
                We&apos;ll email you when someone wants to join — one-click
                unsubscribe, nothing else. No account needed.
              </p>
            </div>
          )}

          {isAuthenticated && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="req-notify"
                checked={notifyByEmail}
                onCheckedChange={(checked) => setNotifyByEmail(checked === true)}
              />
              <Label htmlFor="req-notify" className="text-sm font-normal">
                Email me when someone responds
              </Label>
            </div>
          )}

          <Button
            type="submit"
            disabled={
              isSubmitting ||
              !title.trim() ||
              !description.trim() ||
              !dateFrom ||
              (needsEmail && !email.trim())
            }
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? "Posting..." : "Post trek plan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
