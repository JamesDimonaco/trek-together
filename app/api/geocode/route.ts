import { NextRequest, NextResponse } from "next/server";
import { Client } from "@googlemaps/google-maps-services-js";

const client = new Client({});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lat, lng, address } = body;

    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { error: "Google Maps API key not configured" },
        { status: 500 }
      );
    }

    // Reverse geocoding (lat/lng to address)
    if (lat !== undefined && lng !== undefined) {
      const response = await client.reverseGeocode({
        params: {
          latlng: { lat, lng },
          key: process.env.GOOGLE_MAPS_API_KEY,
          // Remove result_type restriction to allow all address component types
        },
      });

      if (response.data.results.length > 0) {
        const result = response.data.results[0];
        
        // Extract city and country from address components
        let city = "";
        let country = "";
        let state = "";
        
        for (const component of result.address_components) {
          const types = component.types as string[];
          if (types.includes("locality")) {
            city = component.long_name;
          }
          if (types.includes("administrative_area_level_1")) {
            state = component.short_name;
          }
          if (types.includes("country")) {
            country = component.long_name;
          }
        }

        // Fallback to broader area if no locality found
        if (!city) {
          for (const component of result.address_components) {
            const types = component.types as string[];
            if (types.includes("administrative_area_level_2") || 
                types.includes("administrative_area_level_3")) {
              city = component.long_name;
              break;
            }
          }
        }

        return NextResponse.json({
          city: city || "Unknown",
          state,
          country: country || "Unknown",
          formattedAddress: result.formatted_address,
          location: {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
          },
        });
      }
      
      return NextResponse.json(
        { error: "No location found" },
        { status: 404 }
      );
    }

    // Forward geocoding (address to lat/lng)
    if (address) {
      const response = await client.geocode({
        params: {
          address,
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      });

      if (response.data.results.length > 0) {
        const result = response.data.results[0];
        
        // Extract city and country
        let city = "";
        let country = "";
        let state = "";
        
        for (const component of result.address_components) {
          const types = component.types as string[];
          if (types.includes("locality")) {
            city = component.long_name;
          }
          if (types.includes("administrative_area_level_1")) {
            state = component.short_name;
          }
          if (types.includes("country")) {
            country = component.long_name;
          }
        }

        // For broad searches, try to extract city from formatted address
        if (!city && result.formatted_address) {
          const parts = result.formatted_address.split(",");
          if (parts.length > 0) {
            city = parts[0].trim();
          }
        }

        return NextResponse.json({
          city: city || address,
          state,
          country: country || "Unknown",
          formattedAddress: result.formatted_address,
          location: {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
          },
        });
      }
      
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Invalid request: provide either lat/lng or address" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Geocoding error:", error);
    return NextResponse.json(
      { error: "Failed to geocode location" },
      { status: 500 }
    );
  }
}