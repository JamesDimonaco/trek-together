"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function DebugUsersPage() {
  const duplicateAuthIds = useQuery(api.users.findDuplicateAuthIds);
  const orphanedGuests = useQuery(api.users.findOrphanedGuestUsers);
  const allUsers = useQuery(api.users.searchUsers, { searchTerm: "" });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          User Debug Dashboard
        </h1>

        {/* Duplicate AuthIds */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Duplicate Auth IDs
          </h2>
          {!duplicateAuthIds && <p className="text-gray-500">Loading...</p>}
          {duplicateAuthIds && duplicateAuthIds.length === 0 && (
            <p className="text-green-600 dark:text-green-400">
              ✓ No duplicate auth IDs found
            </p>
          )}
          {duplicateAuthIds && duplicateAuthIds.length > 0 && (
            <div>
              <p className="text-red-600 dark:text-red-400 mb-2">
                ⚠ Found {duplicateAuthIds.length} duplicate auth IDs:
              </p>
              <ul className="list-disc list-inside space-y-1">
                {duplicateAuthIds.map((dup) => (
                  <li key={dup.authId} className="text-sm text-gray-700 dark:text-gray-300">
                    Auth ID: {dup.authId} (Count: {dup.count})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Orphaned Guest Users */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Orphaned Guest Users (30+ days inactive)
          </h2>
          {!orphanedGuests && <p className="text-gray-500">Loading...</p>}
          {orphanedGuests && (
            <div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Total orphaned guests: {orphanedGuests.count}
              </p>
              {orphanedGuests.users.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Sample (first 10):
                  </p>
                  <div className="space-y-2">
                    {orphanedGuests.users.map((user) => (
                      <div
                        key={user._id}
                        className="text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700"
                      >
                        <div className="font-mono text-xs text-gray-500 mb-1">
                          ID: {user._id}
                        </div>
                        <div>Username: {user.username}</div>
                        <div className="text-gray-600 dark:text-gray-400">
                          Session ID: {user.sessionId || "None"}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          Last seen:{" "}
                          {user.lastSeen
                            ? new Date(user.lastSeen).toLocaleDateString()
                            : "Never"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Total Users Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Total Authenticated Users
          </h2>
          {!allUsers && <p className="text-gray-500">Loading...</p>}
          {allUsers && (
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {allUsers.length}
            </p>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> This page is for debugging only. In production,
            add authentication to restrict access.
          </p>
        </div>
      </div>
    </div>
  );
}
