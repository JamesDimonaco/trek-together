import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is required");
}
const convex = new ConvexHttpClient(convexUrl);

export async function getCountryData(countrySlug: string) {
  try {
    if (process.env.NODE_ENV === "development") {
      console.log("getCountryData called with slug:", countrySlug);
    }

    // Validate that countrySlug is a valid URL slug format
    if (!countrySlug || !/^[a-z0-9-]+$/.test(countrySlug)) {
      console.log("Invalid countrySlug format:", countrySlug);
      notFound();
    }

    const country = await convex.query(api.countries.getCountryBySlug, {
      slug: countrySlug,
    });

    if (!country) {
      console.log("Country not found in database:", countrySlug);
      notFound();
    }

    if (process.env.NODE_ENV === "development") {
      console.log("Found country:", country);
    }

    return country;
  } catch (error) {
    console.error("Failed to fetch country:", error);
    notFound();
  }
}
