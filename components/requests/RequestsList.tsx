"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SessionData } from "@/lib/types";
import { initializeSession } from "@/lib/helpers/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import RequestCard from "./RequestCard";
import RequestDetail from "./RequestDetail";
import CreateRequestForm from "./CreateRequestForm";
import GuestContactDialog from "./GuestContactDialog";
import GlobalRequestsStrip from "./GlobalRequestsStrip";
import { HandHelping, Plus } from "lucide-react";
import { toast } from "sonner";
import { analytics } from "@/lib/analytics";

interface RequestsListProps {
  cityId: Id<"cities">;
  session: SessionData;
}

export default function RequestsList({ cityId, session }: RequestsListProps) {
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [selectedRequestId, setSelectedRequestId] = useState<Id<"requests"> | null>(null);
  const [pendingInterestId, setPendingInterestId] = useState<Id<"requests"> | null>(null);

  const isAuthenticated = session.isAuthenticated && !!session.userId;

  // Guests get a Convex user row lazily; look it up so interest state and
  // block filtering work for them too
  const guestContact = useQuery(
    api.users.getGuestContact,
    !isAuthenticated && session.sessionId
      ? { sessionId: session.sessionId }
      : "skip"
  );

  const currentUserId = isAuthenticated
    ? (session.userId as Id<"users">)
    : guestContact?.userId;

  const requests = useQuery(api.requests.getRequestsByCity, {
    cityId,
    currentUserId,
    statusFilter: statusFilter as "open" | "closed",
  });

  const toggleInterest = useMutation(api.requests.toggleInterest);

  const submitInterest = async (
    requestId: Id<"requests">,
    email?: string
  ) => {
    if (isAuthenticated) {
      const result = await toggleInterest({
        userId: session.userId as Id<"users">,
        requestId,
      });
      analytics.requestInterested(requestId as string, result.interested);
      return;
    }

    let sessionId: string | undefined = session.sessionId;
    let username: string | undefined = session.username;
    if (!sessionId) {
      const fresh = await initializeSession();
      sessionId = fresh?.sessionId;
      username = fresh?.username;
    }
    if (!sessionId) throw new Error("Could not start a session");

    const result = await toggleInterest({
      sessionId,
      username,
      email,
      requestId,
    });
    analytics.requestInterested(requestId as string, result.interested);
    if (result.interested) {
      toast.success("You're in! Confirm your email and we'll tell you when they reply.");
    }
  };

  const handleToggleInterest = async (requestId: Id<"requests">) => {
    // Guests without a stored email give one first, so the author's reply
    // can actually reach them
    if (!isAuthenticated && !guestContact?.hasEmailAddress) {
      setPendingInterestId(requestId);
      return;
    }
    try {
      await submitInterest(requestId);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to toggle interest"
      );
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header with filter and create button */}
      <div className="flex items-center justify-between gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        <CreateRequestForm
          cityId={cityId}
          session={session}
          guestHasEmail={!!guestContact?.hasEmailAddress}
        />
      </div>

      {/* Requests list */}
      {requests === undefined ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <HandHelping className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {statusFilter === "open"
                ? "No trek plans here yet"
                : "No closed requests yet."}
            </h3>
            {statusFilter === "open" && (
              <>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 max-w-xs">
                  Post yours — it stays up while you&apos;re away, and
                  we&apos;ll email you when someone wants to join.
                </p>
                <CreateRequestForm
                  cityId={cityId}
                  session={session}
                  guestHasEmail={!!guestContact?.hasEmailAddress}
                  trigger={
                    <Button className="mt-4 bg-green-600 hover:bg-green-700 gap-1.5">
                      <Plus className="h-4 w-4" />
                      Post your trek plan
                    </Button>
                  }
                />
              </>
            )}
          </div>

          {/* The local room may be empty, but the network isn't */}
          {statusFilter === "open" && (
            <GlobalRequestsStrip excludeCityId={cityId as string} />
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <RequestCard
              key={request._id}
              request={request}
              cityId={cityId as string}
              onToggleInterest={() =>
                handleToggleInterest(request._id as Id<"requests">)
              }
              onClick={() =>
                setSelectedRequestId(request._id as Id<"requests">)
              }
            />
          ))}
        </div>
      )}

      {/* Request detail dialog */}
      {selectedRequestId && (
        <RequestDetail
          requestId={selectedRequestId}
          cityId={cityId as string}
          session={session}
          currentUserId={currentUserId}
          guestHasEmail={!!guestContact?.hasEmailAddress}
          open={!!selectedRequestId}
          onClose={() => setSelectedRequestId(null)}
        />
      )}

      {/* Guest email capture before expressing interest */}
      <GuestContactDialog
        open={!!pendingInterestId}
        onClose={() => setPendingInterestId(null)}
        purpose="when they reply"
        onSubmit={async (email) => {
          if (pendingInterestId) {
            await submitInterest(pendingInterestId, email);
          }
        }}
      />
    </div>
  );
}
