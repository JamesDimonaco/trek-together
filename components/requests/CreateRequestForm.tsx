"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
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
  userId: Id<"users">;
}

export default function CreateRequestForm({
  cityId,
  userId,
}: CreateRequestFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activityType, setActivityType] = useState<string>("trekking");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createRequest = useMutation(api.requests.createRequest);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDateFrom("");
    setDateTo("");
    setActivityType("trekking");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !dateFrom) return;

    setIsSubmitting(true);
    try {
      await createRequest({
        userId,
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
      });

      analytics.requestCreated(cityId, activityType);
      toast.success("Request created!");
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
        <Button size="sm" className="bg-green-600 hover:bg-green-700 gap-1.5">
          <Plus className="h-4 w-4" />
          New Request
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Find Trek Buddies</DialogTitle>
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

          <Button
            type="submit"
            disabled={
              isSubmitting || !title.trim() || !description.trim() || !dateFrom
            }
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? "Creating..." : "Create Request"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
