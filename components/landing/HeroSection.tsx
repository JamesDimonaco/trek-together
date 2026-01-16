"use client";

import { MapPin, MessageCircle, Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface HeroSectionProps {
  onLocationRequest: () => void;
}

export default function HeroSection({ onLocationRequest }: HeroSectionProps) {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="text-center space-y-8">
        {/* Logo/Brand */}
        <div className="inline-flex items-center justify-center gap-3 bg-white dark:bg-gray-800 px-6 py-3 rounded-full shadow-lg border border-gray-100 dark:border-gray-700">
          <span className="text-3xl">🏔️</span>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">TrekTogether</span>
        </div>

        {/* Main headline */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight">
            Find hiking buddies
            <span className="block text-green-600 dark:text-green-400">wherever you travel</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            Join city-based chat rooms to connect with trekkers, plan adventures, and explore together.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            onClick={onLocationRequest}
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            <MapPin className="mr-2 h-5 w-5" />
            Find Trekkers Near Me
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="px-8 py-6 text-lg rounded-full"
          >
            <Link href="/cities">
              <Globe className="mr-2 h-5 w-5" />
              Browse All Cities
            </Link>
          </Button>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          No sign-up required • Start chatting instantly
        </p>
      </div>

      {/* How it works */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-center text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-8">
          How it works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xl font-bold">
              1
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Pick your city</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Use your location or browse to find cities worldwide
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xl font-bold">
              2
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Join the chat</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enter the city or country chat room instantly
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xl font-bold">
              3
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Meet & explore</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Connect with trekkers and plan your next adventure
            </p>
          </div>
        </div>
      </div>

      {/* Value props */}
      <div className="flex flex-wrap justify-center gap-6 text-sm">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <MessageCircle className="h-4 w-4 text-green-600" />
          <span>Real-time messaging</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Globe className="h-4 w-4 text-green-600" />
          <span>Cities worldwide</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <MapPin className="h-4 w-4 text-green-600" />
          <span>City & country chats</span>
        </div>
      </div>
    </div>
  );
}
