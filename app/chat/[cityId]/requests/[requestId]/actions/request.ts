import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { notFound } from "next/navigation";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is required");
}
const convex = new ConvexHttpClient(convexUrl);

export async function getRequestData(requestId: string, cityId: string) {
  try {
    // Validate that requestId matches Convex ID format
    if (!requestId || !/^[0-9a-z]{28,34}$/i.test(requestId)) {
      notFound();
    }

    const request = await convex.query(api.requests.getRequestById, {
      requestId: requestId as Id<"requests">,
    });

    if (!request) {
      notFound();
    }

    // Verify request belongs to the city in the URL (prevent duplicate content)
    if (request.cityId !== cityId) {
      notFound();
    }

    return request;
  } catch (error) {
    // Re-throw Next.js notFound errors
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    console.error("Failed to fetch request:", error);
    notFound();
  }
}
