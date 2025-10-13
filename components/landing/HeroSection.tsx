"use client";

import { MapPin, Users, MessageCircle, Mountain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface HeroSectionProps {
  onLocationRequest: () => void;
}

export default function HeroSection({ onLocationRequest }: HeroSectionProps) {
  const totalActiveUsers = useQuery(api.users.getTotalActiveUsers);
  return (
    <div className="space-y-12 text-center">
      {/* Hero Section */}
      <div className="space-y-4">
        <div className="flex justify-center">
          <Mountain className="h-16 w-16 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white">
          TrekTogether
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Connect with fellow trekkers and outdoor enthusiasts in your city.
          Join real-time conversations and plan your next adventure together.
        </p>
        {totalActiveUsers !== undefined && totalActiveUsers > 0 && (
          <div className="inline-flex items-center space-x-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-2 rounded-full">
            <Users className="h-4 w-4" />
            <span className="font-medium">{totalActiveUsers} trekker{totalActiveUsers !== 1 ? 's' : ''} online now</span>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <MapPin className="h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
            <CardTitle className="text-lg">City-Based Chats</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Join local trekking communities instantly based on your location
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Users className="h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
            <CardTitle className="text-lg">Meet Adventurers</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Connect with like-minded outdoor enthusiasts near you
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <MessageCircle className="h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
            <CardTitle className="text-lg">Real-Time Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Plan trips, share tips, and coordinate meetups instantly
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* CTA */}
      <div className="space-y-4">
        <Button
          onClick={onLocationRequest}
          size="lg"
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg rounded-full"
        >
          <MapPin className="mr-2 h-5 w-5" />
          Find Trekkers Near Me
        </Button>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No sign-up required • Start chatting instantly
        </p>
      </div>
    </div>
  );
}