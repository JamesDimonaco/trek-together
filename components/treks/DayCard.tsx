"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
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
import { Textarea } from "@/components/ui/textarea";
import PostImageUpload from "@/components/posts/PostImageUpload";
import { hoursMinutesToMinutes, kmToMeters } from "@/lib/trek-utils";

export interface DayCardDay {
  _id: Id<"trek_days">;
  date: string;
  notes?: string;
  placeNote?: string;
  weather?: string;
  distanceMeters?: number;
  durationMinutes?: number;
  elevationGainMeters?: number;
  maxElevationMeters?: number;
  images: string[];
  photos: { storageId: string; url: string }[];
}

interface DayCardProps {
  userId: Id<"users">;
  day: DayCardDay;
  dayNumber: number;
  canDelete: boolean;
  onChanged: () => void;
}

const numberToField = (n: number | undefined) => (n === undefined ? "" : String(n));

export default function DayCard({ userId, day, dayNumber, canDelete, onChanged }: DayCardProps) {
  const updateDay = useMutation(api.treks.updateTrekDay);
  const deleteDay = useMutation(api.treks.deleteTrekDay);

  const [date, setDate] = useState(day.date);
  const [placeNote, setPlaceNote] = useState(day.placeNote ?? "");
  const [weather, setWeather] = useState(day.weather ?? "");
  const [km, setKm] = useState(day.distanceMeters === undefined ? "" : String(day.distanceMeters / 1000));
  const [hours, setHours] = useState(
    day.durationMinutes === undefined ? "" : String(Math.floor(day.durationMinutes / 60))
  );
  const [minutes, setMinutes] = useState(
    day.durationMinutes === undefined ? "" : String(day.durationMinutes % 60)
  );
  const [gain, setGain] = useState(numberToField(day.elevationGainMeters));
  const [maxElevation, setMaxElevation] = useState(numberToField(day.maxElevationMeters));
  const [notes, setNotes] = useState(day.notes ?? "");
  const [images, setImages] = useState(day.photos.map((p) => p.storageId));
  const [imageUrls, setImageUrls] = useState(day.photos.map((p) => p.url));
  const [isSaving, setIsSaving] = useState(false);

  const optionalWhole = (value: string) => (value.trim() === "" ? null : Number(value));
  const optionalText = (value: string) => (value.trim() === "" ? null : value.trim());

  async function handleSave() {
    setIsSaving(true);
    try {
      await updateDay({
        userId,
        dayId: day._id,
        date,
        placeNote: optionalText(placeNote),
        weather: optionalText(weather),
        distanceMeters: kmToMeters(km),
        durationMinutes: hoursMinutesToMinutes(hours, minutes),
        elevationGainMeters: optionalWhole(gain),
        maxElevationMeters: optionalWhole(maxElevation),
        notes: optionalText(notes),
        images,
      });
      onChanged();
      toast.success(`Day ${dayNumber} saved`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the day");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteDay({ userId, dayId: day._id });
      onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete the day");
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">Day {dayNumber}</h3>
          <Input
            type="date"
            aria-label={`Day ${dayNumber} date`}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-auto"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor={`placeNote-${day._id}`}>Where</Label>
            <Input
              id={`placeNote-${day._id}`}
              value={placeNote}
              onChange={(e) => setPlaceNote(e.target.value)}
              placeholder="e.g. Camp 2"
              maxLength={100}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`weather-${day._id}`}>Weather</Label>
            <Input
              id={`weather-${day._id}`}
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              placeholder="e.g. Clear, windy"
              maxLength={100}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`km-${day._id}`}>Distance (km)</Label>
            <Input
              id={`km-${day._id}`}
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={km}
              onChange={(e) => setKm(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`hours-${day._id}`}>Time (h / min)</Label>
            <div className="flex gap-2">
              <Input
                id={`hours-${day._id}`}
                type="number"
                inputMode="numeric"
                min={0}
                max={24}
                step={1}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                aria-label="Hours"
              />
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={59}
                step={1}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                aria-label="Minutes"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`gain-${day._id}`}>Elevation gain (m)</Label>
            <Input
              id={`gain-${day._id}`}
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={gain}
              onChange={(e) => setGain(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`max-${day._id}`}>Max elevation (m)</Label>
            <Input
              id={`max-${day._id}`}
              type="number"
              inputMode="numeric"
              step={1}
              value={maxElevation}
              onChange={(e) => setMaxElevation(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor={`notes-${day._id}`}>Notes</Label>
          <Textarea
            id={`notes-${day._id}`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            maxLength={5000}
            placeholder="How was the day?"
          />
        </div>

        <PostImageUpload
          images={images}
          imageUrls={imageUrls}
          onImagesChange={(ids, urls) => {
            setImages(ids);
            setImageUrls(urls);
          }}
        />

        <div className="flex items-center justify-between">
          {canDelete ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="ghost" size="sm">
                  Delete day
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete day {dayNumber}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This deletes the day&apos;s notes, stats and photos. You cannot undo it.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <span />
          )}
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? "Saving..." : "Save day"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
