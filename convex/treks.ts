import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import { appUrl, commentEmailBody, notifyUser, truncate } from "./lib/notify";
import {
  TREK_LIMITS,
  canViewTrek,
  computeTrekTotals,
  nextDayDate,
  validateCompanions,
  validateDayFields,
  validateTrekFields,
} from "./lib/treks";

const visibility = v.union(v.literal("public"), v.literal("private"));
const clearableString = v.union(v.string(), v.null());
const clearableNumber = v.union(v.number(), v.null());
const companion = v.union(
  v.object({ kind: v.literal("user"), userId: v.id("users") }),
  v.object({ kind: v.literal("name"), name: v.string() })
);
type Companion = NonNullable<Doc<"treks">["companions"]>[number];

const PUBLIC_LIST_SIZE = 50;
// Search filters in memory, so it scans a bounded window of the newest treks only.
const PUBLIC_SEARCH_WINDOW = 500;

// Same trust model as the rest of the app: the client passes its own userId.
// Moving to Clerk-verified identity later means changing only this function.
async function requireMember(ctx: QueryCtx, userId: Id<"users">) {
  const user = await ctx.db.get(userId);
  if (!user || !user.authId) throw new Error("Authentication required");
  return user;
}

async function getOwnedTrek(
  ctx: QueryCtx,
  userId: Id<"users">,
  trekId: Id<"treks">
) {
  await requireMember(ctx, userId);
  const trek = await ctx.db.get(trekId);
  if (!trek || trek.userId !== userId) throw new Error("Trek not found");
  return trek;
}

async function getOwnedDay(
  ctx: QueryCtx,
  userId: Id<"users">,
  dayId: Id<"trek_days">
) {
  const day = await ctx.db.get(dayId);
  if (!day) throw new Error("Day not found");
  const trek = await getOwnedTrek(ctx, userId, day.trekId);
  return { day, trek };
}

async function listDays(ctx: QueryCtx, trekId: Id<"treks">) {
  const days = await ctx.db
    .query("trek_days")
    .withIndex("by_trek", (q) => q.eq("trekId", trekId))
    .collect();
  return days.sort(
    (a, b) =>
      a.date.localeCompare(b.date) || a._creationTime - b._creationTime
  );
}

async function deleteStoredImages(ctx: MutationCtx, storageIds: string[]) {
  for (const id of storageIds) {
    try {
      await ctx.storage.delete(id as Id<"_storage">);
    } catch {
      // The file is already gone; it must not block deleting the day or trek.
    }
  }
}

// Ownership of a storage id cannot be proven in Convex; this only rejects ids that are not stored files.
async function assertStoredFiles(ctx: MutationCtx, storageIds: string[]) {
  for (const id of storageIds) {
    const file = await ctx.db.system
      .get(id as Id<"_storage">)
      .catch(() => null);
    if (!file) throw new Error("Invalid image");
  }
}

async function checkCompanions(
  ctx: QueryCtx,
  ownerId: Id<"users">,
  companions: Companion[]
) {
  const checked = validateCompanions(companions, ownerId);
  for (const entry of checked) {
    if (entry.kind !== "user") continue;
    const user = await ctx.db.get(entry.userId);
    // One message for missing, guest and blocked, so it never reveals who blocked whom.
    if (!user || !user.authId || (await isBlockedEitherWay(ctx, ownerId, user._id))) {
      throw new Error("Companion not found");
    }
  }
  return checked;
}

async function isBlockedEitherWay(ctx: QueryCtx, a: Id<"users">, b: Id<"users">) {
  const lookup = (blockerId: Id<"users">, blockedId: Id<"users">) =>
    ctx.db
      .query("blocked_users")
      .withIndex("by_blocker_and_blocked", (q) =>
        q.eq("blockerId", blockerId).eq("blockedId", blockedId)
      )
      .first();
  const [ab, ba] = await Promise.all([lookup(a, b), lookup(b, a)]);
  return ab !== null || ba !== null;
}

// A linked user who deleted their account is dropped rather than shown as a broken link.
async function resolveCompanions(ctx: QueryCtx, companions: Companion[] = []) {
  const resolved = await Promise.all(
    companions.map(async (entry) => {
      if (entry.kind === "name") return entry;
      const user = await ctx.db.get(entry.userId);
      return user ? { ...entry, username: user.username } : null;
    })
  );
  return resolved.filter((entry) => entry !== null);
}

