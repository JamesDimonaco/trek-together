import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Helper: get blocked user IDs (bidirectional)
async function getBlockedUserIds(
  ctx: { db: any },
  userId: Id<"users">
): Promise<Set<string>> {
  const blockedByMe = await ctx.db
    .query("blocked_users")
    .withIndex("by_blocker", (q: any) => q.eq("blockerId", userId))
    .collect();
  const blockedMe = await ctx.db
    .query("blocked_users")
    .withIndex("by_blocked", (q: any) => q.eq("blockedId", userId))
    .collect();
  return new Set([
    ...blockedByMe.map((b: any) => b.blockedId),
    ...blockedMe.map((b: any) => b.blockerId),
  ]);
}

// Helper: verify caller identity and return their user record
async function authenticateCaller(ctx: { auth: any; db: any }, userId: Id<"users">) {
  const user = await ctx.db.get(userId);
  if (!user || !user.authId) {
    throw new Error("Authentication required");
  }
  return user;
}

// Get requests for a city with author info, interest/comment counts
export const getRequestsByCity = query({
  args: {
    cityId: v.id("cities"),
    currentUserId: v.optional(v.id("users")),
    statusFilter: v.optional(
      v.union(v.literal("open"), v.literal("closed"))
    ),
  },
  handler: async (ctx, args) => {
    const status = args.statusFilter ?? "open";

    const requests = await ctx.db
      .query("requests")
      .withIndex("by_city_status", (q) =>
        q.eq("cityId", args.cityId).eq("status", status)
      )
      .order("desc")
      .take(50);

    // Get blocked user IDs (bidirectional) if authenticated
    let blockedUserIds = new Set<string>();
    if (args.currentUserId) {
      blockedUserIds = await getBlockedUserIds(ctx, args.currentUserId);
    }

    const enriched = await Promise.all(
      requests
        .filter((req) => !blockedUserIds.has(req.authorId))
        .map(async (req) => {
          const author = await ctx.db.get(req.authorId);
          const interests = await ctx.db
            .query("request_interests")
            .withIndex("by_request", (q) => q.eq("requestId", req._id))
            .collect();
          const comments = await ctx.db
            .query("request_comments")
            .withIndex("by_request", (q) => q.eq("requestId", req._id))
            .collect();

          let hasExpressedInterest = false;
          if (args.currentUserId) {
            const interest = await ctx.db
              .query("request_interests")
              .withIndex("by_user_request", (q) =>
                q
                  .eq("userId", args.currentUserId!)
                  .eq("requestId", req._id)
              )
              .first();
            hasExpressedInterest = !!interest;
          }

          return {
            ...req,
            author: author
              ? {
                  _id: author._id,
                  username: author.username,
                  avatarUrl: author.avatarUrl,
                }
              : null,
            interestCount: interests.length,
            commentCount: comments.length,
            hasExpressedInterest,
          };
        })
    );

    return enriched;
  },
});

// Get a single request with full details, interested users, and comments
export const getRequestById = query({
  args: {
    requestId: v.id("requests"),
    currentUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) return null;

    // Block check: hide request if author is blocked (bidirectional)
    if (args.currentUserId) {
      const blockedUserIds = await getBlockedUserIds(ctx, args.currentUserId);
      if (blockedUserIds.has(request.authorId)) return null;
    }

    const author = await ctx.db.get(request.authorId);

    const interests = await ctx.db
      .query("request_interests")
      .withIndex("by_request", (q) => q.eq("requestId", request._id))
      .collect();

    // Enrich interested users
    const interestedUsers = await Promise.all(
      interests.map(async (interest) => {
        const user = await ctx.db.get(interest.userId);
        return user
          ? {
              _id: user._id,
              username: user.username,
              avatarUrl: user.avatarUrl,
            }
          : null;
      })
    );

    const comments = await ctx.db
      .query("request_comments")
      .withIndex("by_request", (q) => q.eq("requestId", request._id))
      .order("asc")
      .collect();

    // Get blocked IDs for filtering comments
    let blockedUserIds = new Set<string>();
    if (args.currentUserId) {
      blockedUserIds = await getBlockedUserIds(ctx, args.currentUserId);
    }

    // Enrich comments with author info, filter blocked users
    const enrichedCommentsRaw = await Promise.all(
      comments.map(async (comment) => {
        if (blockedUserIds.has(comment.authorId)) return null;
        const commentAuthor = await ctx.db.get(comment.authorId);
        return {
          ...comment,
          author: commentAuthor
            ? {
                _id: commentAuthor._id,
                username: commentAuthor.username,
                avatarUrl: commentAuthor.avatarUrl,
              }
            : null,
        };
      })
    );
    const enrichedComments = enrichedCommentsRaw.filter(
      (c): c is NonNullable<typeof c> => c !== null
    );

    let hasExpressedInterest = false;
    if (args.currentUserId) {
      const interest = await ctx.db
        .query("request_interests")
        .withIndex("by_user_request", (q) =>
          q
            .eq("userId", args.currentUserId!)
            .eq("requestId", request._id)
        )
        .first();
      hasExpressedInterest = !!interest;
    }

    return {
      ...request,
      author: author
        ? {
            _id: author._id,
            username: author.username,
            avatarUrl: author.avatarUrl,
          }
        : null,
      interestedUsers: interestedUsers.filter(Boolean),
      comments: enrichedComments,
      interestCount: interests.length,
      hasExpressedInterest,
    };
  },
});

