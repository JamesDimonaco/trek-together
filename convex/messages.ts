import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import {
  appUrl,
  notifyUser,
  notifyFounder,
  chatReplyEmailBody,
  founderAlertBody,
  truncate,
} from "./lib/notify";

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

    const messageId = await ctx.db.insert("city_messages", {
      cityId: args.cityId,
      userId: args.userId,
      sessionId: args.sessionId,
      username: args.username,
      content: args.content,
    });

    const city = await ctx.db.get(args.cityId);
    const chatUrl = `${appUrl()}/chat/${args.cityId}`;

    await notifyFounder(
      ctx,
      `[TrekTogether] ${args.username} in ${city?.name ?? "unknown"}: ${truncate(args.content, 50)}`,
      founderAlertBody({
        what: `New chat message by ${args.username}`,
        content: args.content,
        where: city ? `${city.name}, ${city.country}` : "unknown city",
        url: chatUrl,
      })
    );

    // Email past participants of this city chat who opted in but aren't
    // online right now - the async version of "someone answered your hello"
    if (city) {
      const recentMessages = await ctx.db
        .query("city_messages")
        .withIndex("by_city", (q) => q.eq("cityId", args.cityId))
        .order("desc")
        .take(100);

      const participantIds = new Set<Id<"users">>();
      const participantSessionIds = new Set<string>();
      for (const msg of recentMessages) {
        if (msg._id === messageId) continue;
        if (msg.userId) participantIds.add(msg.userId);
        else if (msg.sessionId) participantSessionIds.add(msg.sessionId);
      }

      const participants = [];
      for (const id of participantIds) {
        const u = await ctx.db.get(id);
        if (u) participants.push(u);
      }
      for (const sid of participantSessionIds) {
        const u = await ctx.db
          .query("users")
          .withIndex("by_session_id", (q) => q.eq("sessionId", sid))
          .first();
        if (u) participants.push(u);
      }

      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      for (const participant of participants) {
        if (args.userId && participant._id === args.userId) continue;
        if (args.sessionId && participant.sessionId === args.sessionId) continue;
        // Skip people who are actively looking at the app
        if (participant.lastSeen && participant.lastSeen > tenMinutesAgo) continue;

        // Max one chat email per person per city per 6 hours
        await notifyUser(ctx, {
          user: participant,
          kind: "city_chat",
          key: `${args.cityId}`,
          cooldown: 6 * 60 * 60 * 1000,
          subject: `${args.username} posted in the ${city.name} chat`,
          bodyHtml: chatReplyEmailBody({
            actorName: args.username,
            cityName: city.name,
            preview: args.content,
            chatUrl,
          }),
        });
      }
    }

    return messageId;
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
        .withIndex("by_blocker", (q) => q.eq("blockerId", args.currentUserId!))
        .collect();

      const blockedUserIds = new Set(blocked.map((b) => b.blockedId));

      // Filter out messages from blocked users
      const filteredMessages = messages.filter(
        (msg) => !msg.userId || !blockedUserIds.has(msg.userId)
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