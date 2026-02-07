import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
      .collect();

    // Get blocked user IDs if authenticated
    let blockedUserIds = new Set<string>();
    if (args.currentUserId) {
      const blocked = await ctx.db
        .query("blocked_users")
        .withIndex("by_blocker", (q) =>
          q.eq("blockerId", args.currentUserId!)
        )
        .collect();
      blockedUserIds = new Set(blocked.map((b) => b.blockedId));
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

    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
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

// Create a request (auth required)
export const createRequest = mutation({
  args: {
    cityId: v.id("cities"),
    authorId: v.id("users"),
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
    if (args.title.length > 200) {
      throw new Error("Title must be 200 characters or less");
    }
    if (args.description.length > 2000) {
      throw new Error("Description must be 2000 characters or less");
    }

    return await ctx.db.insert("requests", {
      cityId: args.cityId,
      authorId: args.authorId,
      title: args.title,
      description: args.description,
      dateFrom: args.dateFrom,
      dateTo: args.dateTo,
      activityType: args.activityType,
      status: "open",
    });
  },
});

// Toggle interest on a request
export const toggleInterest = mutation({
  args: {
    requestId: v.id("requests"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    if (request.authorId === args.userId) {
      throw new Error("Cannot express interest in your own request");
    }

    const existing = await ctx.db
      .query("request_interests")
      .withIndex("by_user_request", (q) =>
        q.eq("userId", args.userId).eq("requestId", args.requestId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { interested: false };
    } else {
      await ctx.db.insert("request_interests", {
        requestId: args.requestId,
        userId: args.userId,
      });
      return { interested: true };
    }
  },
});

// Close a request (author only)
export const closeRequest = mutation({
  args: {
    requestId: v.id("requests"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    if (request.authorId !== args.userId) {
      throw new Error("Only the author can close this request");
    }

    await ctx.db.patch(args.requestId, { status: "closed" });
  },
});

// Reopen a request (author only)
export const reopenRequest = mutation({
  args: {
    requestId: v.id("requests"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    if (request.authorId !== args.userId) {
      throw new Error("Only the author can reopen this request");
    }

    await ctx.db.patch(args.requestId, { status: "open" });
  },
});

// Add a comment to a request
export const addRequestComment = mutation({
  args: {
    requestId: v.id("requests"),
    authorId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.content.length > 1000) {
      throw new Error("Comment must be 1000 characters or less");
    }

    return await ctx.db.insert("request_comments", {
      requestId: args.requestId,
      authorId: args.authorId,
      content: args.content,
    });
  },
});

// Delete a comment (author only)
export const deleteRequestComment = mutation({
  args: {
    commentId: v.id("request_comments"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");
    if (comment.authorId !== args.userId) {
      throw new Error("Only the author can delete this comment");
    }

    await ctx.db.delete(args.commentId);
  },
});

// Delete a request (author only, cascade deletes)
export const deleteRequest = mutation({
  args: {
    requestId: v.id("requests"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    if (request.authorId !== args.userId) {
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
