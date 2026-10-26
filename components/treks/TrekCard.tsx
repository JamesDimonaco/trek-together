import Link from "next/link";
import { Heart, Lock, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatTrekDate, summarizeStats } from "@/lib/trek-utils";

interface TrekCardProps {
  href: string;
  trek: {
    name: string;
    placeName: string;
    startDate: string;
    visibility: "public" | "private";
    dayCount: number;
    totals: Parameters<typeof summarizeStats>[0];
    likeCount: number;
  };
  ownerUsername?: string;
}

export default function TrekCard({ href, trek, ownerUsername }: TrekCardProps) {
  const stats = summarizeStats(trek.totals);
  return (
    <Link href={href} className="block">
      <Card className="transition hover:bg-gray-50 dark:hover:bg-gray-800">
        <CardContent className="space-y-1 px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-gray-900 dark:text-white">{trek.name}</h3>
            {trek.visibility === "private" && (
              <span className="flex flex-shrink-0 items-center gap-1 text-xs text-gray-500">
                <Lock className="h-3 w-3" /> Private
              </span>
            )}
            {trek.likeCount > 0 && (
              <span className="flex flex-shrink-0 items-center gap-1 text-xs text-gray-500">
                <Heart className="h-3 w-3" /> {trek.likeCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{trek.placeName}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {ownerUsername && `${ownerUsername} · `}
            {formatTrekDate(trek.startDate)}
            {trek.dayCount > 1 && ` · ${trek.dayCount} days`}
            {stats.length > 0 && ` · ${stats.join(" · ")}`}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
