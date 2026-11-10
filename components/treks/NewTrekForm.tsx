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
import PlacePicker, { PickedPlace } from "./PlacePicker";

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
      <p id={`${fieldIds[field]}-error`} role="alert" className="text-sm text-red-700 dark:text-red-400">
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
      if (first) document.getElementById(fieldIds[first])?.focus();
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

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="place-search">Where did you trek?</Label>
        <PlacePicker value={pin} onPick={handlePick} errorId={errors.place && "place-search-error"} />
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
