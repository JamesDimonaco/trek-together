"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocationData, LocationStep, SessionData } from "@/lib/types";
import {
  geocodeAddress,
  initializeSession,
  joinCity,
  requestGeolocation,
  reverseGeocode,
  updateUsername,
} from "@/lib/helpers/api";
import { analytics } from "@/lib/analytics";
import LocationPermission from "./LocationPermission";
import ManualLocation from "./ManualLocation";
import LocationConfirmation from "./LocationConfirmation";
import UsernamePrompt from "./UsernamePrompt";

// Geolocation -> nearest city -> join chat. Secondary to the city list on /cities.
export default function FindNearbyCity() {
  const router = useRouter();
  const [step, setStep] = useState<LocationStep>("initial");
  const [manualLocation, setManualLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [usernameSuggestion, setUsernameSuggestion] = useState("");
  const [session, setSession] = useState<SessionData | null>(null);

  const reset = () => {
    setStep("initial");
    setLocationData(null);
    setManualLocation("");
    setError("");
    setIsLoading(false);
  };

  const handleLocationRequest = () => {
    setStep("requesting");
    setIsLoading(true);
    setError("");

    requestGeolocation(
      async (position) => {
        const data = await reverseGeocode(
          position.coords.latitude,
          position.coords.longitude
        );
        if (data) {
          setLocationData(data);
          setStep("confirming");
          analytics.locationDetected(data.city, data.country, "auto");
        } else {
          setError("Could not determine your city. Please enter it manually.");
          setStep("manual");
        }
        setIsLoading(false);
      },
      (geoError) => {
        console.error("Location error:", geoError.message, "Code:", geoError.code);
        setError(
          geoError.code === 1
            ? "Location permission denied. Please enter your city manually."
            : "Could not detect your location. Please enter your city manually."
        );
        setStep("manual");
        setIsLoading(false);
      }
    );
  };

  const handleManualLocation = async () => {
    if (!manualLocation.trim()) return;
    setIsLoading(true);
    setError("");

    const data = await geocodeAddress(manualLocation);
    if (data) {
      setLocationData(data);
      setStep("confirming");
      analytics.locationDetected(data.city, data.country, "manual");
    } else {
      setError("Could not find that location. Please try again.");
    }
    setIsLoading(false);
  };

  const handleJoinCity = async (providedUsername?: string) => {
    if (!locationData) return;
    setIsLoading(true);
    setError("");

    const result = await joinCity(locationData, providedUsername);
    if (result.success && result.redirectUrl) {
      router.push(result.redirectUrl);
      return;
    }
    if (result.code === "USERNAME_TAKEN" && result.suggestion) {
      setError(result.error || "Username is already taken");
      setUsernameSuggestion(result.suggestion);
    } else {
      setError(result.error || "Failed to join city chat");
    }
    setIsLoading(false);
  };

  // Signed-in users already have a username, so they skip the prompt.
  const handleConfirmLocation = async () => {
    setIsLoading(true);
    const current = session ?? (await initializeSession());
    setSession(current);
    if (current?.isAuthenticated) {
      await handleJoinCity();
    } else {
      setIsLoading(false);
      setStep("username");
    }
  };

  const handleUsernameSubmit = async () => {
    if (!username.trim()) return;
    setIsLoading(true);
    setError("");
    setUsernameSuggestion("");
    await updateUsername(username.trim());
    analytics.usernameChosen(false);
    await handleJoinCity(username.trim());
  };

  const handleStayAnonymous = async () => {
    analytics.usernameChosen(true);
    await handleJoinCity();
  };

  if (step === "initial") {
    return (
      <div className="flex flex-col items-center justify-between gap-3 rounded-lg border border-dashed border-gray-300 bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:text-left">
        <div>
          <p className="font-medium text-gray-900 dark:text-white">Not sure which city?</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Use your location to find the nearest city chat.
          </p>
        </div>
        <Button variant="outline" onClick={handleLocationRequest} className="flex-shrink-0 gap-1.5">
          <LocateFixed className="h-4 w-4" />
          Find cities near me
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {step === "requesting" && (
        <LocationPermission isLoading={isLoading} onManualEntry={() => setStep("manual")} />
      )}

      {step === "manual" && (
        <ManualLocation
          value={manualLocation}
          onChange={setManualLocation}
          onSubmit={handleManualLocation}
          onUseCurrentLocation={handleLocationRequest}
          isLoading={isLoading}
          error={error}
        />
      )}

      {step === "confirming" && locationData && (
        <LocationConfirmation
          locationData={locationData}
          onConfirm={handleConfirmLocation}
          onChangeLocation={() => {
            setStep("manual");
            setLocationData(null);
            setManualLocation("");
          }}
          isLoading={isLoading}
        />
      )}

      {step === "confirming" && error && (
        <p className="text-center text-sm text-red-500">{error}</p>
      )}

      {step === "username" && locationData && (
        <UsernamePrompt
          locationData={locationData}
          session={session}
          username={username}
          onUsernameChange={setUsername}
          onSubmit={handleUsernameSubmit}
          onStayAnonymous={handleStayAnonymous}
          isLoading={isLoading}
          error={error}
          suggestion={usernameSuggestion}
        />
      )}

      <div className="text-center">
        <Button variant="ghost" size="sm" onClick={reset} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
