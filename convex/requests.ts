import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { resolveActor } from "./lib/guests";
import {
  appUrl,
  isValidEmail,
  notifyUser,
  notifyFounder,
  interestEmailBody,
  commentEmailBody,
  founderAlertBody,
  truncate,
} from "./lib/notify";

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

// Create a request. Open to guests: they identify via sessionId and must
// provide an email so responses can reach them (the whole point of a request).
export const createRequest = mutation({
  args: {
    userId: v.optional(v.id("users")),
    sessionId: v.optional(v.string()),
    username: v.optional(v.string()),
    email: v.optional(v.string()),
    notifyByEmail: v.optional(v.boolean()),
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
    const user = await resolveActor(ctx, args);

    // Guests must leave an email - a request nobody can answer is dead weight
    const isGuest = !user.authId;
    if (isGuest && !user.email) {
      const email = args.email?.trim().toLowerCase();
      if (!email || !isValidEmail(email)) {
        throw new Error(
          "Please add a valid email so trekkers can reach you when they respond"
        );
      }
      await ctx.db.patch(user._id, { email, emailNotifications: true });
    } else if (isGuest && args.email) {
      const email = args.email.trim().toLowerCase();
      if (isValidEmail(email)) {
        await ctx.db.patch(user._id, { email, emailNotifications: true });
      }
    } else if (!isGuest && args.notifyByEmail && user.email) {
      // Auth user explicitly asked to be emailed about responses
      await ctx.db.patch(user._id, { emailNotifications: true });
    }

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

    const requestId = await ctx.db.insert("requests", {
      cityId: args.cityId,
      authorId: user._id,
      title: args.title.trim(),
      description: args.description.trim(),
      dateFrom: args.dateFrom,
      dateTo: args.dateTo,
      activityType: args.activityType,
      status: "open",
    });

    const city = await ctx.db.get(args.cityId);
    await notifyFounder(
      ctx,
      `[TrekTogether] New request: ${truncate(args.title.trim(), 60)}`,
      founderAlertBody({
        what: `New ${args.activityType} request by ${user.username}`,
        content: `${args.title.trim()}\n\n${args.description.trim()}`,
        where: city ? `${city.name}, ${city.country}` : "unknown city",
        url: `${appUrl()}/chat/${args.cityId}/requests/${requestId}`,
      })
    );

    return requestId;
  },
});

// Toggle interest on a request. Open to guests (sessionId); providing an
// email opts them into reply notifications so the match can complete async.
export const toggleInterest = mutation({
  args: {
    userId: v.optional(v.id("users")),
    sessionId: v.optional(v.string()),
    username: v.optional(v.string()),
    email: v.optional(v.string()),
    requestId: v.id("requests"),
  },
  handler: async (ctx, args) => {
    const user = await resolveActor(ctx, args);

    if (!user.authId && args.email) {
      const email = args.email.trim().toLowerCase();
      if (isValidEmail(email)) {
        await ctx.db.patch(user._id, { email, emailNotifications: true });
      }
    }

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

      // Tell the author someone's in - once per (interested user, request),
      // so toggling on/off can't be used to spam them
      const author = await ctx.db.get(request.authorId);
      if (author) {
        const requestUrl = `${appUrl()}/chat/${request.cityId}/requests/${request._id}`;
        await notifyUser(ctx, {
          user: author,
          kind: "req_interest",
          key: `${request._id}:${user._id}`,
          cooldown: "once",
          subject: `${user.username} wants to join your trek`,
          bodyHtml: interestEmailBody({
            actorName: user.username,
            requestTitle: request.title,
            requestUrl,
          }),
        });
        await notifyFounder(
          ctx,
          `[TrekTogether] Interest: ${user.username} → "${truncate(request.title, 50)}"`,
          founderAlertBody({
            what: `${user.username} expressed interest`,
            content: request.title,
            where: `request by ${author.username}`,
            url: requestUrl,
          })
        );
      }

      return { interested: true };
    }
  },
});

