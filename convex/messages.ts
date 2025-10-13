import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Send message to city chat
export const sendMessage = mutation({
  args: {
    cityId: v.id("cities"),
    content: v.string(),
    userId: v.optional(v.id("users")),
    sessionId: v.optional(v.string()),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    // Update user's lastSeen timestamp
    if (args.userId) {
      await ctx.db.patch(args.userId, {
        lastSeen: Date.now(),
      });
    }

    return await ctx.db.insert("city_messages", {
      cityId: args.cityId,
      userId: args.userId,
      sessionId: args.sessionId,
      username: args.username,
      content: args.content,
    });
  },
});

// Get messages for a city
export const getMessages = query({
  args: {
    cityId: v.id("cities"),
    currentUserId: v.optional(v.id("users")), // Optional: to filter blocked users
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("city_messages")
      .withIndex("by_city", (q) => q.eq("cityId", args.cityId))
      .order("desc")
      .take(50);

    // If user is authenticated, filter out messages from blocked users
    if (args.currentUserId) {
      // Get all users this user has blocked
      const blocked = await ctx.db
        .query("blocked_users")
        .withIndex("by_blocker", (q) => q.eq("blockerId", args.currentUserId))
        .collect();

      const blockedUserIds = new Set(blocked.map(b => b.blockedId));

      // Filter out messages from blocked users
      const filteredMessages = messages.filter(
        msg => !msg.userId || !blockedUserIds.has(msg.userId)
      );

      return filteredMessages.reverse(); // Return in chronological order
    }

    return messages.reverse(); // Return in chronological order
  },
});

// Get recent message count for active users tracking
export const getActiveUsersCount = query({
  args: { 
    cityId: v.id("cities"),
    minutesThreshold: v.optional(v.number()), // default to 10 minutes
  },
  handler: async (ctx, args) => {
    const threshold = args.minutesThreshold || 10;
    const cutoffTime = Date.now() - threshold * 60 * 1000;
    
    const recentMessages = await ctx.db
      .query("city_messages")
      .withIndex("by_city", (q) => q.eq("cityId", args.cityId))
      .filter((q) => q.gte(q.field("_creationTime"), cutoffTime))
      .collect();
    
    // Count unique users (by userId or sessionId)
    const uniqueUsers = new Set();
    recentMessages.forEach((msg) => {
      if (msg.userId) {
        uniqueUsers.add(`user:${msg.userId}`);
      } else if (msg.sessionId) {
        uniqueUsers.add(`session:${msg.sessionId}`);
      }
    });
    
    return uniqueUsers.size;
  },
});