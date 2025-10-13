import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create or update user (for authenticated users)
export const upsertUser = mutation({
  args: {
    authId: v.string(),
    username: v.string(),
    avatarUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    whatsappNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", args.authId))
      .first();
    
    if (existing) {
      // Update existing user
      await ctx.db.patch(existing._id, {
        username: args.username,
        avatarUrl: args.avatarUrl,
        bio: args.bio,
        whatsappNumber: args.whatsappNumber,
      });
      return existing._id;
    }
    
    // Create new user
    return await ctx.db.insert("users", {
      authId: args.authId,
      username: args.username,
      avatarUrl: args.avatarUrl,
      bio: args.bio,
      whatsappNumber: args.whatsappNumber,
      citiesVisited: [],
    });
  },
});

// Create guest user session
export const createGuestUser = mutation({
  args: {
    sessionId: v.string(),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if session already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();
    
    if (existing) {
      return existing._id;
    }
    
    return await ctx.db.insert("users", {
      sessionId: args.sessionId,
      username: args.username,
      citiesVisited: [],
    });
  },
});

// Get user by auth ID
export const getUserByAuthId = query({
  args: { authId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", args.authId))
      .first();
  },
});

// Get user by session ID
export const getUserBySessionId = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();
  },
});

// Get user by ID
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Add visited city to user
export const addVisitedCity = mutation({
  args: {
    userId: v.id("users"),
    cityId: v.id("cities"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Check if city is already in the list
    if (!user.citiesVisited.includes(args.cityId)) {
      await ctx.db.patch(args.userId, {
        citiesVisited: [...user.citiesVisited, args.cityId],
      });
    }
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    username: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    whatsappNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    
    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    
    await ctx.db.patch(userId, cleanUpdates);
  },
});

// Migrate anonymous user to authenticated user
export const migrateToAuthenticated = mutation({
  args: {
    userId: v.id("users"),
    authId: v.string(),
    username: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const anonymousUser = await ctx.db.get(args.userId);
    if (!anonymousUser) {
      throw new Error("Anonymous user not found");
    }
    
    // Check if an authenticated user with this authId already exists
    const existingAuthUser = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", args.authId))
      .first();
    
    if (existingAuthUser) {
      // Merge data from anonymous user to existing authenticated user
      const mergedCitiesVisited = Array.from(new Set([
        ...existingAuthUser.citiesVisited,
        ...anonymousUser.citiesVisited
      ]));
      
      await ctx.db.patch(existingAuthUser._id, {
        citiesVisited: mergedCitiesVisited,
        // Update current city if anonymous user had one and auth user doesn't
        currentCityId: existingAuthUser.currentCityId || anonymousUser.currentCityId,
      });
      
      // Delete the anonymous user record since data has been merged
      await ctx.db.delete(args.userId);
      
      return existingAuthUser._id;
    }
    
    // Convert anonymous user to authenticated (no existing auth user)
    await ctx.db.patch(args.userId, {
      authId: args.authId,
      username: args.username,
      avatarUrl: args.avatarUrl,
      // Keep existing data: citiesVisited, currentCityId, etc.
      // Remove sessionId since user is now authenticated
      sessionId: undefined,
    });
    
    return args.userId;
  },
});

// Update user's current city
export const updateCurrentCity = mutation({
  args: {
    userId: v.id("users"),
    cityId: v.id("cities"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    await ctx.db.patch(args.userId, {
      currentCityId: args.cityId,
    });
    
    // Also add to visited cities if not already there
    if (!user.citiesVisited.includes(args.cityId)) {
      await ctx.db.patch(args.userId, {
        citiesVisited: [...user.citiesVisited, args.cityId],
      });
    }
  },
});

// Get user's current city with details
export const getUserCurrentCity = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || !user.currentCityId) {
      return null;
    }
    
    return await ctx.db.get(user.currentCityId);
  },
});

// Join city - atomic operation that adds to visited cities and sets as current
export const joinCity = mutation({
  args: {
    userId: v.id("users"),
    cityId: v.id("cities"),
  },
  handler: async (ctx, args) => {
    // Verify city exists
    const city = await ctx.db.get(args.cityId);
    if (!city) {
      throw new Error("City not found");
    }
    
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Atomically update both current city and visited cities
    const updates: any = {
      currentCityId: args.cityId,
    };
    
    // Add to visited cities if not already there
    if (!user.citiesVisited.includes(args.cityId)) {
      updates.citiesVisited = [...user.citiesVisited, args.cityId];
    }
    
    await ctx.db.patch(args.userId, updates);
    
    return city;
  },
});

// Anonymize user when account is deleted (GDPR compliant)
export const anonymizeUser = mutation({
  args: {
    authId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", args.authId))
      .first();
    
    if (!user) {
      console.log(`User with authId ${args.authId} not found for anonymization`);
      return;
    }
    
    // Anonymize user data while preserving message history
    await ctx.db.patch(user._id, {
      authId: undefined, // Remove auth link
      username: `[deleted-user-${user._id.slice(-8)}]`, // Anonymize username
      avatarUrl: undefined, // Remove avatar
      bio: undefined, // Remove bio
      whatsappNumber: undefined, // Remove contact info
      // Keep citiesVisited and currentCityId for data consistency
      // Messages will show anonymized username
    });
    
    console.log(`User ${args.authId} anonymized successfully`);
    return user._id;
  },
});

// Hard delete user (alternative approach - removes all data)
export const deleteUser = mutation({
  args: {
    authId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", args.authId))
      .first();
    
    if (!user) {
      console.log(`User with authId ${args.authId} not found for deletion`);
      return;
    }
    
    // Note: This will cause foreign key issues if user has messages
    // Consider cascading deletes or anonymization instead
    await ctx.db.delete(user._id);
    
    console.log(`User ${args.authId} hard deleted`);
    return user._id;
  },
});

// Search users by username (for DMs)
export const searchUsers = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .filter((q) => q.neq(q.field("authId"), undefined)) // Only authenticated users
      .collect();

    // Filter by username containing search term
    return users.filter(user =>
      user.username.toLowerCase().includes(args.searchTerm.toLowerCase())
    );
  },
});

// Update user's last seen timestamp
export const updateLastSeen = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      lastSeen: Date.now(),
    });
  },
});

// Count active users in a city (active = seen in last 10 minutes)
export const getActiveCityUsers = query({
  args: { cityId: v.id("cities") },
  handler: async (ctx, args) => {
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000; // 10 minutes in milliseconds

    const users = await ctx.db
      .query("users")
      .withIndex("by_current_city", (q) => q.eq("currentCityId", args.cityId))
      .collect();

    // Filter for users active in the last 10 minutes
    const activeUsers = users.filter(user =>
      user.lastSeen && user.lastSeen > tenMinutesAgo
    );

    return activeUsers.length;
  },
});

// Count all active users across all cities
export const getTotalActiveUsers = query({
  handler: async (ctx) => {
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

    const users = await ctx.db
      .query("users")
      .filter((q) => q.gt(q.field("lastSeen"), tenMinutesAgo))
      .collect();

    return users.length;
  },
});