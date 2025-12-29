import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { currentUser } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { COOKIE_NAMES } from "@/lib/utils/session";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const body = await request.json();
    const { city, country, lat, lng, username: providedUsername } = body;

    // Validate required fields
    if (!city || !country || lat == null || lng == null) {
      return NextResponse.json(
        { error: "Missing required fields: city, country, lat, lng" },
        { status: 400 }
      );
    }

    // Validate coordinate ranges
    if (
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid coordinates: lat must be [-90,90], lng must be [-180,180]",
        },
        { status: 400 }
      );
    }

    // Create or find city in Convex first (doesn't require user)
    const cityId = await convex.mutation(api.cities.createCity, {
      name: city,
      country,
      lat,
      lng,
    });

    if (process.env.NODE_ENV === "development") {
      console.log("Join city debug:", {
        requestedCity: city,
        requestedCountry: country,
        returnedCityId: cityId,
      });
    }

    // Check if user is authenticated via Clerk first
    const clerkUser = await currentUser();
    let userId: Id<"users">;
    let username: string;

    if (clerkUser) {
      // Authenticated user - look up by authId
      const existingUser = await convex.query(api.users.getUserByAuthId, {
        authId: clerkUser.id,
      });

      if (existingUser) {
        userId = existingUser._id;
        username = existingUser.username;
      } else {
        // This shouldn't happen normally, but handle it by creating the user
        username = clerkUser.username || clerkUser.firstName || `user-${clerkUser.id.slice(-8)}`;
        const primaryEmail = clerkUser.emailAddresses.find(
          (email) => email.id === clerkUser.primaryEmailAddressId
        )?.emailAddress;

        userId = await convex.mutation(api.users.upsertUser, {
          authId: clerkUser.id,
          username,
          avatarUrl: clerkUser.imageUrl,
          email: primaryEmail,
        });
      }
    } else {
      // Guest user - use sessionId flow
      const sessionId = cookieStore.get(COOKIE_NAMES.SESSION_ID)?.value;
      username = cookieStore.get(COOKIE_NAMES.USERNAME)?.value || "";

      if (!sessionId) {
        return NextResponse.json({ error: "No session found" }, { status: 401 });
      }

      // Update username if provided
      if (providedUsername && providedUsername.trim()) {
        username = providedUsername.trim();
        cookieStore.set(COOKIE_NAMES.USERNAME, username || "anonymous", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 365,
        });
      }

      if (!username) {
        return NextResponse.json({ error: "Username required" }, { status: 400 });
      }

      // Create or update guest user in Convex
      try {
        userId = await convex.mutation(api.users.createGuestUser, {
          sessionId,
          username,
        });
      } catch (error) {
        // Check if this is a username taken error
        if (error instanceof Error) {
          try {
            const errorData = JSON.parse(error.message);
            if (errorData.code === "USERNAME_TAKEN") {
              return NextResponse.json(
                {
                  error: errorData.message,
                  code: errorData.code,
                  suggestion: errorData.suggestion
                },
                { status: 409 } // 409 Conflict for username taken
              );
            }
          } catch {
            // Not a JSON error, continue to generic error handling
          }
        }
        // Re-throw if not a username error
        throw error;
      }
    }

    // Join city - atomic operation that adds to visited cities and sets as current
    await convex.mutation(api.users.joinCity, {
      userId,
      cityId,
    });

    // Store city and user info in cookies
    cookieStore.set(COOKIE_NAMES.CURRENT_CITY, cityId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });

    cookieStore.set(COOKIE_NAMES.USER_ID, userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });

    return NextResponse.json({
      success: true,
      cityId,
      userId,
      username,
      redirectUrl: `/chat/${cityId}`,
    });
  } catch (error) {
    console.error("Join city error:", error);
    return NextResponse.json({ error: "Failed to join city" }, { status: 500 });
  }
}
