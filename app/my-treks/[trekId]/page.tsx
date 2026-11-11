"use client";

import LoadingState from "@/components/shared/LoadingState";
import { use, useEffect } from "react";
import { notFound, useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import TrekManager from "@/components/treks/TrekManager";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

export default function MyTrekPage({ params }: { params: Promise<{ trekId: string }> }) {
  const { trekId } = use(params);
  const router = useRouter();
  const { isSignedOut, isLoading, userId } = useCurrentUser();

  useEffect(() => {
    if (isSignedOut) router.push("/sign-in");
  }, [isSignedOut, router]);

  if (isLoading || !userId) {
    return (
      <LoadingState className="min-h-[60vh]" />
    );
  }

  if (!/^[0-9a-z]{28,34}$/i.test(trekId)) notFound();

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      <TrekManager userId={userId} trekId={trekId as Id<"treks">} />
    </div>
  );
}
