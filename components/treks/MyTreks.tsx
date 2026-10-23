"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { Loader2, Plus } from "lucide-react";
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

  if (isLoading || !userId || treks === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Treks</h1>
        <Button asChild className="gap-1.5 bg-green-600 hover:bg-green-700">
          <Link href="/my-treks/new">
            <Plus className="h-4 w-4" />
            Log a trek
          </Link>
        </Button>
      </div>

      {treks.length === 0 ? (
        <p className="py-12 text-center text-gray-500 dark:text-gray-400">
          Your logbook is empty. Log your first trek to start it.
        </p>
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
