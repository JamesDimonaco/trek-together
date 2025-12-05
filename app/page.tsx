"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LocationData, SessionData, LocationStep } from "@/lib/types";
import {
  initializeSession,
  updateUsername,
  reverseGeocode,
  geocodeAddress,
  joinCity,
  requestGeolocation,
} from "@/lib/helpers/api";
import { analytics } from "@/lib/analytics";

// Landing page components
import HeroSection from "@/components/landing/HeroSection";
import LocationPermission from "@/components/landing/LocationPermission";
import ManualLocation from "@/components/landing/ManualLocation";
import LocationConfirmation from "@/components/landing/LocationConfirmation";
import UsernamePrompt from "@/components/landing/UsernamePrompt";
import CurrentCityCard from "@/components/landing/CurrentCityCard";

export default function Home() {
  const router = useRouter();

  // State management
  const [locationStep, setLocationStep] = useState<LocationStep>("initial");
  const [manualLocation, setManualLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [error, setError] = useState<string>("");
  const [username, setUsername] = useState("");
  const [usernameSuggestion, setUsernameSuggestion] = useState<string>("");
  const [session, setSession] = useState<SessionData | null>(null);

  // Initialize session on mount
  useEffect(() => {
    const init = async () => {
      try {
        const sessionData = await initializeSession();
        if (sessionData) {
          setSession(sessionData);
          console.log("Session initialized:", sessionData);
        }
      } catch (error) {
        console.error("Failed to initialize session:", error);
        // Consider setting an error state or showing a user-friendly message
      }
    };
    init();
  }, []);

  // Location handlers
  const handleLocationRequest = async () => {
    setLocationStep("requesting");
    setIsLoading(true);
    setError("");

    requestGeolocation(
      async (position) => {
        console.log("Location obtained:", {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });

        const data = await reverseGeocode(
          position.coords.latitude,
          position.coords.longitude
        );

        if (data) {
          setLocationData(data);
          setLocationStep("confirming");
          analytics.locationDetected(data.city, data.country, "auto");
        } else {
          setError("Could not determine your city. Please enter it manually.");
          setLocationStep("manual");
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Location error:", error.message, "Code:", error.code);

        let errorMessage = "Could not detect your location. Please enter your city manually.";

        if (error.code === 1) {
          errorMessage = "Location permission denied. Please enter your city manually.";
        } else if (error.message.includes("secure origin") || error.message.includes("permission")) {
          errorMessage = "Location services require a secure connection. Please enter your city manually.";
        }

        setError(errorMessage);
        setLocationStep("manual");
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
      setLocationStep("confirming");
      analytics.locationDetected(data.city, data.country, "manual");
    } else {
      setError("Could not find that location. Please try again.");
    }
    setIsLoading(false);
  };

  const handleConfirmLocation = () => {
    if (locationData) {
      console.log("Confirmed location:", locationData);

      // Check if user is authenticated - skip username prompt for auth users
      if (session?.isAuthenticated) {
        console.log("User is authenticated, skipping username prompt");
        handleJoinCity();
      } else {
        // Anonymous user - show username prompt
        console.log("Anonymous user, showing username prompt");
        setLocationStep("username");
      }
    }
  };

  const handleChangeLocation = () => {
    setLocationStep("manual");
    setLocationData(null);
    setManualLocation("");
  };

  // Username handlers
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

  // Join city handler
  const handleJoinCity = async (providedUsername?: string) => {
    if (!locationData) return;

    setIsLoading(true);
    setError("");

    const result = await joinCity(locationData, providedUsername);

    if (result.success && result.redirectUrl) {
      console.log("Joined city successfully");
      router.push(result.redirectUrl);
    } else {
      // Handle username taken error specifically
      if (result.code === "USERNAME_TAKEN" && result.suggestion) {
        setError(result.error || "Username is already taken");
        setUsernameSuggestion(result.suggestion);
      } else {
        setError(result.error || "Failed to join city chat");
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {locationStep === "initial" && (
          <div className="space-y-8">
            <CurrentCityCard />
            <HeroSection onLocationRequest={handleLocationRequest} />
          </div>
        )}

        {locationStep === "requesting" && (
          <LocationPermission
            isLoading={isLoading}
            onManualEntry={() => setLocationStep("manual")}
          />
        )}

        {locationStep === "manual" && (
          <ManualLocation
            value={manualLocation}
            onChange={setManualLocation}
            onSubmit={handleManualLocation}
            onUseCurrentLocation={handleLocationRequest}
            isLoading={isLoading}
            error={error}
          />
        )}

        {locationStep === "confirming" && locationData && (
          <LocationConfirmation
            locationData={locationData}
            onConfirm={handleConfirmLocation}
            onChangeLocation={handleChangeLocation}
            isLoading={isLoading}
          />
        )}

        {locationStep === "username" && locationData && (
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
      </main>
    </div>
  );
}
