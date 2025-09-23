import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateSessionId, generateAnonymousUsername, COOKIE_NAMES } from "@/lib/utils/session";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  
  const sessionId = cookieStore.get(COOKIE_NAMES.SESSION_ID)?.value;
  const userId = cookieStore.get(COOKIE_NAMES.USER_ID)?.value;
  const username = cookieStore.get(COOKIE_NAMES.USERNAME)?.value;
  const currentCity = cookieStore.get(COOKIE_NAMES.CURRENT_CITY)?.value;

  return NextResponse.json({
    sessionId,
    userId,
    username,
    currentCity,
    isAnonymous: !userId || userId === sessionId,
  });
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const body = await request.json();
  const { action, username: providedUsername, cityId } = body;

  if (action === "initialize") {
    // Check if session already exists
    let sessionId = cookieStore.get(COOKIE_NAMES.SESSION_ID)?.value;
    let username = cookieStore.get(COOKIE_NAMES.USERNAME)?.value;
    let userId = cookieStore.get(COOKIE_NAMES.USER_ID)?.value;

    // Create new session if doesn't exist
    if (!sessionId) {
      sessionId = generateSessionId();
      cookieStore.set(COOKIE_NAMES.SESSION_ID, sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
    }

    // Set anonymous username if no username exists
    if (!username) {
      username = generateAnonymousUsername();
      cookieStore.set(COOKIE_NAMES.USERNAME, username, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    // For anonymous users, userId is the same as sessionId
    if (!userId) {
      userId = sessionId;
      cookieStore.set(COOKIE_NAMES.USER_ID, userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    return NextResponse.json({
      sessionId,
      userId,
      username,
      isAnonymous: userId === sessionId,
    });
  }

  if (action === "updateUsername") {
    // Update username (user choosing to not be anonymous)
    const newUsername = providedUsername || generateAnonymousUsername();
    
    cookieStore.set(COOKIE_NAMES.USERNAME, newUsername, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });

    return NextResponse.json({
      username: newUsername,
      success: true,
    });
  }

  if (action === "setCity") {
    // Set current city
    cookieStore.set(COOKIE_NAMES.CURRENT_CITY, cityId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({
      cityId,
      success: true,
    });
  }

  return NextResponse.json(
    { error: "Invalid action" },
    { status: 400 }
  );
}