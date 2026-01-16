"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface City {
  _id: string;
  name: string;
  country: string;
}

interface CountrySectionProps {
  countryName: string;
  country: {
    _id: string;
    name: string;
    slug: string;
  } | null;
  cities: City[];
  defaultOpen?: boolean;
}

export function CountrySection({
  countryName,
  country,
  cities,
  defaultOpen = true,
}: CountrySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-6">
      {/* Country Header */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-2">
        <CollapsibleTrigger className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition-opacity">
          <ChevronDown
            className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
              isOpen ? "" : "-rotate-90"
            }`}
          />
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {countryName}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {cities.length} {cities.length === 1 ? "city" : "cities"}
            </p>
          </div>
        </CollapsibleTrigger>

        {/* Country Chat Button */}
        {country && (
          <Link href={`/chat/country/${country.slug}`}>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Country Chat</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Cities Grid */}
      <CollapsibleContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pl-4">
          {cities.map((city) => (
            <Link key={city._id} href={`/chat/${city._id}`} className="block">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-green-500 dark:hover:border-green-500 hover:shadow-md transition-all active:scale-[0.98]">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium text-gray-900 dark:text-white truncate flex-1">
                    {city.name}
                  </h3>
                  <MapPin className="h-4 w-4 text-green-600 flex-shrink-0 ml-2" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
