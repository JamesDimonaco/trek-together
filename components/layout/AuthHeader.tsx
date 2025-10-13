"use client";

import {
  SignedIn,
  SignedOut,
  UserButton,
  useAuth,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Mountain, User, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

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
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Mountain className="h-6 w-6 text-green-600 dark:text-green-400" />
            <span className="font-semibold text-gray-900 dark:text-white">
              TrekTogether
            </span>
          </Link>

          {/* Center - Current City Quick Access */}
          <div className="flex-1 flex justify-center">
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

          {/* Auth Buttons */}
          <div className="flex items-center space-x-2">
            <SignedOut>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/sign-in">
                  <User className="h-4 w-4 mr-1" />
                  Sign In
                </Link>
              </Button>
              <Button size="sm" className="bg-green-600 hover:bg-green-700" asChild>
                <Link href="/sign-up">Sign Up</Link>
              </Button>
            </SignedOut>

            <SignedIn>
              {currentUser && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/profile/${currentUser._id}`}>
                    <User className="h-4 w-4 mr-1" />
                    Profile
                  </Link>
                </Button>
              )}
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8",
                  },
                }}
                userProfileMode="modal"
              />
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  );
}
