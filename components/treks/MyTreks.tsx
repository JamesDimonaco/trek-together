"use client";

import EmptyState from "@/components/shared/EmptyState";
import LoadingState from "@/components/shared/LoadingState";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { Mountain, Plus } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import TrekCard from "@/components/treks/TrekCard";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

// Shared by the signed-in home page and /my-treks.
export default function MyTreks() {
  const router = useRouter();
  const { isSignedOut, isLoading, userId } = useCurrentUser();
  const treks = useQuery(
    api.treks.getUserTreks,
    userId ? { userId, viewerId: userId } : "skip"
  );

  useEffect(() => {
    if (isSignedOut) router.push("/sign-in");
  }, [isSignedOut, router]);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My treks</h1>
        <Button asChild className="gap-1.5">
          <Link href="/my-treks/new">
            <Plus className="h-4 w-4" />
            Log a trek
          </Link>
        </Button>
      </div>

      {isLoading || !userId || treks === undefined ? (
        <LoadingState className="min-h-[40vh]" />
      ) : treks.length === 0 ? (
        <EmptyState
          icon={Mountain}
          title="Your logbook is empty"
          description="Log a trek to keep its days, distance, notes and photos in one place."
          action={
            <Button asChild>
              <Link href="/my-treks/new">Log your first trek</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {treks.map((trek) => (
            <TrekCard key={trek._id} href={`/my-treks/${trek._id}`} trek={trek} />
          ))}
        </div>
      )}
    </div>
  );
}
