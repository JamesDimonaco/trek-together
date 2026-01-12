"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { captureError } from "@/lib/analytics";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
    // Capture to PostHog for monitoring
    captureError(error, {
      source: "error_boundary",
      extra: {
        digest: error.digest,
        url: typeof window !== "undefined" ? window.location.href : undefined,
      },
    });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="max-w-md w-full p-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-gray-600 dark:text-gray-400">
              We encountered an unexpected error. Please try again.
            </p>
          </div>

          {error.message && (
            <div className="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm text-left">
              <p className="font-mono text-xs break-words">{error.message}</p>
            </div>
          )}

          <div className="flex gap-3 w-full">
            <Button
              onClick={() => window.location.href = "/"}
              variant="outline"
              className="flex-1"
            >
              Go Home
            </Button>
            <Button onClick={reset} className="flex-1">
              Try Again
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
