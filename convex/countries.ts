import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Helper function to generate URL-safe slug from country name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .trim();
}

// Get or create a country by name (upsert)
export const getOrCreateCountry = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if country already exists
    const existing = await ctx.db
      .query("countries")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existing) {
      return existing;
    }

    // Create new country with generated slug
    const slug = generateSlug(args.name);
    const countryId = await ctx.db.insert("countries", {
      name: args.name,
      slug,
    });

    return await ctx.db.get(countryId);
  },
});

// Get country by slug (for routing)
export const getCountryBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("countries")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

// Get country by ID
export const getCountryById = query({
  args: { countryId: v.id("countries") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.countryId);
  },
});

// Get all countries
export const getAllCountries = query({
  handler: async (ctx) => {
    return await ctx.db.query("countries").collect();
  },
});

// Get all countries with stats (city count, active users)
export const getCountriesWithStats = query({
  handler: async (ctx) => {
    const countries = await ctx.db.query("countries").collect();
    const cities = await ctx.db.query("cities").collect();
    const users = await ctx.db.query("users").collect();
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

    return countries.map((country) => {
      // Get cities in this country
      const countryCities = cities.filter((c) => c.country === country.name);
      const cityIds = new Set(countryCities.map((c) => c._id));

      // Count active users across all cities in this country
      const activeUsers = users.filter(
        (user) =>
          user.currentCityId &&
          cityIds.has(user.currentCityId) &&
          user.lastSeen &&
          user.lastSeen > tenMinutesAgo
      ).length;

      return {
        ...country,
        cityCount: countryCities.length,
        activeUsers,
      };
    }).sort((a, b) => b.activeUsers - a.activeUsers);
  },
});

// Get active user count for a specific country
export const getActiveCountryUsers = query({
  args: { countryId: v.id("countries") },
  handler: async (ctx, args) => {
    const country = await ctx.db.get(args.countryId);
    if (!country) return 0;

    const cities = await ctx.db.query("cities").collect();
    const countryCities = cities.filter((c) => c.country === country.name);
    const cityIds = new Set(countryCities.map((c) => c._id));

    const users = await ctx.db.query("users").collect();
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

    return users.filter(
      (user) =>
        user.currentCityId &&
        cityIds.has(user.currentCityId) &&
        user.lastSeen &&
        user.lastSeen > tenMinutesAgo
    ).length;
  },
});

// Get cities for a specific country
export const getCitiesForCountry = query({
  args: { countryId: v.id("countries") },
  handler: async (ctx, args) => {
    const country = await ctx.db.get(args.countryId);
    if (!country) return [];

    const cities = await ctx.db.query("cities").collect();
    const users = await ctx.db.query("users").collect();
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

    return cities
      .filter((c) => c.country === country.name)
      .map((city) => {
        const activeCount = users.filter(
          (user) =>
            user.currentCityId === city._id &&
            user.lastSeen &&
            user.lastSeen > tenMinutesAgo
        ).length;

        return {
          ...city,
          activeUsers: activeCount,
        };
      })
      .sort((a, b) => b.activeUsers - a.activeUsers);
  },
});

// Migration: Create countries from existing cities
export const migrateCountriesFromCities = mutation({
  handler: async (ctx) => {
    const cities = await ctx.db.query("cities").collect();
    const existingCountries = await ctx.db.query("countries").collect();
    const existingNames = new Set(existingCountries.map((c) => c.name));

    // Get unique country names from cities
    const uniqueCountryNames = [...new Set(cities.map((c) => c.country))];

    const created: string[] = [];
    for (const countryName of uniqueCountryNames) {
      if (!existingNames.has(countryName)) {
        const slug = generateSlug(countryName);
        await ctx.db.insert("countries", {
          name: countryName,
          slug,
        });
        created.push(countryName);
      }
    }

    return {
      message: `Migration complete. Created ${created.length} countries.`,
      created,
    };
  },
});
