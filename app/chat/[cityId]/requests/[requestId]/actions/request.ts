import { cache } from "react";
import { convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { notFound } from "next/navigation";

async function _getRequestData(requestId: string, cityId: string) {
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

export const getRequestData = cache(_getRequestData);
