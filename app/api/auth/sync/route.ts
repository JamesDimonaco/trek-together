import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { COOKIE_NAMES } from "@/lib/utils/session";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    // Get current authenticated user from Clerk
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    const sessionId = cookieStore.get(COOKIE_NAMES.SESSION_ID)?.value;
    const currentUsername = cookieStore.get(COOKIE_NAMES.USERNAME)?.value;

    // Prepare user data for Convex
    const username = 
      user.username || 
      user.firstName || 
      currentUsername || // Use existing anonymous username if available
      `user-${user.id.slice(-8)}`;

    console.log("Syncing authenticated user (fallback):", {
      authId: user.id,
      username,
      sessionId,
    });

    // Handle migration if user was anonymous before
    if (sessionId && currentUsername) {
      console.log("Migrating anonymous user to authenticated:", {
        sessionId,
        authId: user.id,
        username,
      });

      // Check if anonymous user exists
      const existingUser = await convex.query(api.users.getUserBySessionId, {
        sessionId,
      });

      if (existingUser) {
        // Migrate: update the existing user to be authenticated
        await convex.mutation(api.users.migrateToAuthenticated, {
          userId: existingUser._id,
          authId: user.id,
          username,
          avatarUrl: user.imageUrl,
        });

        return NextResponse.json({
          success: true,
          migrated: true,
          userId: existingUser._id,
          username,
        });
      }
    }

    // Create or update authenticated user
    const userId = await convex.mutation(api.users.upsertUser, {
      authId: user.id,
      username,
      avatarUrl: user.imageUrl,
    });

    // Update cookies to reflect authenticated state
    cookieStore.set(COOKIE_NAMES.USER_ID, userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });

    cookieStore.set(COOKIE_NAMES.USERNAME, username, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });

    return NextResponse.json({
      success: true,
      migrated: false,
      userId,
      username,
    });
  } catch (error) {
    console.error("Auth sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync user data" },
      { status: 500 }
    );
  }
}