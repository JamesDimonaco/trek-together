import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { notFound } from "next/navigation";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is required");
}
const convex = new ConvexHttpClient(convexUrl);

export async function getCityData(cityId: string) {
  try {
    // Validate that cityId matches Convex ID format
    // Convex IDs are alphanumeric strings (typically 32 chars)
    if (!cityId || !/^[a-z0-9]{32}$/.test(cityId)) {
      notFound();
    }
    
    const city = await convex.query(api.cities.getCityById, {
      cityId: cityId as Id<"cities">,
    });

    if (!city) {
      notFound();
    }

    return city;
  } catch (error) {
    console.error("Failed to fetch city:", error);
    notFound();
  }
}
