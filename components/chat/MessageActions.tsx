"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MoreVertical, Flag, Ban } from "lucide-react";

interface MessageActionsProps {
  messageId: string;
  messageType: "city_message" | "dm";
  reportedUserId: Id<"users">;
  reporterUserId: Id<"users">;
  reportedUsername: string;
  onBlock?: () => void;
}

export default function MessageActions({
  messageId,
  messageType,
  reportedUserId,
  reporterUserId,
  reportedUsername,
  onBlock,
}: MessageActionsProps) {
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("spam");
  const [reportDescription, setReportDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportUser = useMutation(api.safety.reportUser);
  const blockUser = useMutation(api.safety.blockUser);

  const handleReport = async () => {
    if (!reportReason.trim()) {
      toast.error("Please select a reason");
      return;
    }

    setIsSubmitting(true);
    try {
      await reportUser({
        reporterId: reporterUserId,
        reportedUserId,
        messageId,
        messageType,
        reason: reportReason,
        description: reportDescription.trim() || undefined,
      });

      toast.success("Report submitted successfully");
      setReportDialogOpen(false);
      setReportReason("spam");
      setReportDescription("");
    } catch (error) {
      console.error("Report error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlock = async () => {
    setIsSubmitting(true);
    try {
      await blockUser({
        blockerId: reporterUserId,
        blockedId: reportedUserId,
        reason: "Blocked from message actions",
      });

      toast.success(`Blocked ${reportedUsername}`);
      setBlockDialogOpen(false);
      onBlock?.();
    } catch (error) {
      console.error("Block error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to block user");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setReportDialogOpen(true)}>
            <Flag className="h-4 w-4 mr-2" />
            Report
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setBlockDialogOpen(true)}>
            <Ban className="h-4 w-4 mr-2" />
            Block {reportedUsername}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report User</DialogTitle>
            <DialogDescription>
              Report {reportedUsername} for violating community guidelines
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <select
                id="reason"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="spam">Spam</option>
                <option value="harassment">Harassment</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="scam">Scam or fraud</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Additional details (optional)</Label>
              <Textarea
                id="description"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Provide more context about this report..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReportDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleReport} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block Confirmation Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block {reportedUsername}?</DialogTitle>
            <DialogDescription>
              You won&apos;t see messages from {reportedUsername} anymore. You can unblock them later from your settings.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBlockDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlock}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Blocking..." : "Block User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
