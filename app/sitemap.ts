import { MetadataRoute } from "next";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is required");
}
const convex = new ConvexHttpClient(convexUrl);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://trektogether.app";

  try {
    // Fetch all cities and countries from Convex
    const [cities, countries] = await Promise.all([
      convex.query(api.cities.getCities),
      convex.query(api.countries.getAllCountries),
    ]);

    // Generate city pages
    const cityPages = cities.map((city) => ({
      url: `${baseUrl}/chat/${city._id}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));

    // Generate country pages
    const countryPages = countries.map((country) => ({
      url: `${baseUrl}/chat/country/${country.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));

    // Return sitemap with homepage + cities page + all city pages + all country pages
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1,
      },
      {
        url: `${baseUrl}/cities`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      },
      ...cityPages,
      ...countryPages,
    ];
  } catch (error) {
    console.error("Failed to generate sitemap:", error);
    // Return at least the homepage if Convex fails
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1,
      },
    ];
  }
}
