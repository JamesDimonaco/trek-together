import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { COOKIE_NAMES } from "@/lib/utils/session";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const body = await request.json();
    const { city, state, country, lat, lng, username: providedUsername } = body;

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

    // Get session info from cookies
    const sessionId = cookieStore.get(COOKIE_NAMES.SESSION_ID)?.value;
    let username = cookieStore.get(COOKIE_NAMES.USERNAME)?.value;

    if (!sessionId) {
      return NextResponse.json({ error: "No session found" }, { status: 401 });
    }

    // Update username if provided
    if (providedUsername) {
      username = providedUsername;
      cookieStore.set(COOKIE_NAMES.USERNAME, username, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    if (!username) {
      return NextResponse.json({ error: "Username required" }, { status: 400 });
    }

    // Create or find city in Convex
    const cityId = await convex.mutation(api.cities.createCity, {
      name: city,
      country,
      lat,
      lng,
    });

    // Create or update user in Convex
    const userId = await convex.mutation(api.users.createGuestUser, {
      sessionId,
      username,
    });

    // Add city to user's visited cities and set as current
    await convex.mutation(api.users.addVisitedCity, {
      userId,
      cityId,
    });

    // Update user's current city in database
    await convex.mutation(api.users.updateCurrentCity, {
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
