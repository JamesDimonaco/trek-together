"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import NewTrekForm from "@/components/treks/NewTrekForm";
import { useCurrentUser } from "@/lib/hooks/use-current-user";

export default function NewTrekPage() {
  const router = useRouter();
  const { isSignedOut, isLoading, userId } = useCurrentUser();

  useEffect(() => {
    if (isSignedOut) router.push("/sign-in");
  }, [isSignedOut, router]);

  if (isLoading || !userId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Log a trek</h1>
      <NewTrekForm userId={userId} />
    </div>
  );
}
