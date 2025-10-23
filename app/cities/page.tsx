"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Users } from "lucide-react";
import Link from "next/link";

export default function CitiesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Get cities with active user counts
  const citiesWithUsers = useQuery(api.cities.getCitiesWithActiveUsers);

  // Filter cities based on search
  const filteredCities = citiesWithUsers?.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Explore Cities
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find trekkers in cities around the world
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search cities or countries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Loading state */}
        {!citiesWithUsers && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        )}

        {/* Empty state */}
        {citiesWithUsers && citiesWithUsers.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No cities yet. Be the first to explore!
            </p>
          </div>
        )}

        {/* No results */}
        {filteredCities && filteredCities.length === 0 && citiesWithUsers && citiesWithUsers.length > 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No cities found matching "{searchTerm}"
            </p>
          </div>
        )}

        {/* Cities grid */}
        {filteredCities && filteredCities.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCities.map((city) => (
              <Link
                key={city._id}
                href={`/chat/${city._id}`}
                className="block"
              >
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:border-green-500 dark:hover:border-green-500 hover:shadow-md transition-all active:scale-[0.98]">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {city.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {city.country}
                      </p>
                    </div>
                    <MapPin className="h-5 w-5 text-green-600 flex-shrink-0 ml-2" />
                  </div>

                  <div className="flex items-center text-sm">
                    <Users className="h-4 w-4 text-gray-500 mr-1.5" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {city.activeUsers === 0
                        ? "No active trekkers"
                        : city.activeUsers === 1
                        ? "1 active trekker"
                        : `${city.activeUsers} active trekkers`}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Stats */}
        {citiesWithUsers && citiesWithUsers.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredCities?.length || 0} of {citiesWithUsers.length} cities
          </div>
        )}
      </div>
    </div>
  );
}
