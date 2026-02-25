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
    if (process.env.NODE_ENV === "development") {
      console.log("getCityData called with ID:", cityId);
    }

    // Validate that cityId matches Convex ID format
    // Convex IDs are alphanumeric - typically 28-34 characters
    if (!cityId || !/^[0-9a-z]{28,34}$/i.test(cityId)) {
      console.log("Invalid cityId format:", cityId);
      notFound();
    }

    const city = await convex.query(api.cities.getCityById, {
      cityId: cityId as Id<"cities">,
    });

    if (!city) {
      console.log("City not found in database:", cityId);
      notFound();
    }

    if (process.env.NODE_ENV === "development") {
      console.log("Found city:", city);
    }

    // Ensure the country record exists so country chat links work
    const country = await convex.mutation(api.countries.getOrCreateCountry, {
      name: city.country,
    });

    return {
      ...city,
      countrySlug: country?.slug,
    };
  } catch (error) {
    console.error("Failed to fetch city:", error);
    notFound();
  }
}
