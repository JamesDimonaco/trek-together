import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Block a user
export const blockUser = mutation({
  args: {
    blockerId: v.id("users"),
    blockedId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Prevent blocking yourself
    if (args.blockerId === args.blockedId) {
      throw new Error("Cannot block yourself");
    }

    // Check if block already exists
    const existing = await ctx.db
      .query("blocked_users")
      .withIndex("by_blocker_and_blocked", (q) =>
        q.eq("blockerId", args.blockerId).eq("blockedId", args.blockedId)
      )
      .first();

    if (existing) {
      throw new Error("User is already blocked");
    }

    // Create block record
    return await ctx.db.insert("blocked_users", {
      blockerId: args.blockerId,
      blockedId: args.blockedId,
      reason: args.reason,
    });
  },
});

// Unblock a user
export const unblockUser = mutation({
  args: {
    blockerId: v.id("users"),
    blockedId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const block = await ctx.db
      .query("blocked_users")
      .withIndex("by_blocker_and_blocked", (q) =>
        q.eq("blockerId", args.blockerId).eq("blockedId", args.blockedId)
      )
      .first();

    if (!block) {
      throw new Error("Block record not found");
    }

    await ctx.db.delete(block._id);
  },
});

// Check if a user is blocked
export const isUserBlocked = query({
  args: {
    blockerId: v.id("users"),
    blockedId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const block = await ctx.db
      .query("blocked_users")
      .withIndex("by_blocker_and_blocked", (q) =>
        q.eq("blockerId", args.blockerId).eq("blockedId", args.blockedId)
      )
      .first();

    return !!block;
  },
});

// Get all users blocked by a user
export const getBlockedUsers = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const blocks = await ctx.db
      .query("blocked_users")
      .withIndex("by_blocker", (q) => q.eq("blockerId", args.userId))
      .collect();

    // Populate blocked user details
    const blockedUsersPromises = blocks.map(async (block) => {
      const user = await ctx.db.get(block.blockedId);
      return {
        blockId: block._id,
        blockedAt: block._creationTime,
        reason: block.reason,
        user,
      };
    });

    return await Promise.all(blockedUsersPromises);
  },
});

// Check if current user has blocked or been blocked by another user (mutual check)
export const checkBlockStatus = query({
  args: {
    userId: v.id("users"),
    otherUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if userId blocked otherUserId
    const blockedByMe = await ctx.db
      .query("blocked_users")
      .withIndex("by_blocker_and_blocked", (q) =>
        q.eq("blockerId", args.userId).eq("blockedId", args.otherUserId)
      )
      .first();

    // Check if otherUserId blocked userId
    const blockedMe = await ctx.db
      .query("blocked_users")
      .withIndex("by_blocker_and_blocked", (q) =>
        q.eq("blockerId", args.otherUserId).eq("blockedId", args.userId)
      )
      .first();

    return {
      iBlockedThem: !!blockedByMe,
      theyBlockedMe: !!blockedMe,
      isBlocked: !!blockedByMe || !!blockedMe,
    };
  },
});

// Report a user
export const reportUser = mutation({
  args: {
    reporterId: v.id("users"),
    reportedUserId: v.id("users"),
    messageId: v.optional(v.string()),
    messageType: v.optional(
      v.union(v.literal("city_message"), v.literal("dm"), v.literal("country_message"))
    ),
    reason: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Prevent reporting yourself
    if (args.reporterId === args.reportedUserId) {
      throw new Error("Cannot report yourself");
    }

    // Create report record
    return await ctx.db.insert("reports", {
      reporterId: args.reporterId,
      reportedUserId: args.reportedUserId,
      messageId: args.messageId,
      messageType: args.messageType,
      reason: args.reason,
      description: args.description,
      status: "pending",
    });
  },
});

// Get reports by status (admin function)
export const getReportsByStatus = query({
  args: { status: v.union(
    v.literal("pending"),
    v.literal("reviewed"),
    v.literal("resolved"),
    v.literal("dismissed")
  ) },
  handler: async (ctx, args) => {
    const reports = await ctx.db
      .query("reports")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .take(50);

    // Populate reporter and reported user details
    const reportsWithDetails = await Promise.all(
      reports.map(async (report) => {
        const reporter = await ctx.db.get(report.reporterId);
        const reportedUser = await ctx.db.get(report.reportedUserId);
        return {
          ...report,
          reporter,
          reportedUser,
        };
      })
    );

    return reportsWithDetails;
  },
});

// Update report status (admin function)
export const updateReportStatus = mutation({
  args: {
    reportId: v.id("reports"),
    status: v.union(
      v.literal("pending"),
      v.literal("reviewed"),
      v.literal("resolved"),
      v.literal("dismissed")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reportId, {
      status: args.status,
    });
  },
});
