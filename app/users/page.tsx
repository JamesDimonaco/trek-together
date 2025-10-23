"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Search, User, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Only search when there's a search term (min 2 characters)
  const users = useQuery(
    api.users.searchUsers,
    searchTerm.length >= 2 ? { searchTerm } : "skip"
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Find Trekkers
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Connect with fellow adventurers
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchTerm.length > 0 && searchTerm.length < 2 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Type at least 2 characters to search
            </p>
          )}
        </div>

        {/* Results */}
        {searchTerm.length >= 2 && (
          <>
            {/* Loading */}
            {!users && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            )}

            {/* No results */}
            {users && users.length === 0 && (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No users found matching "{searchTerm}"
                </p>
              </div>
            )}

            {/* User list */}
            {users && users.length > 0 && (
              <div className="space-y-3">
                {users.map((user) => (
                  <Link
                    key={user._id}
                    href={`/profile/${user._id}`}
                    className="block"
                  >
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-green-500 dark:hover:border-green-500 hover:shadow-md transition-all active:scale-[0.98]">
                      <div className="flex items-center space-x-4">
                        {/* Avatar */}
                        {user.avatarUrl ? (
                          <Image
                            src={user.avatarUrl}
                            alt={user.username}
                            width={48}
                            height={48}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                            <User className="h-6 w-6 text-green-600 dark:text-green-400" />
                          </div>
                        )}

                        {/* User info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {user.username}
                          </h3>
                          {user.bio && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {user.bio}
                            </p>
                          )}
                          {user.location && (
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-500 mt-1">
                              <MapPin className="h-3.5 w-3.5 mr-1" />
                              <span className="truncate">{user.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}

                {/* Results count */}
                <div className="text-center text-sm text-gray-600 dark:text-gray-400 pt-4">
                  Found {users.length} {users.length === 1 ? "user" : "users"}
                </div>
              </div>
            )}
          </>
        )}

        {/* Initial state */}
        {searchTerm.length < 2 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Start typing to search for trekkers
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
