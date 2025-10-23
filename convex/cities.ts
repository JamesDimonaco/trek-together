import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new city
export const createCity = mutation({
  args: {
    name: v.string(),
    country: v.string(),
    lat: v.float64(),
    lng: v.float64(),
  },
  handler: async (ctx, args) => {
    // Check if city already exists
    const existing = await ctx.db
      .query("cities")
      .withIndex("by_name_country", (q) =>
        q.eq("name", args.name).eq("country", args.country)
      )
      .first();
    
    if (existing) {
      return existing._id;
    }
    
    return await ctx.db.insert("cities", {
      name: args.name,
      country: args.country,
      lat: args.lat,
      lng: args.lng,
    });
  },
});

// Get all cities
export const getCities = query({
  handler: async (ctx) => {
    return await ctx.db.query("cities").collect();
  },
});

// Get city by ID
export const getCityById = query({
  args: { cityId: v.id("cities") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.cityId);
  },
});

// Find city by name and country
export const findCity = query({
  args: {
    name: v.string(),
    country: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cities")
      .withIndex("by_name_country", (q) =>
        q.eq("name", args.name).eq("country", args.country)
      )
      .first();
  },
});

// Search cities by name or country
export const searchCities = query({
  args: {
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const cities = await ctx.db.query("cities").collect();

    const searchLower = args.searchTerm.toLowerCase();

    return cities.filter(city =>
      city.name.toLowerCase().includes(searchLower) ||
      city.country.toLowerCase().includes(searchLower)
    );
  },
});

// Get cities with active user counts
export const getCitiesWithActiveUsers = query({
  handler: async (ctx) => {
    const cities = await ctx.db.query("cities").collect();
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

    // Get all users
    const users = await ctx.db.query("users").collect();

    // Map cities with their active user counts
    return cities.map(city => {
      const activeCount = users.filter(user =>
        user.currentCityId === city._id &&
        user.lastSeen &&
        user.lastSeen > tenMinutesAgo
      ).length;

      return {
        ...city,
        activeUsers: activeCount,
      };
    }).sort((a, b) => b.activeUsers - a.activeUsers); // Sort by most active
  },
});

// Find nearest city (this would typically involve more complex geospatial queries)
// For MVP, we'll do a simple distance calculation
export const findNearestCity = query({
  args: {
    lat: v.float64(),
    lng: v.float64(),
  },
  handler: async (ctx, args) => {
    const cities = await ctx.db.query("cities").collect();
    
    if (cities.length === 0) {
      return null;
    }
    
    // Calculate distances and find nearest
    let nearestCity = cities[0];
    let minDistance = calculateDistance(
      args.lat,
      args.lng,
      cities[0].lat,
      cities[0].lng
    );
    
    for (const city of cities.slice(1)) {
      const distance = calculateDistance(
        args.lat,
        args.lng,
        city.lat,
        city.lng
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = city;
      }
    }
    
    return nearestCity;
  },
});

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}