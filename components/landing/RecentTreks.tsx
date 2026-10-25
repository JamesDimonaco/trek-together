"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import TrekCard from "@/components/treks/TrekCard";

const RECENT_TREK_COUNT = 6;

export default function RecentTreks() {
  const treks = useQuery(api.treks.getPublicTreks, {});
  if (!treks || treks.length === 0) return null;

  return (
    <section className="mt-16">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent public treks</h2>
        <Link href="/treks" className="text-sm text-green-600 hover:underline dark:text-green-400">
          See all
        </Link>
      </div>
      <div className="space-y-3">
        {treks.slice(0, RECENT_TREK_COUNT).map((trek) => (
          <TrekCard
            key={trek._id}
            href={`/treks/${trek._id}`}
            trek={trek}
            ownerUsername={trek.owner?.username}
          />
        ))}
      </div>
    </section>
  );
}
