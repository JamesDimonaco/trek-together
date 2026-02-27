"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SessionData } from "@/lib/types";
import { MessageCircle, MapPin, Compass, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

interface CurrentCity {
  _id: string;
  name: string;
  country: string;
}

interface CurrentCityCardProps {
  session: SessionData | null;
  onFindNewCity: () => void;
}

const VISIBLE_CITY_COUNT = 6;

export default function CurrentCityCard({ session, onFindNewCity }: CurrentCityCardProps) {
  const [currentCity, setCurrentCity] = useState<CurrentCity | null>(null);
  const [showAllCities, setShowAllCities] = useState(false);

  const hasValidConvexUserId = session?.isAuthenticated && session?.userId;
  const visitedCities = useQuery(
    api.users.getUserVisitedCities,
    hasValidConvexUserId ? { userId: session!.userId as Id<"users"> } : "skip"
  );

  useEffect(() => {
    const fetchCurrentCity = async () => {
      try {
        const response = await fetch("/api/current-city");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.city) {
            setCurrentCity(data.city);
          }
        }
      } catch (error) {
        console.error("Failed to fetch current city:", error);
      }
    };

    fetchCurrentCity();
  }, []);

  if (!currentCity) {
    return null;
  }

  const citiesLoading = hasValidConvexUserId && visitedCities === undefined;

  // Filter out current city, reverse for most-recent-first
  const otherCities = [...(visitedCities?.filter((c) => c._id !== currentCity._id) ?? [])].reverse();
  const visibleCities = showAllCities
    ? otherCities
    : otherCities.slice(0, VISIBLE_CITY_COUNT);
  const hasMore = otherCities.length > VISIBLE_CITY_COUNT;

  return (
    <Card className="max-w-md mx-auto bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          <CardTitle className="text-lg">Continue Your Chat</CardTitle>
        </div>
        <CardDescription>
          You have an active chat in {currentCity.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
          <MapPin className="h-4 w-4" />
          <span>
            {currentCity.name}, {currentCity.country}
          </span>
        </div>

        <Button asChild className="w-full bg-green-600 hover:bg-green-700">
          <Link href={`/chat/${currentCity._id}`}>
            <MessageCircle className="mr-2 h-4 w-4" />
            Return to {currentCity.name} City Chat
          </Link>
        </Button>

        {citiesLoading ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Your Cities
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-7 w-20 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse"
                />
              ))}
            </div>
          </div>
        ) : otherCities.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Your Cities
            </p>
            <div id="city-list" className="flex flex-wrap gap-2">
              {visibleCities.map((city) => (
                <Button
                  key={city._id}
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-7 text-xs"
                >
                  <Link href={`/chat/${city._id}`}>
                    <MapPin className="h-3 w-3 mr-1" />
                    {city.name}
                  </Link>
                </Button>
              ))}
            </div>
            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllCities(!showAllCities)}
                aria-expanded={showAllCities}
                aria-controls="city-list"
                className="w-full h-7 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showAllCities ? (
                  <>
                    Show less <ChevronUp className="h-3 w-3 ml-1" />
                  </>
                ) : (
                  <>
                    Show {otherCities.length - VISIBLE_CITY_COUNT} more <ChevronDown className="h-3 w-3 ml-1" />
                  </>
                )}
              </Button>
            )}
          </div>
        ) : null}

        <Button
          variant="outline"
          size="sm"
          onClick={onFindNewCity}
          className="w-full gap-1.5"
        >
          <Compass className="h-4 w-4" />
          Find Trekkers in a New City
        </Button>
      </CardContent>
    </Card>
  );
}
