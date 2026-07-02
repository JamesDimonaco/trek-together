"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Globe } from "lucide-react";
import RecentActivityCard from "@/components/landing/RecentActivityCard";

interface GlobalRequestsStripProps {
  // Hide requests from this city (they're already shown locally)
  excludeCityId?: string;
  heading?: string;
}

// When the local room is empty, show that the wider network is alive:
// recent open trek requests from anywhere in the world.
export default function GlobalRequestsStrip({
  excludeCityId,
  heading = "Recent trek plans around the world",
}: GlobalRequestsStripProps) {
  const recentRequests = useQuery(api.requests.getRecentRequests, {
    limit: 8,
  });

  if (recentRequests === undefined) return null;

  const items = recentRequests
    .filter((r) => !excludeCityId || r.cityId !== excludeCityId)
    .slice(0, 6)
    .map((r) => ({ ...r, itemType: "request" as const }));

  if (items.length === 0) return null;

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
        <Globe className="h-4 w-4 text-green-600" />
        {heading}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <RecentActivityCard key={item._id} item={item} />
        ))}
      </div>
    </div>
  );
}
