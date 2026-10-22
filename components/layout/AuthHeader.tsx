"use client";

import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Mountain,
  User,
  MessageCircle,
  MapPin,
  Users,
  FileText,
  Route,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const [currentCity, setCurrentCity] = useState<CurrentCity | null>(null);

  // Get current user's Convex ID
  const currentUser = useQuery(
    api.users.getUserByAuthId,
    authUserId ? { authId: authUserId } : "skip"
  );

  useEffect(() => {
    const controller = new AbortController();

    const fetchCurrentCity = async () => {
      try {
        const response = await fetch("/api/current-city", {
          signal: controller.signal,
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.city) {
            setCurrentCity(data.city);
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Failed to fetch current city:", error);
      }
    };

    fetchCurrentCity();
    return () => controller.abort();
  }, [pathname]);

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

          {/* Navigation & Auth Buttons */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Treks - public browse, always visible */}
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-9 w-9 sm:w-auto px-0 sm:px-3"
            >
              <Link href="/treks" aria-label="Treks" className="flex items-center justify-center">
                <Route className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-1" />
                <span className="hidden sm:inline">Treks</span>
              </Link>
            </Button>

            <SignedIn>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-9 w-9 sm:w-auto px-0 sm:px-3"
              >
                <Link href="/my-treks" aria-label="My Treks" className="flex items-center justify-center">
                  <Mountain className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-1" />
                  <span className="hidden sm:inline">My Treks</span>
                </Link>
              </Button>
            </SignedIn>

            {/* Community - city chats, cities and trekker search */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Community"
                  className="h-9 w-9 sm:w-auto px-0 sm:px-3"
                >
                  <Users className="h-5 w-5 sm:h-4 sm:w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Community</span>
                  <ChevronDown className="hidden sm:inline h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {currentCity && (
                  <DropdownMenuItem asChild>
                    <Link href={`/chat/${currentCity._id}`}>
                      <MessageCircle className="text-green-600" />
                      {currentCity.name} Chat
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/cities">
                    <MapPin />
                    Cities
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/users">
                    <Users />
                    Trekkers
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <SignedOut>
              <Button variant="ghost" size="sm" asChild className="h-9 px-3">
                <Link href="/sign-in" aria-label="Sign In" className="flex items-center">
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
              <MessagesNavLink />

              {/* UserButton */}
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-9 w-9",
                  },
                }}
                userProfileMode="modal"
              >
                {currentUser && (
                  <UserButton.MenuItems>
                    <UserButton.Link
                      label="Profile"
                      labelIcon={<User className="h-4 w-4" />}
                      href={`/profile/${currentUser._id}`}
                    />
                    <UserButton.Link
                      label="My Activity"
                      labelIcon={<FileText className="h-4 w-4" />}
                      href="/my-activity"
                    />
                  </UserButton.MenuItems>
                )}
              </UserButton>
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  );
}
