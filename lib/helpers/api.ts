import { LocationData, SessionData } from "@/lib/types";

// Session API helpers
export async function initializeSession(): Promise<SessionData | null> {
  try {
    const response = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "initialize" }),
    });

    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (err) {
    console.error("Failed to initialize session:", err);
    return null;
  }
}

export async function updateUsername(username: string): Promise<boolean> {
  try {
    const response = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "updateUsername",
        username,
      }),
    });
    return response.ok;
  } catch (err) {
    console.error("Failed to update username:", err);
    return false;
  }
}

// Geocoding API helpers
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<LocationData | null> {
  try {
    const response = await fetch("/api/geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lng }),
    });

    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (err) {
    console.error("Geocoding error:", err);
    return null;
  }
}

export async function geocodeAddress(
  address: string
): Promise<LocationData | null> {
  try {
    const response = await fetch("/api/geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });

    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (err) {
    console.error("Geocoding error:", err);
    return null;
  }
}

// Join city API helper
export async function joinCity(
  locationData: LocationData,
  username?: string
): Promise<{ success: boolean; redirectUrl?: string; error?: string }> {
  try {
    const response = await fetch("/api/join-city", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city: locationData.city,
        state: locationData.state,
        country: locationData.country,
        lat: locationData.location.lat,
        lng: locationData.location.lng,
        username,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, redirectUrl: data.redirectUrl };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || "Failed to join city chat",
      };
    }
  } catch (err) {
    console.error("Join city error:", err);
    return {
      success: false,
      error: "Failed to join city chat. Please try again.",
    };
  }
}

// Geolocation helper
// Current city helpers
export async function getCurrentCity(): Promise<any | null> {
  try {
    const response = await fetch("/api/current-city");
    if (response.ok) {
      const data = await response.json();
      return data.success ? data.city : null;
    }
    return null;
  } catch (err) {
    console.error("Failed to get current city:", err);
    return null;
  }
}

export async function setCurrentCity(cityId: string): Promise<boolean> {
  try {
    const response = await fetch("/api/set-current-city", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cityId }),
    });
    return response.ok;
  } catch (err) {
    console.error("Failed to set current city:", err);
    return false;
  }
}

// Geolocation helper
export function requestGeolocation(
  onSuccess: (position: GeolocationPosition) => void,
  onError: (error: GeolocationPositionError) => void
) {
  if (!navigator.geolocation) {
    onError({
      code: 0,
      message: "Geolocation is not supported by your browser",
    } as GeolocationPositionError);
    return;
  }

  navigator.geolocation.getCurrentPosition(onSuccess, onError, {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0,
  });
}
