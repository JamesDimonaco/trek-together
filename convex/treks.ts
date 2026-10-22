import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";
import {
  canViewTrek,
  computeTrekTotals,
  nextDayDate,
  validateDayFields,
  validateTrekFields,
} from "./lib/treks";

const visibility = v.union(v.literal("public"), v.literal("private"));
const clearableString = v.union(v.string(), v.null());
const clearableNumber = v.union(v.number(), v.null());

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

    const trekId = await ctx.db.insert("treks", {
      userId: args.userId,
      ...fields,
      googlePlaceId: args.googlePlaceId,
      visibility: args.visibility ?? "public",
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

    await ctx.db.patch(trek._id, {
      name: fields.name,
      placeName: fields.placeName,
      ...(args.visibility && { visibility: args.visibility }),
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
    await ctx.db.delete(trek._id);
  },
});

export const addTrekDay = mutation({
  args: { userId: v.id("users"), trekId: v.id("treks") },
  handler: async (ctx, args) => {
    const trek = await getOwnedTrek(ctx, args.userId, args.trekId);
    const days = await listDays(ctx, trek._id);
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
      days,
      totals: computeTrekTotals(days),
    };
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
        .map(async (trek) => {
          const days = await listDays(ctx, trek._id);
          return { ...trek, dayCount: days.length, totals: computeTrekTotals(days) };
        })
    );
  },
});
