"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { Loader2, MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { revalidateTrekPage } from "@/app/treks/actions";
import { analytics } from "@/lib/analytics";
import { formatTrekDate, summarizeStats } from "@/lib/trek-utils";
import DayCard from "./DayCard";

interface TrekManagerProps {
  userId: Id<"users">;
  trekId: Id<"treks">;
}

export default function TrekManager({ userId, trekId }: TrekManagerProps) {
  const router = useRouter();
  const trek = useQuery(api.treks.getTrek, { trekId, viewerId: userId });
  const updateTrek = useMutation(api.treks.updateTrek);
  const deleteTrek = useMutation(api.treks.deleteTrek);
  const addDay = useMutation(api.treks.addTrekDay);

  const [draft, setDraft] = useState<{ name: string; placeName: string } | null>(null);

  const refreshPublicPage = () => void revalidateTrekPage(trekId);

  if (trek === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
      </div>
    );
  }

  if (trek === null || trek.userId !== userId) {
    return (
      <p className="py-12 text-center text-gray-500">
        This trek does not exist, or it is not yours.{" "}
        <Link href="/my-treks" className="text-green-600 hover:underline">
          Back to My Treks
        </Link>
      </p>
    );
  }

  async function run(action: () => Promise<unknown>, failure: string) {
    try {
      await action();
      refreshPublicPage();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : failure);
    }
  }

  const stats = summarizeStats(trek.totals);
  const isPublic = trek.visibility === "public";

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-4">
          {draft ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="trek-name">Trek name</Label>
                <Input
                  id="trek-name"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="trek-place">Place name</Label>
                <Input
                  id="trek-place"
                  value={draft.placeName}
                  onChange={(e) => setDraft({ ...draft, placeName: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() =>
                    run(async () => {
                      await updateTrek({ userId, trekId, ...draft });
                      setDraft(null);
                    }, "Could not save the trek")
                  }
                >
                  Save
                </Button>
                <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{trek.name}</h1>
                <div className="mt-1 flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{trek.placeName}</span>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {formatTrekDate(trek.startDate)}
                  {stats.length > 0 && ` · ${stats.join(" · ")}`}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDraft({ name: trek.name, placeName: trek.placeName })}
              >
                Edit
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t pt-4">
            <div>
              <Label htmlFor="trek-visibility" className="font-medium">
                {isPublic ? "Public" : "Private"}
              </Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isPublic
                  ? "Anyone can see this trek, including the exact pin."
                  : "Only you can see this trek."}
              </p>
            </div>
            <Switch
              id="trek-visibility"
              checked={isPublic}
              onCheckedChange={(checked) =>
                run(
                  () => updateTrek({ userId, trekId, visibility: checked ? "public" : "private" }),
                  "Could not change visibility"
                )
              }
            />
          </div>

          <div className="flex items-center justify-between">
            {isPublic ? (
              <Link href={`/treks/${trekId}`} className="text-sm text-green-600 hover:underline">
                View public page
              </Link>
            ) : (
              <span />
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="text-red-600">
                  Delete trek
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this trek?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This deletes the trek, all its days and all its photos. You cannot undo it.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      run(async () => {
                        await deleteTrek({ userId, trekId });
                        router.push("/my-treks");
                      }, "Could not delete the trek")
                    }
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {trek.days.map((day, index) => (
        <DayCard
          key={day._id}
          userId={userId}
          day={day}
          dayNumber={index + 1}
          canDelete={trek.days.length > 1}
          onChanged={refreshPublicPage}
        />
      ))}

      <Button
        type="button"
        variant="outline"
        className="w-full gap-1.5"
        onClick={() =>
          run(async () => {
            await addDay({ userId, trekId });
            analytics.trekDayAdded(trek.days.length + 1);
          }, "Could not add a day")
        }
      >
        <Plus className="h-4 w-4" />
        Add day
      </Button>
    </div>
  );
}
