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
} from "lucide-react";
import { notFound } from "next/navigation";

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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              {/* Avatar */}
              <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.username}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-green-600 dark:text-green-400" />
                )}
              </div>

              {/* Username and Stats */}
              <div>
                <CardTitle className="text-2xl mb-1">
                  {profile.username}
                  {isGuest && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      (Guest)
                    </span>
                  )}
                </CardTitle>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Mountain className="h-4 w-4" />
                    <span>
                      {profile.citiesVisited.length} cities visited
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {isOwnProfile && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/profile/edit">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Link>
                </Button>
              )}
              {!isOwnProfile && !isGuest && (
                <Button asChild size="sm" className="bg-green-600 hover:bg-green-700">
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
          <CardContent className="pt-0">
            {profile.bio && (
              <div className="mb-4">
                <p className="text-gray-700 dark:text-gray-300">{profile.bio}</p>
              </div>
            )}
            {profile.whatsappNumber && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <PhoneIcon className="h-4 w-4" />
                <span>WhatsApp: {profile.whatsappNumber}</span>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Cities Visited */}
      {profile.cities && profile.cities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-green-600" />
              <span>Cities Visited</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {profile.cities.map((city) => (
                <Link
                  key={city._id}
                  href={`/chat/${city._id}`}
                  className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <Mountain className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {city.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
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
          <CardContent className="py-12 text-center">
            <Mountain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
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
