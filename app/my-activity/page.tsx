"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, HandHelping, Loader2 } from "lucide-react";
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!clerkUser || !convexUserId) return null;

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          My Activity
        </h1>
        <div className="flex items-center gap-2">
          <CreatePostWithCityDialog userId={convexUserId} />
          <CreateRequestWithCityDialog userId={convexUserId} />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(tab) => {
        setActiveTab(tab);
        analytics.myActivityTabChanged(tab as "all" | "posts" | "requests");
      }} className="mb-6">
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
      </Tabs>

      {posts === undefined || requests === undefined ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-green-600" />
        </div>
      ) : allActivity.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            {activeTab === "posts"
              ? "You haven't created any posts yet."
              : activeTab === "requests"
                ? "You haven't created any requests yet."
                : "You haven't created any posts or requests yet."}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Join a city and share your trekking experiences!
          </p>
          <Link
            href="/cities"
            className="inline-block mt-4 text-green-600 hover:underline text-sm"
          >
            Browse cities
          </Link>
        </div>
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
    </div>
  );
}