// Both directions, like the post and request helpers: a block hides each side from the other.
async function blockedUserIds(ctx: QueryCtx, userId: Id<"users">) {
  const [byMe, ofMe] = await Promise.all([
    ctx.db
      .query("blocked_users")
      .withIndex("by_blocker", (q) => q.eq("blockerId", userId))
      .collect(),
    ctx.db
      .query("blocked_users")
      .withIndex("by_blocked", (q) => q.eq("blockedId", userId))
      .collect(),
  ]);
  return new Set<Id<"users">>([
    ...byMe.map((b) => b.blockedId),
    ...ofMe.map((b) => b.blockerId),
  ]);
}

async function listComments(ctx: QueryCtx, trekId: Id<"treks">) {
  return await ctx.db
    .query("trek_comments")
    .withIndex("by_trek", (q) => q.eq("trekId", trekId))
    .order("asc")
    .collect();
}

async function listVisibleComments(
  ctx: QueryCtx,
  trek: Doc<"treks">,
  viewerId: Id<"users"> | undefined
) {
  if (trek.visibility !== "public") return [];
  // The owner sees every comment, blocked authors included, so they can still delete them.
  const blocked =
    viewerId && viewerId !== trek.userId
      ? await blockedUserIds(ctx, viewerId)
      : new Set<Id<"users">>();
  const comments = (await listComments(ctx, trek._id)).filter(
    (comment) => !blocked.has(comment.authorId)
  );
  return await Promise.all(
    comments.map(async (comment) => {
      const author = await ctx.db.get(comment.authorId);
      return {
        ...comment,
        author: author
          ? { _id: author._id, username: author.username, avatarUrl: author.avatarUrl }
          : null,
      };
    })
  );
}

async function listLikes(ctx: QueryCtx, trekId: Id<"treks">) {
  return await ctx.db
    .query("trek_likes")
    .withIndex("by_trek", (q) => q.eq("trekId", trekId))
    .collect();
}

// Rows stay when the trek goes private; they are hidden, not lost.
async function visibleLikes(
  ctx: QueryCtx,
  trek: Doc<"treks">,
  viewerId: Id<"users"> | undefined
) {
  if (trek.visibility !== "public") return { likeCount: 0, hasLiked: false };
  const likes = await listLikes(ctx, trek._id);
  return {
    likeCount: likes.length,
    hasLiked: viewerId !== undefined && likes.some((like) => like.userId === viewerId),
  };
}

async function withSummary(ctx: QueryCtx, trek: Doc<"treks">) {
  const days = await listDays(ctx, trek._id);
  const { likeCount } = await visibleLikes(ctx, trek, undefined);
  return { ...trek, dayCount: days.length, totals: computeTrekTotals(days), likeCount };
}

async function syncStartDate(ctx: MutationCtx, trek: Doc<"treks">) {
  const [earliest] = await listDays(ctx, trek._id);
  if (earliest && earliest.date !== trek.startDate) {
    await ctx.db.patch(trek._id, { startDate: earliest.date });
  }
}

export const createTrek = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    placeName: v.string(),
    lat: v.number(),
    lng: v.number(),
    googlePlaceId: v.optional(v.string()),
    startDate: v.string(),
    visibility: v.optional(visibility),
    companions: v.optional(v.array(companion)),
  },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId);
    const fields = {
      name: args.name.trim(),
      placeName: args.placeName.trim(),
      lat: args.lat,
      lng: args.lng,
      startDate: args.startDate,
    };
    validateTrekFields(fields);
    const companions = args.companions
      ? await checkCompanions(ctx, args.userId, args.companions)
      : undefined;

    const trekId = await ctx.db.insert("treks", {
      userId: args.userId,
      ...fields,
      googlePlaceId: args.googlePlaceId,
      visibility: args.visibility ?? "public",
      companions,
    });
    await ctx.db.insert("trek_days", {
      trekId,
      date: args.startDate,
      images: [],
    });
    return trekId;
  },
});

export const updateTrek = mutation({
  args: {
    userId: v.id("users"),
    trekId: v.id("treks"),
    name: v.optional(v.string()),
    placeName: v.optional(v.string()),
    visibility: v.optional(visibility),
    companions: v.optional(v.array(companion)),
  },
  handler: async (ctx, args) => {
    const trek = await getOwnedTrek(ctx, args.userId, args.trekId);
    const fields = {
      name: args.name?.trim() ?? trek.name,
      placeName: args.placeName?.trim() ?? trek.placeName,
      lat: trek.lat,
      lng: trek.lng,
      startDate: trek.startDate,
    };
    validateTrekFields(fields);
    const companions = args.companions
      ? await checkCompanions(ctx, args.userId, args.companions)
      : undefined;

    await ctx.db.patch(trek._id, {
      name: fields.name,
      placeName: fields.placeName,
      ...(args.visibility && { visibility: args.visibility }),
      ...(companions && { companions }),
    });
  },
});