// Close a request (author only; guests verify via sessionId)
export const closeRequest = mutation({
  args: {
    userId: v.optional(v.id("users")),
    sessionId: v.optional(v.string()),
    requestId: v.id("requests"),
  },
  handler: async (ctx, args) => {
    const user = await resolveActor(ctx, args);

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    if (request.authorId !== user._id) {
      throw new Error("Only the author can close this request");
    }

    await ctx.db.patch(args.requestId, { status: "closed" });
  },
});

// Reopen a request (author only; guests verify via sessionId)
export const reopenRequest = mutation({
  args: {
    userId: v.optional(v.id("users")),
    sessionId: v.optional(v.string()),
    requestId: v.id("requests"),
  },
  handler: async (ctx, args) => {
    const user = await resolveActor(ctx, args);

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    if (request.authorId !== user._id) {
      throw new Error("Only the author can reopen this request");
    }

    await ctx.db.patch(args.requestId, { status: "open" });
  },
});

// Add a comment to a request. Open to guests (sessionId + optional email).
// Notifies everyone in the thread (author, interested users, prior commenters)
// so two people who have never been online together can still make a plan.
export const addRequestComment = mutation({
  args: {
    userId: v.optional(v.id("users")),
    sessionId: v.optional(v.string()),
    username: v.optional(v.string()),
    email: v.optional(v.string()),
    requestId: v.id("requests"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await resolveActor(ctx, args);

    if (!user.authId && args.email) {
      const email = args.email.trim().toLowerCase();
      if (isValidEmail(email)) {
        await ctx.db.patch(user._id, { email, emailNotifications: true });
      }
    }

    if (!args.content.trim()) {
      throw new Error("Comment is required");
    }
    if (args.content.length > 1000) {
      throw new Error("Comment must be 1000 characters or less");
    }

    const content = args.content.trim();
    const commentId = await ctx.db.insert("request_comments", {
      requestId: args.requestId,
      authorId: user._id,
      content,
    });

    const request = await ctx.db.get(args.requestId);
    if (request) {
      const requestUrl = `${appUrl()}/chat/${request.cityId}/requests/${request._id}`;

      // Recipients: request author + interested users + prior commenters
      const interests = await ctx.db
        .query("request_interests")
        .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
        .collect();
      const comments = await ctx.db
        .query("request_comments")
        .withIndex("by_request", (q) => q.eq("requestId", args.requestId))
        .collect();

      const recipientIds = new Set<Id<"users">>([
        request.authorId,
        ...interests.map((i) => i.userId),
        ...comments.map((c) => c.authorId),
      ]);
      recipientIds.delete(user._id);

      for (const recipientId of recipientIds) {
        const recipient = await ctx.db.get(recipientId);
        if (!recipient) continue;
        // Max one email per recipient per request per hour to keep threads
        // from turning into inbox floods
        await notifyUser(ctx, {
          user: recipient,
          kind: "req_comment",
          key: `${request._id}`,
          cooldown: 60 * 60 * 1000,
          subject: `New reply on "${truncate(request.title, 60)}"`,
          bodyHtml: commentEmailBody({
            actorName: user.username,
            requestTitle: request.title,
            requestUrl,
            commentPreview: content,
          }),
        });
      }

      await notifyFounder(
        ctx,
        `[TrekTogether] Comment by ${user.username} on "${truncate(request.title, 50)}"`,
        founderAlertBody({
          what: `New comment by ${user.username}`,
          content,
          where: `request "${request.title}"`,
          url: requestUrl,
        })
      );
    }

    return commentId;
  },
});

// Get requests by a specific author (for My Activity page, auth required)
export const getRequestsByAuthor = query({
  args: {
    userId: v.id("users"),
    authorId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify caller is authenticated and is the author
    const user = await ctx.db.get(args.userId);
    if (!user || !user.authId) {
      throw new Error("Authentication required");
    }
    if (args.userId !== args.authorId) {
      throw new Error("You can only view your own activity");
    }

    const safeLimit = Math.max(1, Math.min(args.limit ?? 50, 50));
    const requests = await ctx.db
      .query("requests")
      .withIndex("by_author", (q) => q.eq("authorId", args.authorId))
      .order("desc")
      .take(safeLimit);

    const enriched = await Promise.all(
      requests.map(async (req) => {
        const city = await ctx.db.get(req.cityId);
        const interests = await ctx.db
          .query("request_interests")
          .withIndex("by_request", (q) => q.eq("requestId", req._id))
          .collect();
        const comments = await ctx.db
          .query("request_comments")
          .withIndex("by_request", (q) => q.eq("requestId", req._id))
          .collect();

        return {
          ...req,
          city: city
            ? { _id: city._id, name: city.name, country: city.country }
            : null,
          interestCount: interests.length,
          commentCount: comments.length,
        };
      })
    );

    return enriched;
  },
});

// Get recent open requests across all cities (for homepage carousel)
export const getRecentRequests = query({
  args: {
    limit: v.optional(v.number()),
    currentUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const targetLimit = Math.max(1, Math.min(args.limit ?? 10, 20));
    const batchSize = targetLimit * 3;

    // Build blocked user set if caller is authenticated
    let blockedUserIds = new Set<string>();
    if (args.currentUserId) {
      blockedUserIds = await getBlockedUserIds(ctx, args.currentUserId);
    }

    // Paginated fetch to ensure we get enough open, non-blocked requests
    const openRequests: any[] = [];
    let cursor: any = undefined;
    let iterations = 0;
    const maxIterations = 5;

    while (openRequests.length < targetLimit && iterations < maxIterations) {
      iterations++;
      const page = await ctx.db
        .query("requests")
        .order("desc")
        .paginate({ numItems: batchSize, cursor: cursor ?? null });

      for (const req of page.page) {
        if (
          req.status === "open" &&
          !blockedUserIds.has(req.authorId)
        ) {
          openRequests.push(req);
          if (openRequests.length >= targetLimit) break;
        }
      }

      if (page.isDone) break;
      cursor = page.continueCursor;
    }

    const enriched = await Promise.all(
      openRequests.map(async (req) => {
        const authorId = req.authorId as Id<"users">;
        const cityId = req.cityId as Id<"cities">;
        const author = await ctx.db.get(authorId);
        const city = await ctx.db.get(cityId);
        const interests = await ctx.db
          .query("request_interests")
          .withIndex("by_request", (q) => q.eq("requestId", req._id))
          .collect();
        const comments = await ctx.db
          .query("request_comments")
          .withIndex("by_request", (q) => q.eq("requestId", req._id))
          .collect();

        return {
          ...req,
          author: author
            ? {
                _id: author._id,
                username: author.username,
                avatarUrl: author.avatarUrl,
              }
            : null,
          city: city
            ? { _id: city._id, name: city.name, country: city.country }
            : null,
          interestCount: interests.length,
          commentCount: comments.length,
        };
      })
    );

    return enriched;
  },
});

// Count open requests for a city
export const countOpenRequestsByCity = query({
  args: { cityId: v.id("cities") },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("requests")
      .withIndex("by_city_status", (q) =>
        q.eq("cityId", args.cityId).eq("status", "open")
      )
      .collect();
    return requests.length;
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

// Delete a comment (author only; guests verify via sessionId)
export const deleteRequestComment = mutation({
  args: {
    userId: v.optional(v.id("users")),
    sessionId: v.optional(v.string()),
    commentId: v.id("request_comments"),
  },
  handler: async (ctx, args) => {
    const user = await resolveActor(ctx, args);

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");
    if (comment.authorId !== user._id) {
      throw new Error("Only the author can delete this comment");
    }

    await ctx.db.delete(args.commentId);
  },
});

// Delete a request (author only; guests verify via sessionId, cascade deletes)
export const deleteRequest = mutation({
  args: {
    userId: v.optional(v.id("users")),
    sessionId: v.optional(v.string()),
    requestId: v.id("requests"),
  },
  handler: async (ctx, args) => {
    const user = await resolveActor(ctx, args);

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
