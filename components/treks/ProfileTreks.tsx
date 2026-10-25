"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { Mountain } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TrekCard from "./TrekCard";

interface ProfileTreksProps {
  profileUserId: Id<"users">;
  isOwnProfile: boolean;
}

export default function ProfileTreks({ profileUserId, isOwnProfile }: ProfileTreksProps) {
  const treks = useQuery(api.treks.getUserTreks, {
    userId: profileUserId,
    viewerId: isOwnProfile ? profileUserId : undefined,
  });

  if (!treks || (treks.length === 0 && !isOwnProfile)) return null;

  return (
    <Card className="mb-4 sm:mb-6">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
          <Mountain className="h-5 w-5 text-green-600" />
          <span>Treks</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4 sm:px-6">
        {treks.length === 0 ? (
          <div className="text-center">
            <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
              You have not logged a trek yet.
            </p>
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link href="/my-treks/new">Log a trek</Link>
            </Button>
          </div>
        ) : (
          treks.map((trek) => (
            <TrekCard
              key={trek._id}
              href={isOwnProfile ? `/my-treks/${trek._id}` : `/treks/${trek._id}`}
              trek={trek}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