export const deleteTrek = mutation({
  args: { userId: v.id("users"), trekId: v.id("treks") },
  handler: async (ctx, args) => {
    const trek = await getOwnedTrek(ctx, args.userId, args.trekId);
    for (const day of await listDays(ctx, trek._id)) {
      await deleteStoredImages(ctx, day.images);
      await ctx.db.delete(day._id);
    }
    for (const comment of await listComments(ctx, trek._id)) {
      await ctx.db.delete(comment._id);
    }
    for (const like of await listLikes(ctx, trek._id)) {
      await ctx.db.delete(like._id);
    }
    await ctx.db.delete(trek._id);
  },
});

export const addTrekDay = mutation({
  args: { userId: v.id("users"), trekId: v.id("treks") },
  handler: async (ctx, args) => {
    const trek = await getOwnedTrek(ctx, args.userId, args.trekId);
    const days = await listDays(ctx, trek._id);
    if (days.length >= TREK_LIMITS.daysMax) {
      throw new Error(`At most ${TREK_LIMITS.daysMax} days per trek`);
    }
    const latest = days[days.length - 1];
    return await ctx.db.insert("trek_days", {
      trekId: trek._id,
      date: latest ? nextDayDate(latest.date) : trek.startDate,
      images: [],
    });
  },
});

export const updateTrekDay = mutation({
  args: {
    userId: v.id("users"),
    dayId: v.id("trek_days"),
    date: v.optional(v.string()),
    notes: v.optional(clearableString),
    placeNote: v.optional(clearableString),
    weather: v.optional(clearableString),
    distanceMeters: v.optional(clearableNumber),
    durationMinutes: v.optional(clearableNumber),
    elevationGainMeters: v.optional(clearableNumber),
    maxElevationMeters: v.optional(clearableNumber),
    images: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { userId, dayId, ...fields } = args;
    const { day, trek } = await getOwnedDay(ctx, userId, dayId);
    validateDayFields(fields);
    if (fields.images) {
      await assertStoredFiles(
        ctx,
        fields.images.filter((id) => !day.images.includes(id))
      );
    }

    // The arg validator limits the keys to trek_days fields; null means clear.
    const patch = Object.fromEntries(
      Object.entries(fields)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, value ?? undefined])
    ) as Partial<Doc<"trek_days">>;
    await ctx.db.patch(day._id, patch);

    if (fields.images) {
      await deleteStoredImages(
        ctx,
        day.images.filter((id) => !fields.images!.includes(id))
      );
    }
    if (fields.date !== undefined) await syncStartDate(ctx, trek);
  },
});

export const deleteTrekDay = mutation({
  args: { userId: v.id("users"), dayId: v.id("trek_days") },
  handler: async (ctx, args) => {
    const { day, trek } = await getOwnedDay(ctx, args.userId, args.dayId);
    if ((await listDays(ctx, trek._id)).length < 2) {
      throw new Error("A trek needs at least one day");
    }
    await deleteStoredImages(ctx, day.images);
    await ctx.db.delete(day._id);
    await syncStartDate(ctx, trek);
  },
});

export const getTrek = query({
  args: { trekId: v.id("treks"), viewerId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const trek = await ctx.db.get(args.trekId);
    if (!trek || !canViewTrek(trek, args.viewerId)) return null;

    const owner = await ctx.db.get(trek.userId);
    const days = await Promise.all(
      (await listDays(ctx, trek._id)).map(async (day) => {
        const urls = await Promise.all(
          day.images.map((id) => ctx.storage.getUrl(id as Id<"_storage">))
        );
        const photos = day.images.flatMap((storageId, i) =>
          urls[i] ? [{ storageId, url: urls[i] }] : []
        );
        return { ...day, photos };
      })
    );

    return {
      ...trek,
      owner: owner
        ? { _id: owner._id, username: owner.username }
        : null,
      companions: await resolveCompanions(ctx, trek.companions),
      days,
      totals: computeTrekTotals(days),
      comments: await listVisibleComments(ctx, trek, args.viewerId),
      ...(await visibleLikes(ctx, trek, args.viewerId)),
    };
  },
});

