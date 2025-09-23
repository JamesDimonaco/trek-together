import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { COOKIE_NAMES } from "@/lib/utils/session";
import { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET() {
  try {
    const cookieStore = await cookies();
    const user = await currentUser();
    
    // Try to get current city from database for authenticated users
    if (user) {
      try {
        const convexUser = await convex.query(api.users.getUserByAuthId, {
          authId: user.id,
        });
        
        if (convexUser?.currentCityId) {
          const currentCity = await convex.query(api.cities.getCityById, {
            cityId: convexUser.currentCityId,
          });
          
          if (currentCity) {
            return NextResponse.json({
              success: true,
              city: currentCity,
              source: "database",
            });
          }
        }
      } catch (error) {
        console.error("Failed to get current city from database:", error);
      }
    }
    
    // Fallback to cookie-based current city
    const currentCityId = cookieStore.get(COOKIE_NAMES.CURRENT_CITY)?.value;
    
    if (currentCityId) {
      try {
        // Validate cityId format before querying
        if (!/^[0-9a-v]{32}$/i.test(currentCityId)) {
          return NextResponse.json({
            success: false,
            error: "Invalid city ID format",
          });
        }
        
        const currentCity = await convex.query(api.cities.getCityById, {
          cityId: currentCityId as Id<"cities">,
        });
        
        if (currentCity) {
          return NextResponse.json({
            success: true,
            city: currentCity,
            source: "cookie",
          });
        }
      } catch (error) {
        console.error("Failed to get city from cookie:", error);
      }
    }
    
    return NextResponse.json({
      success: false,
      city: null,
      message: "No current city found",
    });
    
  } catch (error) {
    console.error("Current city API error:", error);
    return NextResponse.json(
      { error: "Failed to get current city" },
      { status: 500 }
    );
  }
}