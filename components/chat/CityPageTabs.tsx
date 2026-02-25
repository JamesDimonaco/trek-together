"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { SessionData } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, FileText, HandHelping } from "lucide-react";
import { analytics } from "@/lib/analytics";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import ChatClient from "./ChatClient";
import PostsList from "@/components/posts/PostsList";
import RequestsList from "@/components/requests/RequestsList";

interface CityPageTabsProps {
  cityId: Id<"cities">;
  cityName: string;
}

export default function CityPageTabs({ cityId, cityName }: CityPageTabsProps) {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const updateLastSeen = useMutation(api.users.updateLastSeen);
  const postCount = useQuery(api.posts.countPostsByCity, { cityId });
  const requestCount = useQuery(api.requests.countOpenRequestsByCity, { cityId });
  const cityActivity = useQuery(api.cities.getCityActivity, { cityId });
  const nearbyCities = useQuery(api.cities.getNearbyActiveCities, { cityId });
  const suggestedRef = useRef(false);

  // Reset suggestion flag when city changes
  useEffect(() => {
    suggestedRef.current = false;
  }, [cityId]);

  const hasValidConvexUserId = session?.isAuthenticated && session?.userId;

  // Get session from API
  useEffect(() => {
    fetch("/api/session")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Session fetch failed: ${res.status}`);
        }
        return res.json();
      })
      .then(setSession)
      .catch((error) => {
        console.error("Failed to fetch session:", error);
        setSession({
          isAuthenticated: false,
          isAnonymous: true,
          sessionId: crypto.randomUUID(),
          username: "Anonymous",
        });
      });
  }, []);

  // Set current city when component mounts
  useEffect(() => {
    const setCurrentCity = async () => {
      try {
        await fetch("/api/set-current-city", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cityId }),
        });
        analytics.cityJoined(cityId, cityName);
      } catch (error) {
        console.error("Failed to set current city:", error);
      }
    };

    setCurrentCity();
  }, [cityId, cityName]);

  // Update lastSeen periodically
  useEffect(() => {
    if (!hasValidConvexUserId) return;

    updateLastSeen({ userId: session!.userId as Id<"users"> });

    const interval = setInterval(() => {
      updateLastSeen({ userId: session!.userId as Id<"users"> });
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [hasValidConvexUserId, session, updateLastSeen]);

  // Suggest nearby active cities when current city is quiet
  useEffect(() => {
    if (suggestedRef.current) return;
    if (cityActivity === undefined || nearbyCities === undefined) return;

    if (
      cityActivity.activeUsers === 0 &&
      !cityActivity.hasRecentMessages &&
      nearbyCities.length > 0
    ) {
      suggestedRef.current = true;
      const top = nearbyCities[0];
      toast(
        `Quiet here! ${top.name} (${top.distance}km away) has ${top.activeUsers} active trekker${top.activeUsers === 1 ? "" : "s"}`,
        {
          action: {
            label: "Join",
            onClick: () => router.push(`/chat/${top._id}`),
          },
          duration: 10000,
        }
      );
    }
  }, [cityActivity, nearbyCities, router]);

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0">
      {/* Info bar */}
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <TabsList className="h-8 bg-transparent p-0 gap-1">
            <TabsTrigger
              value="chat"
              className="h-7 px-2.5 text-xs data-[state=active]:bg-green-100 data-[state=active]:text-green-700 dark:data-[state=active]:bg-green-900/30 dark:data-[state=active]:text-green-400"
            >
              <MessageCircle className="h-3.5 w-3.5 mr-1" />
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="posts"
              className="h-7 px-2.5 text-xs data-[state=active]:bg-green-100 data-[state=active]:text-green-700 dark:data-[state=active]:bg-green-900/30 dark:data-[state=active]:text-green-400"
            >
              <FileText className="h-3.5 w-3.5 mr-1" />
              Posts
              {postCount !== undefined && postCount > 0 && (
                <span className="ml-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-1.5 text-[10px] font-medium min-w-[18px] text-center">
                  {postCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="requests"
              className="h-7 px-2.5 text-xs data-[state=active]:bg-green-100 data-[state=active]:text-green-700 dark:data-[state=active]:bg-green-900/30 dark:data-[state=active]:text-green-400"
            >
              <HandHelping className="h-3.5 w-3.5 mr-1" />
              Requests
              {requestCount !== undefined && requestCount > 0 && (
                <span className="ml-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-1.5 text-[10px] font-medium min-w-[18px] text-center">
                  {requestCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          <span className="text-gray-600 dark:text-gray-300 text-xs">
            {session.username || "Anonymous"}
          </span>
        </div>
      </div>

      <TabsContent value="chat" className="flex-1 flex flex-col min-h-0 mt-0">
        <ChatClient cityId={cityId} cityName={cityName} session={session} />
      </TabsContent>

      <TabsContent value="posts" className="flex-1 flex flex-col min-h-0 mt-0 overflow-y-auto">
        <PostsList cityId={cityId} session={session} />
      </TabsContent>

      <TabsContent value="requests" className="flex-1 flex flex-col min-h-0 mt-0 overflow-y-auto">
        <RequestsList cityId={cityId} session={session} />
      </TabsContent>
    </Tabs>
  );
}