// Create a request (server-side auth)
export const createRequest = mutation({
  args: {
    userId: v.id("users"),
    cityId: v.id("cities"),
    title: v.string(),
    description: v.string(),
    dateFrom: v.string(),
    dateTo: v.optional(v.string()),
    activityType: v.union(
      v.literal("trekking"),
      v.literal("hiking"),
      v.literal("climbing"),
      v.literal("camping"),
      v.literal("other")
    ),
  },
  handler: async (ctx, args) => {
    const user = await authenticateCaller(ctx, args.userId);

    if (!args.title.trim()) {
      throw new Error("Title is required");
    }
    if (args.title.length > 200) {
      throw new Error("Title must be 200 characters or less");
    }
    if (!args.description.trim()) {
      throw new Error("Description is required");
    }
    if (args.description.length > 2000) {
      throw new Error("Description must be 2000 characters or less");
    }

    // Validate dates
    const fromDate = new Date(args.dateFrom);
    if (isNaN(fromDate.getTime())) {
      throw new Error("Invalid start date");
    }
    if (args.dateTo) {
      const toDate = new Date(args.dateTo);
      if (isNaN(toDate.getTime())) {
        throw new Error("Invalid end date");
      }
      if (toDate < fromDate) {
        throw new Error("End date must be after start date");
      }
    }

    return await ctx.db.insert("requests", {
      cityId: args.cityId,
      authorId: user._id,
      title: args.title.trim(),
      description: args.description.trim(),
      dateFrom: args.dateFrom,
      dateTo: args.dateTo,
      activityType: args.activityType,
      status: "open",
    });
  },
});

// Toggle interest on a request (auth required)
export const toggleInterest = mutation({
  args: {
    userId: v.id("users"),
    requestId: v.id("requests"),
  },
  handler: async (ctx, args) => {
    const user = await authenticateCaller(ctx, args.userId);

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    if (request.authorId === user._id) {
      throw new Error("Cannot express interest in your own request");
    }

    const existing = await ctx.db
      .query("request_interests")
      .withIndex("by_user_request", (q) =>
        q.eq("userId", user._id).eq("requestId", args.requestId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { interested: false };
    } else {
      await ctx.db.insert("request_interests", {
        requestId: args.requestId,
        userId: user._id,
      });
      return { interested: true };
    }
  },
});

// Close a request (auth required, author only)
export const closeRequest = mutation({
  args: {
    userId: v.id("users"),
    requestId: v.id("requests"),
  },
  handler: async (ctx, args) => {
    const user = await authenticateCaller(ctx, args.userId);

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    if (request.authorId !== user._id) {
      throw new Error("Only the author can close this request");
    }

    await ctx.db.patch(args.requestId, { status: "closed" });
  },
});

// Reopen a request (auth required, author only)
export const reopenRequest = mutation({
  args: {
    userId: v.id("users"),
    requestId: v.id("requests"),
  },
  handler: async (ctx, args) => {
    const user = await authenticateCaller(ctx, args.userId);

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    if (request.authorId !== user._id) {
      throw new Error("Only the author can reopen this request");
    }

    await ctx.db.patch(args.requestId, { status: "open" });
  },
});

// Add a comment to a request (auth required)
export const addRequestComment = mutation({
  args: {
    userId: v.id("users"),
    requestId: v.id("requests"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authenticateCaller(ctx, args.userId);

    if (!args.content.trim()) {
      throw new Error("Comment is required");
    }
    if (args.content.length > 1000) {
      throw new Error("Comment must be 1000 characters or less");
    }

    return await ctx.db.insert("request_comments", {
      requestId: args.requestId,
      authorId: user._id,
      content: args.content.trim(),
    });
  },
});

// Get open request IDs with cityId and creation time (for sitemap)
export const getAllRequestIds = query({
  args: {},
  handler: async (ctx) => {
    // Only index open requests - closed ones have noindex meta anyway
    const requests = await ctx.db
      .query("requests")
      .filter((q) => q.eq(q.field("status"), "open"))
      .take(10000);
    return requests.map((req) => ({
      _id: req._id,
      cityId: req.cityId,
      _creationTime: req._creationTime,
    }));
  },
});

// Delete a comment (auth required, author only)
export const deleteRequestComment = mutation({
  args: {
    userId: v.id("users"),
    commentId: v.id("request_comments"),
  },
  handler: async (ctx, args) => {
    const user = await authenticateCaller(ctx, args.userId);

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");
    if (comment.authorId !== user._id) {
      throw new Error("Only the author can delete this comment");
    }

    await ctx.db.delete(args.commentId);
  },
});

// Delete a request (auth required, author only, cascade deletes)
export const deleteRequest = mutation({
  args: {
    userId: v.id("users"),
    requestId: v.id("requests"),
  },
  handler: async (ctx, args) => {
    const user = await authenticateCaller(ctx, args.userId);

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    if (request.authorId !== user._id) {
      throw new Error("Only the author can delete this request");
    }

    // Delete all comments
    const comments = await ctx.db
      .query("request_comments")
      .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
      .collect();
    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    // Delete all interests
    const interests = await ctx.db
      .query("request_interests")
      .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
      .collect();
    for (const interest of interests) {
      await ctx.db.delete(interest._id);
    }

    await ctx.db.delete(args.requestId);
  },
});
