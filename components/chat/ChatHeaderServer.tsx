import Link from "next/link";
import { ArrowLeft, MapPin, Mountain, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

interface City {
  _id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
}

interface ChatHeaderServerProps {
  city: City;
}

// Generate URL-safe slug from country name (same logic as backend)
function generateCountrySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default function ChatHeaderServer({ city }: ChatHeaderServerProps) {
  const countrySlug = generateCountrySlug(city.country);

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" asChild className="p-2">
            <Link href="/cities">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>

          <div className="flex items-center space-x-2">
            <Mountain className="h-6 w-6 text-green-600 dark:text-green-400" />
            <div>
              <h1 className="font-semibold text-gray-900 dark:text-white">
                {city.name} Trekkers
              </h1>
              <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                <MapPin className="h-3 w-3" />
                <span>{city.name}, {city.country}</span>
              </div>
            </div>
          </div>
        </div>

        <Button variant="outline" size="sm" asChild className="gap-1.5">
          <Link href={`/chat/country/${countrySlug}`}>
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">{city.country} Chat</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}