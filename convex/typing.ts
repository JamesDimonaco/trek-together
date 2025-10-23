import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Set typing indicator (auto-expires after 5 seconds)
export const setTyping = mutation({
  args: {
    userId: v.id("users"),
    conversationId: v.string(),
    conversationType: v.union(v.literal("city"), v.literal("dm")),
  },
  handler: async (ctx, args) => {
    const expiresAt = Date.now() + 5000; // 5 seconds from now

    // Check if typing indicator already exists for this user in this conversation
    const existing = await ctx.db
      .query("typing_indicators")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (existing) {
      // Update expiry time
      await ctx.db.patch(existing._id, { expiresAt });
    } else {
      // Create new typing indicator
      await ctx.db.insert("typing_indicators", {
        userId: args.userId,
        conversationId: args.conversationId,
        conversationType: args.conversationType,
        expiresAt,
      });
    }

    return { success: true };
  },
});

// Get active typing users for a conversation
export const getTypingUsers = query({
  args: {
    conversationId: v.string(),
    excludeUserId: v.optional(v.id("users")), // Exclude current user
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get all typing indicators for this conversation that haven't expired
    const indicators = await ctx.db
      .query("typing_indicators")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .collect();

    // Exclude current user and get user details
    const typingUsers = [];
    for (const indicator of indicators) {
      if (args.excludeUserId && indicator.userId === args.excludeUserId) {
        continue;
      }

      const user = await ctx.db.get(indicator.userId);
      if (user) {
        typingUsers.push({
          userId: user._id,
          username: user.username,
        });
      }
    }

    return typingUsers;
  },
});

// Clear typing indicator
export const clearTyping = mutation({
  args: {
    userId: v.id("users"),
    conversationId: v.string(),
  },
  handler: async (ctx, args) => {
    const indicator = await ctx.db
      .query("typing_indicators")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (indicator) {
      await ctx.db.delete(indicator._id);
    }

    return { success: true };
  },
});

// Cleanup expired typing indicators (called periodically)
export const cleanupExpired = mutation({
  handler: async (ctx) => {
    const now = Date.now();

    const expired = await ctx.db
      .query("typing_indicators")
      .withIndex("by_expires", (q) => q.lt("expiresAt", now))
      .collect();

    for (const indicator of expired) {
      await ctx.db.delete(indicator._id);
    }

    return { cleaned: expired.length };
  },
});
