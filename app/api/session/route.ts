import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { generateSessionId, generateAnonymousUsername, COOKIE_NAMES } from "@/lib/utils/session";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  
  // Check if user is authenticated with Clerk
  const user = await currentUser();
  
  if (user) {
    // User is authenticated - get their data from Convex
    try {
      const convexUser = await convex.query(api.users.getUserByAuthId, {
        authId: user.id,
      });
      
      if (convexUser) {
        return NextResponse.json({
          sessionId: convexUser._id, // Use Convex user ID as session ID for auth users
          userId: convexUser._id,
          username: convexUser.username,
          currentCity: cookieStore.get(COOKIE_NAMES.CURRENT_CITY)?.value,
          isAnonymous: false,
          isAuthenticated: true,
        });
      }
    } catch (error) {
      console.error("Failed to get authenticated user from Convex:", error);
    }
  }
  
  // Fallback to cookie-based session (anonymous or not synced yet)
  const sessionId = cookieStore.get(COOKIE_NAMES.SESSION_ID)?.value;
  const userId = cookieStore.get(COOKIE_NAMES.USER_ID)?.value;
  const username = cookieStore.get(COOKIE_NAMES.USERNAME)?.value;
  const currentCity = cookieStore.get(COOKIE_NAMES.CURRENT_CITY)?.value;

  return NextResponse.json({
    sessionId,
    userId,
    username,
    currentCity,
    isAnonymous: !user, // Anonymous if no Clerk user
    isAuthenticated: !!user,
  });
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const body = await request.json();
  const { action, username: providedUsername, cityId } = body;

  if (action === "initialize") {
    // Check if user is authenticated with Clerk
    const user = await currentUser();
    
    if (user) {
      // User is authenticated - check if they exist in Convex
      try {
        const convexUser = await convex.query(api.users.getUserByAuthId, {
          authId: user.id,
        });
        
        if (convexUser) {
          // Return authenticated user data
          return NextResponse.json({
            sessionId: convexUser._id,
            userId: convexUser._id,
            username: convexUser.username,
            isAnonymous: false,
            isAuthenticated: true,
          });
        }
      } catch (error) {
        console.error("Failed to get authenticated user:", error);
      }
    }

    // Handle anonymous session initialization
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
      isAnonymous: !user,
      isAuthenticated: !!user,
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