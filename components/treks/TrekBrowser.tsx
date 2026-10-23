"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { Loader2, Mountain, Search } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import TrekCard from "./TrekCard";

export default function TrekBrowser() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const treks = useQuery(api.treks.getPublicTreks, {
    search: debouncedSearch.trim() || undefined,
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Trek logs
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Treks logged by members, newest first.
          </p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Search by place or trek name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {treks === undefined && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
        )}

        {treks && treks.length === 0 && (
          <div className="py-12 text-center">
            <Mountain className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              {search.trim() ? `No treks match "${search.trim()}".` : "No public treks yet."}
            </p>
          </div>
        )}

        {treks && treks.length > 0 && (
          <div className="space-y-3">
            {treks.map((trek) => (
              <TrekCard
                key={trek._id}
                href={`/treks/${trek._id}`}
                trek={trek}
                ownerUsername={trek.owner?.username}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
