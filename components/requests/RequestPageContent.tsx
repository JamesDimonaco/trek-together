"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SessionData } from "@/lib/types";
import { initializeSession } from "@/lib/helpers/api";
import { activityColors, formatDateRange } from "@/lib/request-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import CommentSection from "@/components/shared/CommentSection";
import GuestContactDialog from "./GuestContactDialog";
import {
  Calendar,
  HandHelping,
  Trash2,
  Lock,
  Unlock,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { analytics } from "@/lib/analytics";
import { useRouter } from "next/navigation";

interface RequestPageContentProps {
  requestId: string;
  cityId: string;
  session: SessionData;
}

export default function RequestPageContent({
  requestId,
  cityId,
  session,
}: RequestPageContentProps) {
  const router = useRouter();
  const [contactPurpose, setContactPurpose] = useState<
    "interest" | "comment" | null
  >(null);
  // SEO visitors land here with no cookies; initialize a session so guest
  // actions (interest, comments) have an identity to attach to
  const [sessionId, setSessionId] = useState(session.sessionId);
  const [username, setUsername] = useState(session.username);
  useEffect(() => {
    if (!session.sessionId) {
      initializeSession().then((fresh) => {
        if (fresh?.sessionId) {
          setSessionId(fresh.sessionId);
          setUsername(fresh.username);
        }
      });
    }
  }, [session.sessionId]);

  const isAuthenticated = session.isAuthenticated && !!session.userId;

  const guestContact = useQuery(
    api.users.getGuestContact,
    !isAuthenticated && sessionId ? { sessionId } : "skip"
  );

  const currentUserId = isAuthenticated
    ? (session.userId as Id<"users">)
    : guestContact?.userId;
  const canInteract = isAuthenticated || !!guestContact?.hasEmailAddress;

  const request = useQuery(api.requests.getRequestById, {
    requestId: requestId as Id<"requests">,
    currentUserId,
  });

  const toggleInterest = useMutation(api.requests.toggleInterest);
  const closeRequest = useMutation(api.requests.closeRequest);
  const reopenRequest = useMutation(api.requests.reopenRequest);
  const addComment = useMutation(api.requests.addRequestComment);
  const deleteComment = useMutation(api.requests.deleteRequestComment);
  const deleteRequest = useMutation(api.requests.deleteRequest);
  const setGuestEmail = useMutation(api.users.setGuestEmail);

  const identityArgs = ():
    | { userId: Id<"users"> }
    | { sessionId: string; username?: string } => {
    if (isAuthenticated) {
      return { userId: session.userId as Id<"users"> };
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
      const result = await toggleInterest({
        ...identityArgs(),
        email,
        requestId: requestId as Id<"requests">,
      });
      analytics.requestInterested(requestId, result.interested);
      if (result.interested && !isAuthenticated) {
        toast.success("You're in! Confirm your email and we'll tell you when they reply.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to toggle interest"
      );
    }
  };

  const handleClose = async () => {
    try {
      await closeRequest({
        ...identityArgs(),
        requestId: requestId as Id<"requests">,
      });
      analytics.requestClosed(requestId);
      toast.success("Request closed");
    } catch {
      toast.error("Failed to close request");
    }
  };

  const handleReopen = async () => {
    try {
      await reopenRequest({
        ...identityArgs(),
        requestId: requestId as Id<"requests">,
      });
      toast.success("Request reopened");
    } catch {
      toast.error("Failed to reopen request");
    }
  };

  const handleAddComment = async (content: string) => {
    await addComment({
      ...identityArgs(),
      requestId: requestId as Id<"requests">,
      content,
    });
    analytics.requestCommented(requestId);
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment({
        ...identityArgs(),
        commentId: commentId as Id<"request_comments">,
      });
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteRequest({
        ...identityArgs(),
        requestId: requestId as Id<"requests">,
      });
      toast.success("Request deleted");
      router.push(`/chat/${cityId}`);
    } catch {
      toast.error("Failed to delete request");
    }
  };

  if (request === undefined) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (request === null) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-4">
        <p className="text-sm text-gray-500">Request not found or has been deleted.</p>
        <Button variant="outline" asChild>
          <Link href={`/chat/${cityId}`}>Back to city</Link>
        </Button>
      </div>
    );
  }

  const isAuthor = currentUserId === request.authorId;

  return (
    <>
      <div className="space-y-4">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
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

        {/* Title */}
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {request.title}
        </h1>

        {/* Author + dates */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {request.author?._id ? (
            <Link
              href={`/profile/${request.author._id}`}
              className="hover:text-green-600 dark:hover:text-green-400 font-medium"
            >
              {request.author.username}
            </Link>
          ) : (
            <span className="font-medium">Unknown</span>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDateRange(request.dateFrom, request.dateTo)}</span>
          </div>
        </div>

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
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete request?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this request and all its comments. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleConfirmDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
      </div>

      {/* Guest email capture, then complete the action they started */}
      <GuestContactDialog
        open={contactPurpose !== null}
        onClose={() => setContactPurpose(null)}
        purpose="when someone replies"
        onSubmit={async (email) => {
          if (contactPurpose === "interest") {
            await handleToggleInterest(email);
          } else if (sessionId) {
            await setGuestEmail({ sessionId, email });
          }
        }}
      />
    </>
  );
}
