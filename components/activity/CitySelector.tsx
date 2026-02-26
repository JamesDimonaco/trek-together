"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { MapPin } from "lucide-react";

interface CitySelectorProps {
  userId: Id<"users">;
  value: string;
  onValueChange: (value: string) => void;
}

export default function CitySelector({
  userId,
  value,
  onValueChange,
}: CitySelectorProps) {
  const cities = useQuery(api.users.getUserVisitedCities, { userId });

  if (cities && cities.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-gray-500">
        <MapPin className="h-5 w-5 mx-auto mb-2 text-gray-400" />
        <p>You haven&apos;t visited any cities yet.</p>
        <Link href="/cities" className="text-green-600 hover:underline">
          Browse cities to get started
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>City</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select a city..." />
        </SelectTrigger>
        <SelectContent>
          {cities?.map((city) => (
            <SelectItem key={city._id} value={city._id}>
              {city.name}, {city.country}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
