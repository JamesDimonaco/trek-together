"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MapPin,
  Calendar,
  MessageCircle,
  Edit,
  User,
  Mountain,
  PhoneIcon,
  Settings,
} from "lucide-react";
import { notFound } from "next/navigation";

// Calculate age from date of birth
function calculateAge(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth);

  // Validate the date
  if (isNaN(birthDate.getTime())) {
    return 0;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

interface ProfileViewProps {
  userId: string;
}

export default function ProfileView({ userId }: ProfileViewProps) {
  const { userId: currentAuthUserId } = useAuth();
  const { user: clerkUser } = useUser();
  const profile = useQuery(api.users.getUserProfile, {
    userId: userId as Id<"users">,
  });

  // Loading state
  if (profile === undefined) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  // Profile not found
  if (profile === null) {
    notFound();
  }

  const isOwnProfile = profile.authId === currentAuthUserId;
  const isGuest = !profile.authId;

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
      {/* Header Card */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="px-4 sm:px-6">
          {/* Mobile: Stack avatar and info vertically */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 flex-1">
              {/* Avatar */}
              <div className="relative h-24 w-24 sm:h-20 sm:w-20 rounded-full bg-green-100 dark:bg-green-900 flex-shrink-0 overflow-hidden">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <User className="h-12 w-12 sm:h-10 sm:w-10 text-green-600 dark:text-green-400" />
                  </div>
                )}
              </div>

              {/* Username and Stats */}
              <div className="flex-1 text-center sm:text-left">
                <CardTitle className="text-xl sm:text-2xl mb-2">
                  {profile.username}
                  {isGuest && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      (Guest)
                    </span>
                  )}
                </CardTitle>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Mountain className="h-4 w-4" />
                    <span>{profile.citiesVisited.length} cities</span>
                  </div>
                  {profile.dateOfBirth && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{calculateAge(profile.dateOfBirth)} years</span>
                    </div>
                  )}
                  {profile.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions - Full width on mobile, side by side on desktop */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              {isOwnProfile && (
                <>
                  <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                    <Link href="/profile/edit">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                    <Link href="/settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </Button>
                </>
              )}
              {!isOwnProfile && !isGuest && (
                <Button
                  asChild
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                >
                  <Link href={`/dm/${userId}`}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send Message
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {(profile.bio || profile.whatsappNumber) && (
          <CardContent className="pt-0 px-4 sm:px-6">
            {profile.bio && (
              <div className="mb-4">
                <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                  {profile.bio}
                </p>
              </div>
            )}
            {profile.whatsappNumber && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <PhoneIcon className="h-4 w-4 flex-shrink-0" />
                <span>WhatsApp: {profile.whatsappNumber}</span>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Cities Visited */}
      {profile.cities && profile.cities.length > 0 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
              <MapPin className="h-5 w-5 text-green-600" />
              <span>Cities Visited</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {profile.cities.map((city) => (
                <Link
                  key={city._id}
                  href={`/chat/${city._id}`}
                  className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition active:bg-gray-100 dark:active:bg-gray-700"
                >
                  <Mountain className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {city.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {city.country}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {(!profile.cities || profile.cities.length === 0) && (
        <Card>
          <CardContent className="py-8 sm:py-12 text-center px-4">
            <Mountain className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
              {isOwnProfile
                ? "You haven't visited any cities yet. Start exploring!"
                : "This user hasn't visited any cities yet."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
