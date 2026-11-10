"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { format } from "date-fns";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { analytics } from "@/lib/analytics";
import { newTrekFormErrors, NewTrekField } from "@/lib/trek-utils";
import PlacePicker, { MAPS_API_KEY, PickedPlace } from "./PlacePicker";
import EmptyState from "@/components/shared/EmptyState";
import Link from "next/link";
import { MapPinOff } from "lucide-react";

export default function NewTrekForm({ userId }: { userId: Id<"users"> }) {
  const router = useRouter();
  const createTrek = useMutation(api.treks.createTrek);
  const [pin, setPin] = useState<PickedPlace | null>(null);
  const [placeName, setPlaceName] = useState("");
  const [name, setName] = useState("");
  const [nameEdited, setNameEdited] = useState(false);
  const [startDate, setStartDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [isSaving, setIsSaving] = useState(false);
  // Errors show after the first save attempt and update live, so each clears once fixed.
  const [triedSave, setTriedSave] = useState(false);
  const errors = triedSave
    ? newTrekFormErrors({ hasPin: !!pin, placeName, name, startDate })
    : {};
  const fieldIds: Record<NewTrekField, string> = {
    place: "place-search",
    placeName: "placeName",
    name: "trekName",
    startDate: "startDate",
  };
  const errorProps = (field: NewTrekField) =>
    errors[field]
      ? { "aria-invalid": true, "aria-describedby": `${fieldIds[field]}-error` }
      : {};
  const fieldError = (field: NewTrekField) =>
    errors[field] && (
      <p id={`${fieldIds[field]}-error`} className="text-sm text-red-700 dark:text-red-400">
        {errors[field]}
      </p>
    );

  function handlePick(picked: PickedPlace) {
    setPin(picked);
    if (picked.placeName) {
      setPlaceName(picked.placeName);
      if (!nameEdited) setName(picked.placeName);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTriedSave(true);
    const found = newTrekFormErrors({ hasPin: !!pin, placeName, name, startDate });
    const first = (Object.keys(fieldIds) as NewTrekField[]).find((field) => found[field]);
    if (first || !pin) {
      document.getElementById(fieldIds[first ?? "place"])?.focus();
      return;
    }
    setIsSaving(true);
    try {
      const trekId = await createTrek({
        userId,
        name,
        placeName,
        lat: pin.lat,
        lng: pin.lng,
        googlePlaceId: pin.googlePlaceId,
        startDate,
      });
      analytics.trekCreated(true, !!pin.googlePlaceId);
      router.push(`/my-treks/${trekId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the trek");
      setIsSaving(false);
    }
  }

  // Every trek needs a pin, so without the map there is nothing to fill in yet.
  if (!MAPS_API_KEY) {
    return (
      <EmptyState
        icon={MapPinOff}
        title="The map can't load right now"
        description="Every trek needs a place on the map, so new treks can't be logged until it's back. Please try again later."
        action={
          <Button asChild variant="outline">
            <Link href="/my-treks">Back to my treks</Link>
          </Button>
        }
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <p role="status" className="sr-only">
        {Object.keys(errors).length > 0 &&
          `${Object.keys(errors).length} ${Object.keys(errors).length === 1 ? "field needs" : "fields need"} attention`}
      </p>
      <div className="space-y-2">
        <Label htmlFor="place-search">Where did you trek?</Label>
        <PlacePicker apiKey={MAPS_API_KEY} value={pin} onPick={handlePick} errorId={errors.place && "place-search-error"} />
        {fieldError("place")}
      </div>

      <div className="space-y-2">
        <Label htmlFor="placeName">Place name</Label>
        <Input
          id="placeName"
          {...errorProps("placeName")}
          value={placeName}
          onChange={(e) => setPlaceName(e.target.value)}
          placeholder="Name this place if you dropped a pin"
        />
        {fieldError("placeName")}
      </div>

      <div className="space-y-2">
        <Label htmlFor="trekName">Trek name</Label>
        <Input
          id="trekName"
          {...errorProps("name")}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNameEdited(true);
          }}
          placeholder="e.g. Torres del Paine W"
        />
        {fieldError("name")}
      </div>

      <div className="space-y-2">
        <Label htmlFor="startDate">Start date</Label>
        <Input
          id="startDate"
          {...errorProps("startDate")}
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        {fieldError("startDate")}
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        New treks are public and show this exact pin. You can switch a trek to private
        any time. Add stats, notes and photos on the next page.
      </p>

      <Button
        type="submit"
        disabled={isSaving}
        className="w-full"
      >
        {isSaving ? "Saving..." : "Save trek"}
      </Button>
    </form>
  );
}
