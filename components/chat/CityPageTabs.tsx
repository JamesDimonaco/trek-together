"use client";

import { useEffect, useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { SessionData } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, FileText, HandHelping } from "lucide-react";
import { analytics } from "@/lib/analytics";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import ChatClient from "./ChatClient";
import PostsList from "@/components/posts/PostsList";
import RequestsList from "@/components/requests/RequestsList";

interface CityPageTabsProps {
  cityId: Id<"cities">;
  cityName: string;
}

export default function CityPageTabs({ cityId, cityName }: CityPageTabsProps) {
  const [session, setSession] = useState<SessionData | null>(null);
  const updateLastSeen = useMutation(api.users.updateLastSeen);

  const hasValidConvexUserId = session?.isAuthenticated && session?.userId;

  // Get session from API
  useEffect(() => {
    fetch("/api/session")
      .then((res) => {
        if (!res.ok) {
          console.error("Failed to fetch session:", res.status, res.statusText);
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setSession(data);
      })
      .catch(console.error);
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
            </TabsTrigger>
            <TabsTrigger
              value="requests"
              className="h-7 px-2.5 text-xs data-[state=active]:bg-green-100 data-[state=active]:text-green-700 dark:data-[state=active]:bg-green-900/30 dark:data-[state=active]:text-green-400"
            >
              <HandHelping className="h-3.5 w-3.5 mr-1" />
              Requests
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
