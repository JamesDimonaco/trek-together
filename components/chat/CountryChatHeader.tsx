import { Globe, Mountain } from "lucide-react";
import BackLink from "@/components/layout/BackLink";

interface Country {
  _id: string;
  name: string;
  slug: string;
}

interface CountryChatHeaderProps {
  country: Country;
}

export default function CountryChatHeader({ country }: CountryChatHeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div>
        <BackLink href="/cities" label="Cities" />

        <div className="flex items-center space-x-2">
          <Mountain className="h-6 w-6 text-primary dark:text-green-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {country.name} Trekkers
            </h1>
            <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
              <Globe className="h-3 w-3" />
              <span>Country-wide chat</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
