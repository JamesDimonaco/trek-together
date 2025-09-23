"use client";

import { useState } from "react";
import { MapPin, Users, MessageCircle, Mountain, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface LocationData {
  city: string;
  state?: string;
  country: string;
  formattedAddress: string;
  location: {
    lat: number;
    lng: number;
  };
}

export default function Home() {
  const [locationStep, setLocationStep] = useState<"initial" | "requesting" | "manual" | "confirming">("initial");
  const [manualLocation, setManualLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [error, setError] = useState<string>("");

  const handleLocationRequest = async () => {
    setLocationStep("requesting");
    setIsLoading(true);
    setError("");

    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by your browser");
      setLocationStep("manual");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log("Location obtained:", {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });

        // Reverse geocode to get city
        try {
          const response = await fetch("/api/geocode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            setLocationData(data);
            setLocationStep("confirming");
          } else {
            setError("Could not determine your city. Please enter it manually.");
            setLocationStep("manual");
          }
        } catch (err) {
          console.error("Geocoding error:", err);
          setError("Failed to determine location. Please enter manually.");
          setLocationStep("manual");
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        console.error("Location error:", error.message);
        setLocationStep("manual");
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  const handleManualLocation = async () => {
    if (!manualLocation.trim()) return;
    
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: manualLocation,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLocationData(data);
        setLocationStep("confirming");
      } else {
        setError("Could not find that location. Please try again.");
      }
    } catch (err) {
      console.error("Geocoding error:", err);
      setError("Failed to find location. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmLocation = () => {
    if (locationData) {
      console.log("Confirmed location:", locationData);
      // TODO: Save to Convex and redirect to city chat
    }
  };

  const handleChangeLocation = () => {
    setLocationStep("manual");
    setLocationData(null);
    setManualLocation("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {locationStep === "initial" && (
          <div className="space-y-12 text-center">
            {/* Hero Section */}
            <div className="space-y-4">
              <div className="flex justify-center">
                <Mountain className="h-16 w-16 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-5xl font-bold text-gray-900 dark:text-white">
                TrekTogether
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Connect with fellow trekkers and outdoor enthusiasts in your city. 
                Join real-time conversations and plan your next adventure together.
              </p>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <Card>
                <CardHeader>
                  <MapPin className="h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
                  <CardTitle className="text-lg">City-Based Chats</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Join local trekking communities instantly based on your location
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
                  <CardTitle className="text-lg">Meet Adventurers</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Connect with like-minded outdoor enthusiasts near you
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <MessageCircle className="h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
                  <CardTitle className="text-lg">Real-Time Chat</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Plan trips, share tips, and coordinate meetups instantly
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            {/* CTA */}
            <div className="space-y-4">
              <Button
                onClick={handleLocationRequest}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg rounded-full"
              >
                <MapPin className="mr-2 h-5 w-5" />
                Find Trekkers Near Me
              </Button>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No sign-up required • Start chatting instantly
              </p>
            </div>
          </div>
        )}

        {locationStep === "requesting" && (
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <MapPin className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4 animate-pulse" />
              <CardTitle className="text-2xl">
                {isLoading ? "Finding your location..." : "Enable Location Access"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-left space-y-3">
                <p className="font-medium">We need your location to:</p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Connect you with trekkers in your city</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Show relevant outdoor activities nearby</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Help you find local hiking groups</span>
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground pt-2">
                  Your location is only used to identify your city and is never stored or shared.
                </p>
              </div>
              
              {!isLoading && (
                <Button
                  variant="link"
                  onClick={() => setLocationStep("manual")}
                  className="w-full"
                >
                  Enter location manually instead
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {locationStep === "manual" && (
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Where are you located?</CardTitle>
              <CardDescription>
                Enter your city to connect with local trekkers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="text"
                placeholder="e.g., San Francisco, Boulder, Seattle..."
                value={manualLocation}
                onChange={(e) => setManualLocation(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && manualLocation.trim()) {
                    handleManualLocation();
                  }
                }}
                className="w-full"
              />
              
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
              
              <Button
                onClick={handleManualLocation}
                disabled={!manualLocation.trim() || isLoading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finding location...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
              
              <Button
                variant="ghost"
                onClick={handleLocationRequest}
                className="w-full"
                disabled={isLoading}
              >
                ← Use my current location instead
              </Button>
            </CardContent>
          </Card>
        )}

        {locationStep === "confirming" && locationData && (
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <MapPin className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
              <CardTitle className="text-2xl">Is this correct?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {locationData.city}
                  {locationData.state && `, ${locationData.state}`}
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  {locationData.country}
                </p>
                <p className="text-sm text-muted-foreground">
                  {locationData.formattedAddress}
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleConfirmLocation}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  Yes, join {locationData.city} trekkers
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleChangeLocation}
                  className="w-full"
                >
                  No, change location
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                You'll join the public chat for {locationData.city} where you can connect with other trekkers
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}