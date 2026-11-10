"use client";

import EmptyState from "@/components/shared/EmptyState";
import LoadingState from "@/components/shared/LoadingState";
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { Mountain, Search } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
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
    <div className="flex-1 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
            Trek logs
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Treks logged by members, newest first.
          </p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" aria-hidden="true" />
          <Input
            type="search"
            placeholder="Search by place or trek name..."
            aria-label="Search treks"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {treks === undefined && (
          <LoadingState className="py-12" />
        )}

        {treks && treks.length === 0 && (
          <EmptyState
            icon={Mountain}
            title={search.trim() ? `No treks match "${search.trim()}"` : "No public treks yet"}
            description={search.trim() ? "Try a place name, or a shorter search." : undefined}
            action={
              search.trim() ? (
                <Button variant="outline" onClick={() => setSearch("")}>
                  Clear search
                </Button>
              ) : undefined
            }
          />
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
