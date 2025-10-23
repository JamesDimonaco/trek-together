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
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", args.authId))
      .first();

    if (existing) {
      // Update existing user - only patch defined values
      const updates: any = { username: args.username };
      if (args.avatarUrl !== undefined) updates.avatarUrl = args.avatarUrl;
      if (args.bio !== undefined) updates.bio = args.bio;
      if (args.whatsappNumber !== undefined) updates.whatsappNumber = args.whatsappNumber;
      if (args.email !== undefined) updates.email = args.email;

      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }

    // Create new user - only include defined optional fields, disable email notifications by default (opt-in required)
    const newUser: any = {
      authId: args.authId,
      username: args.username,
      citiesVisited: [],
      emailNotifications: false, // Disabled by default (opt-in required for compliance)
      browserNotifications: false, // Disabled by default (requires permission)
    };

    if (args.avatarUrl !== undefined) newUser.avatarUrl = args.avatarUrl;
    if (args.bio !== undefined) newUser.bio = args.bio;
    if (args.whatsappNumber !== undefined) newUser.whatsappNumber = args.whatsappNumber;
    if (args.email !== undefined) newUser.email = args.email;

    return await ctx.db.insert("users", newUser);
  },
});

// Helper function to check if username is taken and suggest alternative
async function checkUsernameAvailability(ctx: any, desiredUsername: string, excludeSessionId?: string): Promise<{ available: boolean; suggestion?: string }> {
  // Check if username is already taken
  const allUsers = await ctx.db.query("users").collect();

  // Filter out the current session if provided (when updating)
  const otherUsers = excludeSessionId
    ? allUsers.filter((u: any) => u.sessionId !== excludeSessionId)
    : allUsers;

  const existingUsernames = new Set(otherUsers.map((u: any) => u.username.toLowerCase()));

  // If username is available, return success
  if (!existingUsernames.has(desiredUsername.toLowerCase())) {
    return { available: true };
  }

  // Username is taken - find an available suggestion
  let counter = 1;
  let suggestion = `${desiredUsername}-${counter}`;

  while (existingUsernames.has(suggestion.toLowerCase())) {
    counter++;
    suggestion = `${desiredUsername}-${counter}`;

    // Safety check to prevent infinite loop
    if (counter > 99) {
      // Fallback to a random suffix
      suggestion = `${desiredUsername}-${Math.floor(Math.random() * 10000)}`;
      break;
    }
  }

  return { available: false, suggestion };
}

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
      // Update username if different (user might have changed it)
      if (existing.username !== args.username) {
        // Check if new username is available
        const availability = await checkUsernameAvailability(ctx, args.username, args.sessionId);

        if (!availability.available) {
          throw new Error(JSON.stringify({
            code: "USERNAME_TAKEN",
            message: `Username "${args.username}" is already taken`,
            suggestion: availability.suggestion,
          }));
        }

        await ctx.db.patch(existing._id, {
          username: args.username,
        });
      }
      return existing._id;
    }

    // Check if username is available for new user
    const availability = await checkUsernameAvailability(ctx, args.username);

    if (!availability.available) {
      throw new Error(JSON.stringify({
        code: "USERNAME_TAKEN",
        message: `Username "${args.username}" is already taken`,
        suggestion: availability.suggestion,
      }));
    }

    // Create new guest user
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
    dateOfBirth: v.optional(v.string()),
    location: v.optional(v.string()),
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
    email: v.optional(v.string()),
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
    const migrationUpdates: any = {
      authId: args.authId,
      username: args.username,
      // Keep existing data: citiesVisited, currentCityId, etc.
      // Remove sessionId since user is now authenticated
      sessionId: undefined,
      // Disable email notifications by default (opt-in required for compliance)
      emailNotifications: false,
      browserNotifications: false,
    };

    // Only add optional fields if defined
    if (args.avatarUrl !== undefined) migrationUpdates.avatarUrl = args.avatarUrl;
    if (args.email !== undefined) migrationUpdates.email = args.email;

    await ctx.db.patch(args.userId, migrationUpdates);

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

// Count authenticated users (efficient version for stats)
export const countAuthenticatedUsers = query({
  handler: async (ctx) => {
    // Authorization: Only allow authenticated users to access debug data
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Must be authenticated to access debug data");
    }

    // Optional: Add environment check to disable in production
    if (process.env.NODE_ENV === "production") {
      throw new Error("Debug queries are disabled in production");
    }

    const users = await ctx.db
      .query("users")
      .filter((q) => q.neq(q.field("authId"), undefined))
      .collect();

    return users.length;
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

// Get user profile with visited cities populated
export const getUserProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Fetch all visited cities
    const citiesPromises = user.citiesVisited.map((cityId) => ctx.db.get(cityId));
    const cities = await Promise.all(citiesPromises);

    // Filter out any null cities (in case of deleted cities)
    const validCities = cities.filter((city) => city !== null);

    return {
      ...user,
      cities: validCities,
    };
  },
});

// Debug: Find users with duplicate authIds (should never happen)
export const findDuplicateAuthIds = query({
  handler: async (ctx) => {
    // Authorization: Only allow authenticated users to access debug data
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Must be authenticated to access debug data");
    }

    // Optional: Add environment check to disable in production
    if (process.env.NODE_ENV === "production") {
      throw new Error("Debug queries are disabled in production");
    }

    const users = await ctx.db
      .query("users")
      .filter((q) => q.neq(q.field("authId"), undefined))
      .collect();

    const authIdCounts = new Map<string, number>();
    users.forEach(user => {
      if (user.authId) {
        authIdCounts.set(user.authId, (authIdCounts.get(user.authId) || 0) + 1);
      }
    });

    const duplicates = Array.from(authIdCounts.entries())
      .filter(([_, count]) => count > 1)
      .map(([authId, count]) => ({ authId, count }));

    return duplicates;
  },
});

// Update notification preferences
export const updateNotificationPreferences = mutation({
  args: {
    userId: v.id("users"),
    emailNotifications: v.optional(v.boolean()),
    browserNotifications: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Authorization: verify caller owns this userId
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: You must be signed in to update notification preferences");
    }

    // Get the authenticated user's record
    const authenticatedUser = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", identity.subject))
      .first();

    if (!authenticatedUser || authenticatedUser._id !== args.userId) {
      throw new Error("Forbidden: You can only update your own notification preferences");
    }

    const { userId, ...preferences } = args;

    const updates: any = {};
    if (preferences.emailNotifications !== undefined) {
      updates.emailNotifications = preferences.emailNotifications;
    }
    if (preferences.browserNotifications !== undefined) {
      updates.browserNotifications = preferences.browserNotifications;
    }

    await ctx.db.patch(userId, updates);

    return { success: true };
  },
});

// Debug: Find orphaned guest users (no recent activity, never authenticated)
export const findOrphanedGuestUsers = query({
  handler: async (ctx) => {
    // Authorization: Only allow authenticated users to access debug data
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Must be authenticated to access debug data");
    }

    // Optional: Add environment check to disable in production
    if (process.env.NODE_ENV === "production") {
      throw new Error("Debug queries are disabled in production");
    }

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const users = await ctx.db
      .query("users")
      .filter((q) =>
        q.and(
          q.eq(q.field("authId"), undefined), // No auth
          q.neq(q.field("sessionId"), undefined) // Has session
        )
      )
      .collect();

    // Filter for inactive users
    const orphaned = users.filter(user =>
      !user.lastSeen || user.lastSeen < thirtyDaysAgo
    );

    return {
      count: orphaned.length,
      users: orphaned.slice(0, 10), // Return first 10 for inspection
    };
  },
});