import Image from "next/image";
import Link from "next/link";
import { CloudSun, ExternalLink, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Id } from "@/convex/_generated/dataModel";
import { formatTrekDate, summarizeStats } from "@/lib/trek-utils";
import TrekComments from "./TrekComments";

interface TrekViewDay {
  _id: string;
  date: string;
  notes?: string;
  placeNote?: string;
  weather?: string;
  distanceMeters?: number;
  durationMinutes?: number;
  elevationGainMeters?: number;
  maxElevationMeters?: number;
  photos: { storageId: string; url: string }[];
}

export type TrekViewCompanion =
  | { kind: "user"; userId: string; username: string }
  | { kind: "name"; name: string };

export interface TrekViewData {
  _id: Id<"treks">;
  name: string;
  placeName: string;
  lat: number;
  lng: number;
  startDate: string;
  owner: { _id: string; username: string } | null;
  companions: TrekViewCompanion[];
  days: TrekViewDay[];
  totals: Parameters<typeof summarizeStats>[0];
}

export default function TrekView({ trek }: { trek: TrekViewData }) {
  const totals = summarizeStats(trek.totals);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${trek.lat},${trek.lng}`;

  return (
    <article className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{trek.name}</h1>
        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span>{trek.placeName}</span>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 inline-flex items-center gap-1 text-sm text-green-600 hover:underline"
          >
            Open in Google Maps <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {trek.owner && (
            <>
              By{" "}
              <Link href={`/profile/${trek.owner._id}`} className="text-green-600 hover:underline">
                {trek.owner.username}
              </Link>
              {" · "}
            </>
          )}
          {formatTrekDate(trek.startDate)}
          {trek.days.length > 1 && ` · ${trek.days.length} days`}
          {totals.length > 0 && ` · ${totals.join(" · ")}`}
        </p>
        {trek.companions.length > 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            With{" "}
            {trek.companions.map((companion, index) => (
              <span key={companion.kind === "user" ? companion.userId : `name-${index}`}>
                {index > 0 && ", "}
                {companion.kind === "user" ? (
                  <Link
                    href={`/profile/${companion.userId}`}
                    className="text-green-600 hover:underline"
                  >
                    {companion.username}
                  </Link>
                ) : (
                  companion.name
                )}
              </span>
            ))}
          </p>
        )}
      </header>

      {trek.days.map((day, index) => {
        const stats = summarizeStats(day);
        return (
          <Card key={day._id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Day {index + 1}
                  {day.placeNote && (
                    <span className="font-normal text-gray-600 dark:text-gray-400">
                      {" "}
                      · {day.placeNote}
                    </span>
                  )}
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatTrekDate(day.date)}
                </span>
              </div>
              {(stats.length > 0 || day.weather) && (
                <p className="flex flex-wrap items-center gap-x-3 text-sm text-gray-600 dark:text-gray-400">
                  {stats.join(" · ")}
                  {day.weather && (
                    <span className="inline-flex items-center gap-1">
                      <CloudSun className="h-4 w-4" /> {day.weather}
                    </span>
                  )}
                </p>
              )}
              {day.notes && (
                <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{day.notes}</p>
              )}
              {day.photos.length > 0 && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {day.photos.map((photo, photoIndex) => (
                    <div
                      key={photo.storageId}
                      className="relative aspect-square overflow-hidden rounded-lg"
                    >
                      <Image
                        src={photo.url}
                        alt={`${trek.name}, day ${index + 1}, photo ${photoIndex + 1}`}
                        fill
                        sizes="(min-width: 640px) 200px, 50vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <TrekComments trekId={trek._id} />
    </article>
  );
}
