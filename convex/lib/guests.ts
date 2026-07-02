import { Doc } from "../_generated/dataModel";
import { MutationCtx } from "../_generated/server";

// Get or create the Convex user for a guest session.
// Unlike users.createGuestUser this never throws on username collisions -
// guests mid-action shouldn't be blocked on a name clash, so we suffix instead.
export async function getOrCreateGuestUser(
  ctx: MutationCtx,
  sessionId: string,
  username?: string
): Promise<Doc<"users">> {
  const existing = await ctx.db
    .query("users")
    .withIndex("by_session_id", (q) => q.eq("sessionId", sessionId))
    .first();

  if (existing) return existing;

  const desired = (username || "trekker").trim().slice(0, 40) || "trekker";

  const allUsers = await ctx.db.query("users").collect();
  const taken = new Set(allUsers.map((u) => u.username.toLowerCase()));

  let finalUsername = desired;
  let counter = 1;
  while (taken.has(finalUsername.toLowerCase())) {
    finalUsername = `${desired}-${counter}`;
    counter++;
    if (counter > 99) {
      finalUsername = `${desired}-${Math.floor(Math.random() * 10000)}`;
      break;
    }
  }

  const userId = await ctx.db.insert("users", {
    sessionId,
    username: finalUsername,
    citiesVisited: [],
    lastSeen: Date.now(),
  });

  const user = await ctx.db.get(userId);
  if (!user) throw new Error("Failed to create guest user");
  return user;
}

// Resolve the acting user for a mutation callable by both auth users and guests.
// Auth callers pass userId (verified to have authId); guests pass sessionId.
export async function resolveActor(
  ctx: MutationCtx,
  args: { userId?: Doc<"users">["_id"]; sessionId?: string; username?: string }
): Promise<Doc<"users">> {
  if (args.userId) {
    const user = await ctx.db.get(args.userId);
    if (!user || !user.authId) {
      throw new Error("Authentication required");
    }
    return user;
  }
  if (args.sessionId) {
    return await getOrCreateGuestUser(ctx, args.sessionId, args.username);
  }
  throw new Error("Authentication required");
}
