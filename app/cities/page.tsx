"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Globe } from "lucide-react";
import { CountrySection } from "@/components/cities/CountrySection";
import { useEffect } from "react";

export default function CitiesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Get cities grouped by country
  const groupedCities = useQuery(api.cities.getCitiesGroupedByCountry);

  // Migration mutation - run once to create countries from cities
  const migrateCountries = useMutation(api.countries.migrateCountriesFromCities);

  // Run migration on mount if there are cities but no countries
  useEffect(() => {
    if (groupedCities && groupedCities.length > 0) {
      // Check if any country record is missing
      const hasNullCountry = groupedCities.some((group) => group.country === null);
      if (hasNullCountry) {
        migrateCountries().catch(console.error);
      }
    }
  }, [groupedCities, migrateCountries]);

  // Filter groups based on search
  const filteredGroups = useMemo(() => {
    if (!groupedCities) return null;
    if (!searchTerm) return groupedCities;

    const searchLower = searchTerm.toLowerCase();

    return groupedCities
      .map((group) => {
        // Check if country name matches
        const countryMatches = group.countryName.toLowerCase().includes(searchLower);

        // Filter cities that match
        const matchingCities = group.cities.filter((city) =>
          city.name.toLowerCase().includes(searchLower)
        );

        // Include group if country matches or has matching cities
        if (countryMatches) {
          return group; // Show all cities if country matches
        } else if (matchingCities.length > 0) {
          return {
            ...group,
            cities: matchingCities,
          };
        }
        return null;
      })
      .filter(Boolean) as typeof groupedCities;
  }, [groupedCities, searchTerm]);

  // Calculate totals
  const totalCities = groupedCities?.reduce((sum, g) => sum + g.cities.length, 0) || 0;
  const totalCountries = groupedCities?.length || 0;
  const filteredCitiesCount = filteredGroups?.reduce((sum, g) => sum + g.cities.length, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Explore Cities
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find trekkers in cities around the world, grouped by country
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
        {!groupedCities && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        )}

        {/* Empty state */}
        {groupedCities && groupedCities.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No cities yet. Be the first to explore!
            </p>
          </div>
        )}

        {/* No results */}
        {filteredGroups && filteredGroups.length === 0 && groupedCities && groupedCities.length > 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No cities found matching "{searchTerm}"
            </p>
          </div>
        )}

        {/* Countries with cities */}
        {filteredGroups && filteredGroups.length > 0 && (
          <div className="space-y-2">
            {filteredGroups.map((group) => (
              <CountrySection
                key={group.countryName}
                countryName={group.countryName}
                country={group.country}
                cities={group.cities}
                defaultOpen={filteredGroups.length <= 5 || searchTerm.length > 0}
              />
            ))}
          </div>
        )}

        {/* Stats */}
        {groupedCities && groupedCities.length > 0 && (
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <Globe className="h-4 w-4" />
              {searchTerm ? `${filteredGroups?.length || 0} of ` : ""}{totalCountries} countries
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {searchTerm ? `${filteredCitiesCount} of ` : ""}{totalCities} cities
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
