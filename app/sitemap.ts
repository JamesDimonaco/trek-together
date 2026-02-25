import { MetadataRoute } from "next";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export const revalidate = 3600; // Regenerate sitemap every hour

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is required");
}
const convex = new ConvexHttpClient(convexUrl);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://trektogether.app";

  try {
    // Fetch all cities, countries, posts, and requests from Convex
    const [cities, countries, postIds, requestIds] = await Promise.all([
      convex.query(api.cities.getCities),
      convex.query(api.countries.getAllCountries),
      convex.query(api.posts.getAllPostIds),
      convex.query(api.requests.getAllRequestIds),
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

    // Generate post pages
    const postPages = postIds.map((post) => ({
      url: `${baseUrl}/chat/${post.cityId}/posts/${post._id}`,
      lastModified: new Date(post._creationTime),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    // Generate request pages
    const requestPages = requestIds.map((request) => ({
      url: `${baseUrl}/chat/${request.cityId}/requests/${request._id}`,
      lastModified: new Date(request._creationTime),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));

    // Return sitemap with homepage + cities page + all city pages + all country pages + posts + requests
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
      ...postPages,
      ...requestPages,
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
