"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SessionData } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RequestCard from "./RequestCard";
import RequestDetail from "./RequestDetail";
import CreateRequestForm from "./CreateRequestForm";
import AuthPromptModal from "@/components/dm/AuthPromptModal";
import { HandHelping } from "lucide-react";
import { toast } from "sonner";
import { analytics } from "@/lib/analytics";

interface RequestsListProps {
  cityId: Id<"cities">;
  session: SessionData;
}

export default function RequestsList({ cityId, session }: RequestsListProps) {
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [selectedRequestId, setSelectedRequestId] = useState<Id<"requests"> | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const hasValidConvexUserId = session.isAuthenticated && session.userId;

  const requests = useQuery(api.requests.getRequestsByCity, {
    cityId,
    currentUserId: hasValidConvexUserId
      ? (session.userId as Id<"users">)
      : undefined,
    statusFilter: statusFilter as "open" | "closed",
  });

  const toggleInterest = useMutation(api.requests.toggleInterest);

  const handleToggleInterest = async (requestId: Id<"requests">) => {
    if (!hasValidConvexUserId) {
      setShowAuthPrompt(true);
      return;
    }
    try {
      const result = await toggleInterest({ userId: session.userId as Id<"users">, requestId });
      analytics.requestInterested(requestId as string, result.interested);
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

        {hasValidConvexUserId && (
          <CreateRequestForm cityId={cityId} userId={session.userId as Id<"users">} />
        )}
      </div>

      {/* Requests list */}
      {requests === undefined ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <HandHelping className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            No {statusFilter} requests
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {statusFilter === "open"
              ? "Create a request to find trek buddies!"
              : "No closed requests yet."}
          </p>
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
              isAuthenticated={!!hasValidConvexUserId}
              onAuthPrompt={() => setShowAuthPrompt(true)}
            />
          ))}
        </div>
      )}

      {/* Request detail dialog */}
      {selectedRequestId && (
        <RequestDetail
          requestId={selectedRequestId}
          cityId={cityId as string}
          currentUserId={
            hasValidConvexUserId ? (session.userId as Id<"users">) : undefined
          }
          isAuthenticated={!!hasValidConvexUserId}
          open={!!selectedRequestId}
          onClose={() => setSelectedRequestId(null)}
          onAuthPrompt={() => setShowAuthPrompt(true)}
        />
      )}

      {/* Auth prompt */}
      <AuthPromptModal
        isOpen={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
      />
    </div>
  );
}
