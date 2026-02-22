import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { notFound } from "next/navigation";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is required");
}
const convex = new ConvexHttpClient(convexUrl);

export async function getPostData(postId: string, cityId: string) {
  try {
    // Validate that postId matches Convex ID format
    if (!postId || !/^[0-9a-z]{28,34}$/i.test(postId)) {
      notFound();
    }

    const post = await convex.query(api.posts.getPostById, {
      postId: postId as Id<"posts">,
    });

    if (!post) {
      notFound();
    }

    // Verify post belongs to the city in the URL (prevent duplicate content)
    if (post.cityId !== cityId) {
      notFound();
    }

    return post;
  } catch (error) {
    // Re-throw Next.js notFound errors
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    console.error("Failed to fetch post:", error);
    notFound();
  }
}
