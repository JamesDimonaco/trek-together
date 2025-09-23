import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { notFound } from "next/navigation";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function getCityData(cityId: string) {
  try {
    const city = await convex.query(api.cities.getCityById, { 
      cityId: cityId as Id<"cities"> 
    });
    
    if (!city) {
      notFound();
    }
    
    return city;
  } catch (error) {
    console.error("Failed to fetch city:", error);
    notFound();
  }
}