export const addTrekComment = mutation({
  args: { userId: v.id("users"), trekId: v.id("treks"), content: v.string() },
  handler: async (ctx, args) => {
    const author = await requireMember(ctx, args.userId);
    const trek = await ctx.db.get(args.trekId);
    if (!trek || trek.visibility !== "public") throw new Error("Trek not found");
    if (await isBlockedEitherWay(ctx, trek.userId, author._id)) {
      throw new Error("Cannot comment on this trek");
    }
    const content = args.content.trim();
    if (content.length === 0) throw new Error("Comment is required");
    if (content.length > TREK_LIMITS.commentMax) {
      throw new Error(`Comment must be ${TREK_LIMITS.commentMax} characters or less`);
    }

    const commentId = await ctx.db.insert("trek_comments", {
      trekId: trek._id,
      authorId: author._id,
      content,
    });

    const owner = trek.userId === author._id ? null : await ctx.db.get(trek.userId);
    if (owner) {
      // At most one email per trek per hour, so a busy thread cannot flood the owner.
      await notifyUser(ctx, {
        user: owner,
        kind: "trek_comment",
        key: trek._id,
        cooldown: 60 * 60 * 1000,
        subject: `New comment on "${truncate(trek.name, 60)}"`,
        bodyHtml: commentEmailBody({
          actorName: author.username,
          requestTitle: trek.name,
          requestUrl: `${appUrl()}/treks/${trek._id}`,
          commentPreview: content,
        }),
      });
    }
    return commentId;
  },
});

export const deleteTrekComment = mutation({
  args: { userId: v.id("users"), commentId: v.id("trek_comments") },
  handler: async (ctx, args) => {
    await requireMember(ctx, args.userId);
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");
    const trek = await ctx.db.get(comment.trekId);
    const isOwner = trek?.userId === args.userId;
    if (!isOwner && comment.authorId !== args.userId) {
      throw new Error("Only the author or the trek owner can delete this comment");
    }
    await ctx.db.delete(comment._id);
  },
});

export const toggleTrekLike = mutation({
  args: { userId: v.id("users"), trekId: v.id("treks") },
  handler: async (ctx, args) => {
    const user = await requireMember(ctx, args.userId);
    const trek = await ctx.db.get(args.trekId);
    if (!trek || trek.visibility !== "public") throw new Error("Trek not found");
    // Same message as a missing trek, so a blocked user learns nothing.
    if (await isBlockedEitherWay(ctx, trek.userId, user._id)) {
      throw new Error("Trek not found");
    }

    const existing = await ctx.db
      .query("trek_likes")
      .withIndex("by_user_trek", (q) =>
        q.eq("userId", user._id).eq("trekId", trek._id)
      )
      .first();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { liked: false };
    }
    await ctx.db.insert("trek_likes", { trekId: trek._id, userId: user._id });
    return { liked: true };
  },
});

export const getUserTreks = query({
  args: { userId: v.id("users"), viewerId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const treks = await ctx.db
      .query("treks")
      .withIndex("by_user_start", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(200);

    return await Promise.all(
      treks
        .filter((trek) => canViewTrek(trek, args.viewerId))
        .map((trek) => withSummary(ctx, trek))
    );
  },
});

export const getPublicTreks = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const term = args.search?.trim().toLowerCase() ?? "";
    const newest = await ctx.db
      .query("treks")
      .withIndex("by_visibility_start", (q) => q.eq("visibility", "public"))
      .order("desc")
      .take(term ? PUBLIC_SEARCH_WINDOW : PUBLIC_LIST_SIZE);

    const matching = newest
      .filter(
        (trek) =>
          term === "" ||
          trek.placeName.toLowerCase().includes(term) ||
          trek.name.toLowerCase().includes(term)
      )
      .slice(0, PUBLIC_LIST_SIZE);

    return await Promise.all(
      matching.map(async (trek) => {
        const owner = await ctx.db.get(trek.userId);
        return {
          ...(await withSummary(ctx, trek)),
          owner: owner ? { _id: owner._id, username: owner.username } : null,
        };
      })
    );
  },
});

// For the sitemap and static params; private treks must never be listed.
export const getPublicTrekIds = query({
  args: {},
  handler: async (ctx) => {
    const treks = await ctx.db
      .query("treks")
      .withIndex("by_visibility_start", (q) => q.eq("visibility", "public"))
      .order("desc")
      .take(10000);
    return treks.map((trek) => ({ _id: trek._id, _creationTime: trek._creationTime }));
  },
});
