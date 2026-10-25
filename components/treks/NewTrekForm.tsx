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

  function handlePick(picked: PickedPlace) {
    setPin(picked);
    if (picked.placeName) {
      setPlaceName(picked.placeName);
      if (!nameEdited) setName(picked.placeName);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pin) {
      toast.error("Pick a place on the map first");
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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="place-search">Where did you trek?</Label>
        <PlacePicker value={pin} onPick={handlePick} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="placeName">Place name</Label>
        <Input
          id="placeName"
          value={placeName}
          onChange={(e) => setPlaceName(e.target.value)}
          placeholder="Name this place if you dropped a pin"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="trekName">Trek name</Label>
        <Input
          id="trekName"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNameEdited(true);
          }}
          placeholder="e.g. Torres del Paine W"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="startDate">Start date</Label>
        <Input
          id="startDate"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        New treks are public and show this exact pin. You can switch a trek to private
        any time. Add stats, notes and photos on the next page.
      </p>

      <Button
        type="submit"
        disabled={isSaving}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        {isSaving ? "Saving..." : "Save trek"}
      </Button>
    </form>
  );
}
