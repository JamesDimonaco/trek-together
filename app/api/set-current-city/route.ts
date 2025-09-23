import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { COOKIE_NAMES } from "@/lib/utils/session";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL ||
    (() => {
      throw new Error(
        "NEXT_PUBLIC_CONVEX_URL environment variable is required"
      );
    })()
);

export async function POST(request: NextRequest) {
  try {
    const { cityId } = await request.json();

    if (!cityId || !/^[0-9a-z]{28,34}$/i.test(cityId)) {
      return NextResponse.json({ error: "Invalid city ID" }, { status: 400 });
    }

    // Verify city exists before proceeding
    const city = await convex.query(api.cities.getCityById, {
      cityId: cityId as Id<"cities">,
    });

    if (!city) {
      return NextResponse.json({ error: "City not found" }, { status: 404 });
    }

    const cookieStore = await cookies();
    const user = await currentUser();

    // Update cookie
    cookieStore.set(COOKIE_NAMES.CURRENT_CITY, cityId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Update database for authenticated users
    if (user) {
      try {
        const convexUser = await convex.query(api.users.getUserByAuthId, {
          authId: user.id,
        });

        if (convexUser) {
          await convex.mutation(api.users.joinCity, {
            userId: convexUser._id,
            cityId: cityId as Id<"cities">,
          });
        }
      } catch (error) {
        console.error("Failed to update current city in database:", error);
        // Don't fail the request if database update fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Set current city error:", error);
    return NextResponse.json(
      { error: "Failed to set current city" },
      { status: 500 }
    );
  }
}
