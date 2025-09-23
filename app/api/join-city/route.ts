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

    // Get session info from cookies
    const sessionId = cookieStore.get(COOKIE_NAMES.SESSION_ID)?.value;
    let username = cookieStore.get(COOKIE_NAMES.USERNAME)?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: "No session found" },
        { status: 401 }
      );
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
      return NextResponse.json(
        { error: "Username required" },
        { status: 400 }
      );
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

    // Add city to user's visited cities
    await convex.mutation(api.users.addVisitedCity, {
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
    return NextResponse.json(
      { error: "Failed to join city" },
      { status: 500 }
    );
  }
}