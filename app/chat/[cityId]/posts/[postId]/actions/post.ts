import { cache } from "react";
import { convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { notFound } from "next/navigation";

async function _getPostData(postId: string, cityId: string) {
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

export const getPostData = cache(_getPostData);
