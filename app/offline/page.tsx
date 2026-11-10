"use client";

import { WifiOff, Mountain } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <Mountain className="h-8 w-8 text-green-700 dark:text-green-400" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          You&apos;re Offline
        </h1>
        <div className="flex items-center justify-center gap-2 text-gray-500 mb-4">
          <WifiOff className="h-5 w-5" />
          <span>No internet connection</span>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          It looks like you&apos;re out on the trail without a signal. TrekTogether
          needs an internet connection to load chats and messages.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 bg-primary hover:bg-green-800 text-primary-foreground rounded-lg transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
