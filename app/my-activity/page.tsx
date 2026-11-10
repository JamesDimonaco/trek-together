"use client";

import { Button } from "@/components/ui/button";
import EmptyState from "@/components/shared/EmptyState";
import LoadingState from "@/components/shared/LoadingState";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, HandHelping } from "lucide-react";
import Link from "next/link";
import MyActivityPostCard from "@/components/activity/MyActivityPostCard";
import MyActivityRequestCard from "@/components/activity/MyActivityRequestCard";
import CreatePostWithCityDialog from "@/components/activity/CreatePostWithCityDialog";
import CreateRequestWithCityDialog from "@/components/activity/CreateRequestWithCityDialog";
import { analytics } from "@/lib/analytics";

export default function MyActivityPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState("all");

  const currentUser = useQuery(
    api.users.getUserByAuthId,
    clerkUser?.id ? { authId: clerkUser.id } : "skip"
  );

  const convexUserId = currentUser?._id as Id<"users"> | undefined;

  const posts = useQuery(
    api.posts.getPostsByAuthor,
    convexUserId ? { userId: convexUserId, authorId: convexUserId } : "skip"
  );

  const requests = useQuery(
    api.requests.getRequestsByAuthor,
    convexUserId ? { userId: convexUserId, authorId: convexUserId } : "skip"
  );

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !clerkUser) {
      router.push("/sign-in");
    }
  }, [isLoaded, clerkUser, router]);

  // Track page view once data is loaded
  const hasTrackedView = useRef(false);
  useEffect(() => {
    if (posts !== undefined && requests !== undefined && !hasTrackedView.current) {
      hasTrackedView.current = true;
      analytics.myActivityViewed(posts.length, requests.length);
    }
  }, [posts, requests]);

  const allActivity = useMemo(() => {
    const items = [
      ...(posts ?? []).map((p) => ({ ...p, itemType: "post" as const })),
      ...(requests ?? []).map((r) => ({ ...r, itemType: "request" as const })),
    ];
    items.sort((a, b) => b._creationTime - a._creationTime);
    if (activeTab === "posts") return items.filter((i) => i.itemType === "post");
    if (activeTab === "requests")
      return items.filter((i) => i.itemType === "request");
    return items;
  }, [posts, requests, activeTab]);

  const isLoading = !isLoaded || (clerkUser && !currentUser);

  if (isLoading) {
    return (
      <LoadingState className="min-h-[60vh]" />
    );
  }

  if (!clerkUser || !convexUserId) return null;

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          My activity
        </h1>
        <div className="flex items-center gap-2">
          <CreatePostWithCityDialog userId={convexUserId} />
          <CreateRequestWithCityDialog userId={convexUserId} />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(tab) => {
        setActiveTab(tab);
        analytics.myActivityTabChanged(tab as "all" | "posts" | "requests");
      }} >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="posts" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-1.5">
            <HandHelping className="h-3.5 w-3.5" />
            Requests
          </TabsTrigger>
        </TabsList>

        {/* One panel whose content follows the active tab, so each tab controls a real panel. */}
        <TabsContent value={activeTab} className="mt-6">
          {posts === undefined || requests === undefined ? (
            <LoadingState className="py-12" />
          ) : allActivity.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={
                activeTab === "posts"
                  ? "No posts yet"
                  : activeTab === "requests"
                    ? "No trek requests yet"
                    : "No posts or trek requests yet"
              }
              description="Share a trail report or find trek buddies in any city."
              action={
                <Button asChild>
                  <Link href="/cities">Browse cities</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {allActivity.map((item) =>
                item.itemType === "post" ? (
                  <MyActivityPostCard key={`post-${item._id}`} post={item} />
                ) : (
                  <MyActivityRequestCard
                    key={`req-${item._id}`}
                    request={item}
                  />
                )
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
