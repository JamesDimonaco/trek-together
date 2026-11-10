import Link from "next/link";
import { MapPin, Mountain, Globe } from "lucide-react";
import BackLink from "@/components/layout/BackLink";
import { Button } from "@/components/ui/button";

interface City {
  _id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  countrySlug?: string;
}

interface ChatHeaderServerProps {
  city: City;
}

export default function ChatHeaderServer({ city }: ChatHeaderServerProps) {
  const countrySlug = city.countrySlug ?? city.country.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <BackLink href="/cities" label="Cities" />
          <div className="flex items-center space-x-2">
            <Mountain className="h-6 w-6 text-primary dark:text-green-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {city.name} Trekkers
              </h1>
              <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                <MapPin className="h-3 w-3" />
                <span>{city.name}, {city.country}</span>
              </div>
            </div>
          </div>
        </div>

        <Button variant="outline" size="sm" asChild className="min-w-11 gap-1.5">
          <Link href={`/chat/country/${countrySlug}`}>
            <Globe className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">{city.country} chat</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}