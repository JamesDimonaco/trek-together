"use client";

import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Mountain, User, MessageCircle, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import MessagesNavLink from "./MessagesNavLink";

interface CurrentCity {
  _id: string;
  name: string;
  country: string;
}

export default function AuthHeader() {
  const { userId: authUserId } = useAuth();
  const [currentCity, setCurrentCity] = useState<CurrentCity | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get current user's Convex ID
  const currentUser = useQuery(
    api.users.getUserByAuthId,
    authUserId ? { authId: authUserId } : "skip"
  );

  useEffect(() => {
    const fetchCurrentCity = async () => {
      setIsLoading(true);
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentCity();
  }, []);

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-2">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-2 min-w-0 flex-shrink-0"
          >
            <Mountain className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
            <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
              TrekTogether
            </span>
          </Link>

          {/* Center - Current City Quick Access (Hidden on mobile) */}
          <div className="hidden md:flex flex-1 justify-center">
            {currentCity && !isLoading ? (
              <Button variant="ghost" size="sm" asChild>
                <Link
                  href={`/chat/${currentCity._id}`}
                  className="flex items-center space-x-2"
                >
                  <MessageCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{currentCity.name} Chat</span>
                </Link>
              </Button>
            ) : null}
          </div>

          {/* Navigation & Auth Buttons */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Cities - Always visible */}
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-9 w-9 sm:w-auto px-0 sm:px-3"
            >
              <Link href="/cities" className="flex items-center justify-center">
                <MapPin className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-1" />
                <span className="hidden sm:inline">Cities</span>
              </Link>
            </Button>

            {/* Users - Always visible */}
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-9 w-9 sm:w-auto px-0 sm:px-3"
            >
              <Link href="/users" className="flex items-center justify-center">
                <Users className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-1" />
                <span className="hidden sm:inline">Trekkers</span>
              </Link>
            </Button>

            <SignedOut>
              <Button variant="ghost" size="sm" asChild className="h-9 px-3">
                <Link href="/sign-in" className="flex items-center">
                  <User className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
              </Button>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 h-9 px-3"
                asChild
              >
                <Link href="/sign-up">
                  <span className="hidden sm:inline">Sign Up</span>
                  <span className="sm:hidden">Join</span>
                </Link>
              </Button>
            </SignedOut>

            <SignedIn>
              {/* Messages - Icon only on mobile with unread badge */}
              <MessagesNavLink userId={currentUser?._id} />

              {/* UserButton */}
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-9 w-9",
                  },
                }}
                userProfileMode="modal"
              >
                <UserButton.MenuItems>
                  {currentUser && (
                    <UserButton.Link
                      label="Profile"
                      labelIcon={<User className="h-4 w-4" />}
                      href={`/profile/${currentUser._id}`}
                    />
                  )}
                </UserButton.MenuItems>
              </UserButton>
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  );
}
