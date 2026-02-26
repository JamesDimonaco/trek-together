"use client";

import { useMemo, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import RecentActivityCard from "./RecentActivityCard";

export default function RecentActivityCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const recentPosts = useQuery(api.posts.getRecentPosts, { limit: 6 });
  const recentRequests = useQuery(api.requests.getRecentRequests, { limit: 6 });

  const items = useMemo(() => {
    const all = [
      ...(recentPosts ?? []).map((p) => ({ ...p, itemType: "post" as const })),
      ...(recentRequests ?? []).map((r) => ({
        ...r,
        itemType: "request" as const,
      })),
    ];
    all.sort((a, b) => b._creationTime - a._creationTime);
    return all.slice(0, 10);
  }, [recentPosts, recentRequests]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 300;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const isLoading = recentPosts === undefined || recentRequests === undefined;

  if (!isLoading && items.length === 0) {
    return (
      <section className="mt-12">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Recent Activity from the Community
        </h2>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="mb-2">Be the first to share!</p>
          <p className="text-sm">
            Join a city and create a post.{" "}
            <Link
              href="/cities"
              className="text-green-600 hover:underline"
            >
              Browse cities
            </Link>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Recent Activity from the Community
        </h2>
        <div className="hidden sm:flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => scroll("left")}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => scroll("right")}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[280px] h-[160px] rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
              />
            ))
          : items.map((item) => (
              <RecentActivityCard
                key={`${item.itemType}-${item._id}`}
                item={item}
              />
            ))}
      </div>
    </section>
  );
}
