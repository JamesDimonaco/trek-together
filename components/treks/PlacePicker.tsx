"use client";

import { useEffect, useRef, useState } from "react";
import {
  APIProvider,
  AdvancedMarker,
  Map,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { Input } from "@/components/ui/input";

export interface PickedPlace {
  lat: number;
  lng: number;
  googlePlaceId?: string;
  placeName?: string;
}

interface PlacePickerProps {
  value: { lat: number; lng: number } | null;
  onPick: (place: PickedPlace) => void;
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
// Advanced markers need a map ID; Google's demo ID works until a styled one exists.
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "DEMO_MAP_ID";

export default function PlacePicker(props: PlacePickerProps) {
  if (!API_KEY) {
    return (
      <p className="text-sm text-red-600">
        Maps are not set up. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
      </p>
    );
  }
  return (
    <APIProvider apiKey={API_KEY}>
      <PickerBody {...props} />
    </APIProvider>
  );
}

function PickerBody({ value, onPick }: PlacePickerProps) {
  const places = useMapsLibrary("places");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<
    google.maps.places.PlacePrediction[]
  >([]);
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken>(null);

  useEffect(() => {
    if (places && !sessionToken.current) {
      sessionToken.current = new places.AutocompleteSessionToken();
    }
  }, [places]);

  useEffect(() => {
    if (!places || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const result =
          await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: query,
            sessionToken: sessionToken.current ?? undefined,
          });
        if (cancelled) return;
        setSuggestions(
          result.suggestions.flatMap((s) => (s.placePrediction ? [s.placePrediction] : []))
        );
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [places, query]);

  async function pickSuggestion(prediction: google.maps.places.PlacePrediction) {
    const place = prediction.toPlace();
    await place.fetchFields({ fields: ["displayName", "location", "id"] });
    if (!place.location || !places) return;
    onPick({
      lat: place.location.lat(),
      lng: place.location.lng(),
      googlePlaceId: place.id,
      placeName: place.displayName ?? prediction.text.text,
    });
    sessionToken.current = new places.AutocompleteSessionToken();
    setQuery("");
    setSuggestions([]);
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
          placeholder="Search for a trail, mountain or town"
          id="place-search"
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg dark:bg-gray-800 dark:border-gray-700">
            {suggestions.map((s) => (
              <li key={s.placeId}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => pickSuggestion(s)}
                >
                  {s.text.text}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="h-64 overflow-hidden rounded-md border">
        <Map
          mapId={MAP_ID}
          defaultCenter={{ lat: 20, lng: 0 }}
          defaultZoom={2}
          gestureHandling="greedy"
          disableDefaultUI
          zoomControl
          onClick={(e) => {
            const latLng = e.detail.latLng;
            if (latLng) onPick({ lat: latLng.lat, lng: latLng.lng });
          }}
        >
          {value && <AdvancedMarker position={value} />}
          <FlyToValue value={value} />
        </Map>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Can&apos;t find it? Click the map to drop a pin yourself.
      </p>
    </div>
  );
}

function FlyToValue({ value }: { value: { lat: number; lng: number } | null }) {
  const map = useMap();
  const lat = value?.lat;
  const lng = value?.lng;

  useEffect(() => {
    if (!map || lat === undefined || lng === undefined) return;
    map.panTo({ lat, lng });
    if ((map.getZoom() ?? 0) < 10) map.setZoom(11);
  }, [map, lat, lng]);

  return null;
}
