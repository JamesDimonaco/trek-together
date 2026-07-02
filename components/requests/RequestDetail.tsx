"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SessionData } from "@/lib/types";
import { initializeSession } from "@/lib/helpers/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CommentSection from "@/components/shared/CommentSection";
import GuestContactDialog from "./GuestContactDialog";
import {
  Calendar,
  HandHelping,
  Trash2,
  Lock,
  Unlock,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { analytics } from "@/lib/analytics";
import { activityColors, formatDateRange } from "@/lib/request-utils";

interface RequestDetailProps {
  requestId: Id<"requests">;
  cityId: string;
  session: SessionData;
  currentUserId?: Id<"users">;
  guestHasEmail: boolean;
  open: boolean;
  onClose: () => void;
}

export default function RequestDetail({
  requestId,
  cityId,
  session,
  currentUserId,
  guestHasEmail,
  open,
  onClose,
}: RequestDetailProps) {
  // Why the guest email dialog opened: completes that action on submit
  const [contactPurpose, setContactPurpose] = useState<
    "interest" | "comment" | null
  >(null);

  const isAuthenticated = session.isAuthenticated && !!session.userId;
  const canInteract = isAuthenticated || guestHasEmail;

  const request = useQuery(
    api.requests.getRequestById,
    open ? { requestId, currentUserId } : "skip"
  );
  const toggleInterest = useMutation(api.requests.toggleInterest);
  const closeRequest = useMutation(api.requests.closeRequest);
  const reopenRequest = useMutation(api.requests.reopenRequest);
  const addComment = useMutation(api.requests.addRequestComment);
  const deleteComment = useMutation(api.requests.deleteRequestComment);
  const deleteRequest = useMutation(api.requests.deleteRequest);
  const setGuestEmail = useMutation(api.users.setGuestEmail);

  // Resolve identity args for mutations: auth users pass userId, guests
  // pass sessionId (created on the fly if the visitor has no cookie yet)
  const identityArgs = async (): Promise<
    | { userId: Id<"users"> }
    | { sessionId: string; username?: string }
  > => {
    if (isAuthenticated) {
      return { userId: session.userId as Id<"users"> };
    }
    let sessionId: string | undefined = session.sessionId;
    let username: string | undefined = session.username;
    if (!sessionId) {
      const fresh = await initializeSession();
      sessionId = fresh?.sessionId;
      username = fresh?.username;
    }
    if (!sessionId) throw new Error("Could not start a session");
    return { sessionId, username };
  };

  const handleToggleInterest = async (email?: string) => {
    if (!canInteract && !email) {
      setContactPurpose("interest");
      return;
    }
    try {
      const identity = await identityArgs();
      const result = await toggleInterest({ ...identity, email, requestId });
      analytics.requestInterested(requestId as string, result.interested);
      if (result.interested && !isAuthenticated) {
        toast.success("You're in! We'll email you when they reply.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to toggle interest"
      );
    }
  };

  const handleClose = async () => {
    try {
      const identity = await identityArgs();
      await closeRequest({ ...identity, requestId });
      analytics.requestClosed(requestId as string);
      toast.success("Request closed");
    } catch {
      toast.error("Failed to close request");
    }
  };

  const handleReopen = async () => {
    try {
      const identity = await identityArgs();
      await reopenRequest({ ...identity, requestId });
      toast.success("Request reopened");
    } catch {
      toast.error("Failed to reopen request");
    }
  };

  const handleAddComment = async (content: string) => {
    const identity = await identityArgs();
    await addComment({ ...identity, requestId, content });
    analytics.requestCommented(requestId as string);
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const identity = await identityArgs();
      await deleteComment({
        ...identity,
        commentId: commentId as Id<"request_comments">,
      });
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this request?")) return;
    try {
      const identity = await identityArgs();
      await deleteRequest({ ...identity, requestId });
      toast.success("Request deleted");
      onClose();
    } catch {
      toast.error("Failed to delete request");
    }
  };

  if (request === undefined) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogTitle className="sr-only">Loading request</DialogTitle>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (request === null) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogTitle className="sr-only">Request not found</DialogTitle>
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <p className="text-sm text-gray-500">Request not found</p>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const isAuthor = !!currentUserId && currentUserId === request.authorId;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge
              variant="secondary"
              className={activityColors[request.activityType] || activityColors.other}
            >
              {request.activityType}
            </Badge>
            {request.status === "closed" && (
              <Badge variant="secondary" className="bg-gray-200 text-gray-600">
                Closed
              </Badge>
            )}
          </div>
          <DialogTitle className="text-lg">{request.title}</DialogTitle>
          <Link
            href={`/chat/${cityId}/requests/${requestId}`}
            onClick={onClose}
            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-green-600 dark:hover:text-green-400 w-fit"
          >
            <ArrowUpRight className="h-3 w-3" />
            Open full page
          </Link>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {request.author?._id ? (
              <Link
                href={`/profile/${request.author._id}`}
                className="hover:text-green-600 dark:hover:text-green-400 font-medium"
              >
                {request.author.username}
              </Link>
            ) : (
              <span className="hover:text-green-600 dark:hover:text-green-400 font-medium">
                Unknown
              </span>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {formatDateRange(request.dateFrom, request.dateTo)}
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Description */}
        <div className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
          {request.description}
        </div>

        {/* Interest + author actions */}
        <div className="flex items-center gap-2 border-t border-b border-gray-200 dark:border-gray-700 py-2">
          {request.status === "open" && !isAuthor && (
            <Button
              variant={request.hasExpressedInterest ? "default" : "outline"}
              size="sm"
              className={
                request.hasExpressedInterest
                  ? "bg-green-600 hover:bg-green-700 gap-1.5"
                  : "gap-1.5"
              }
              onClick={() => handleToggleInterest()}
            >
              <HandHelping className="h-4 w-4" />
              {request.hasExpressedInterest ? "Interested" : "I'm In"}
            </Button>
          )}

          <span className="text-sm text-gray-500">
            {request.interestCount}{" "}
            {request.interestCount === 1 ? "person" : "people"} interested
          </span>

          {isAuthor && (
            <div className="ml-auto flex gap-1">
              {request.status === "open" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-7 px-2 text-xs gap-1"
                >
                  <Lock className="h-3.5 w-3.5" />
                  Close
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReopen}
                  className="h-7 px-2 text-xs gap-1"
                >
                  <Unlock className="h-3.5 w-3.5" />
                  Reopen
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-7 px-2 text-xs text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Interested users */}
        {request.interestedUsers.length > 0 && (
          <div className="space-y-1">
            <h4 className="text-xs font-medium text-gray-500 uppercase">
              Interested
            </h4>
            <div className="flex flex-wrap gap-2">
              {request.interestedUsers.map(
                (user) =>
                  user && (
                    <Link
                      key={user._id}
                      href={`/profile/${user._id}`}
                      className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full hover:text-green-600"
                    >
                      {user.username}
                    </Link>
                  )
              )}
            </div>
          </div>
        )}

        {/* Comments */}
        <CommentSection
          comments={request.comments}
          currentUserId={currentUserId as string | undefined}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
          isAuthenticated={canInteract}
          onAuthPrompt={() => setContactPurpose("comment")}
          placeholder={
            canInteract ? "Add a comment..." : "Reply — no account needed"
          }
        />

        {/* Guest email capture, then complete the action they started */}
        <GuestContactDialog
          open={contactPurpose !== null}
          onClose={() => setContactPurpose(null)}
          purpose="when someone replies"
          onSubmit={async (email) => {
            if (contactPurpose === "interest") {
              await handleToggleInterest(email);
            } else {
              const identity = await identityArgs();
              if ("sessionId" in identity) {
                await setGuestEmail({ sessionId: identity.sessionId, email });
              }
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
