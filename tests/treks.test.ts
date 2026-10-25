import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import schema from "../convex/schema";
import { api } from "../convex/_generated/api";
import { TREK_LIMITS } from "../convex/lib/treks";

const modules = import.meta.glob("../convex/**/*.*s");

const place = {
  name: "Torres del Paine W",
  placeName: "Torres del Paine National Park",
  lat: -50.94,
  lng: -73.4,
  startDate: "2026-11-02",
};

function setup() {
  const t = convexTest(schema, modules);

  const makeUser = (username: string, authId?: string) =>
    t.run((ctx) =>
      ctx.db.insert("users", { username, authId, citiesVisited: [] })
    );

  return { t, makeUser };
}

async function setupWithOwnerAndStranger() {
  const { t, makeUser } = setup();
  const owner = await makeUser("owner", "clerk_owner");
  const stranger = await makeUser("stranger", "clerk_stranger");
  return { t, owner, stranger };
}

describe("createTrek", () => {
  it("creates the trek with day 1 on the start date, public by default", async () => {
    const { t, owner } = await setupWithOwnerAndStranger();

    const trekId = await t.mutation(api.treks.createTrek, {
      userId: owner,
      ...place,
    });

    const trek = await t.query(api.treks.getTrek, { trekId, viewerId: owner });
    expect(trek?.visibility).toBe("public");
    expect(trek?.startDate).toBe("2026-11-02");
    expect(trek?.days).toHaveLength(1);
    expect(trek?.days[0].date).toBe("2026-11-02");
  });

  it("rejects guests, who have no account to own a log", async () => {
    const { t, makeUser } = setup();
    const guest = await makeUser("curious-otter-43");

    await expect(
      t.mutation(api.treks.createTrek, { userId: guest, ...place })
    ).rejects.toThrow();
  });

  it("creates nothing when the input is invalid", async () => {
    const { t, owner } = await setupWithOwnerAndStranger();

    await expect(
      t.mutation(api.treks.createTrek, { userId: owner, ...place, lat: 200 })
    ).rejects.toThrow();

    const counts = await t.run(async (ctx) => ({
      treks: (await ctx.db.query("treks").collect()).length,
      days: (await ctx.db.query("trek_days").collect()).length,
    }));
    expect(counts).toEqual({ treks: 0, days: 0 });
  });
});

describe("private treks", () => {
  it("are visible to the owner only, and look like missing treks to everyone else", async () => {
    const { t, owner, stranger } = await setupWithOwnerAndStranger();
    const trekId = await t.mutation(api.treks.createTrek, {
      userId: owner,
      ...place,
      visibility: "private",
    });

    expect(await t.query(api.treks.getTrek, { trekId, viewerId: owner })).not.toBeNull();
    expect(await t.query(api.treks.getTrek, { trekId, viewerId: stranger })).toBeNull();
    expect(await t.query(api.treks.getTrek, { trekId })).toBeNull();
  });

  it("are left out of another user's view of a profile trek list", async () => {
    const { t, owner, stranger } = await setupWithOwnerAndStranger();
    await t.mutation(api.treks.createTrek, { userId: owner, ...place, name: "Public one" });
    await t.mutation(api.treks.createTrek, {
      userId: owner,
      ...place,
      name: "Private one",
      visibility: "private",
    });

    const asOwner = await t.query(api.treks.getUserTreks, { userId: owner, viewerId: owner });
    const asStranger = await t.query(api.treks.getUserTreks, { userId: owner, viewerId: stranger });
    const asGuest = await t.query(api.treks.getUserTreks, { userId: owner });

    expect(asOwner.map((x) => x.name).sort()).toEqual(["Private one", "Public one"]);
    expect(asStranger.map((x) => x.name)).toEqual(["Public one"]);
    expect(asGuest.map((x) => x.name)).toEqual(["Public one"]);
  });
});

describe("updateTrek", () => {
  it("lets the owner change visibility and name", async () => {
    const { t, owner } = await setupWithOwnerAndStranger();
    const trekId = await t.mutation(api.treks.createTrek, { userId: owner, ...place });

    await t.mutation(api.treks.updateTrek, {
      userId: owner,
      trekId,
      name: "W Trek, solo",
      visibility: "private",
    });

    const trek = await t.query(api.treks.getTrek, { trekId, viewerId: owner });
    expect(trek?.name).toBe("W Trek, solo");
    expect(trek?.visibility).toBe("private");
  });

  it("refuses another user and leaves the trek unchanged", async () => {
    const { t, owner, stranger } = await setupWithOwnerAndStranger();
    const trekId = await t.mutation(api.treks.createTrek, { userId: owner, ...place });

    await expect(
      t.mutation(api.treks.updateTrek, { userId: stranger, trekId, visibility: "private" })
    ).rejects.toThrow();

    const trek = await t.query(api.treks.getTrek, { trekId });
    expect(trek?.visibility).toBe("public");
  });
});

describe("trek days", () => {
  it("adds each new day one day after the latest day", async () => {
    const { t, owner } = await setupWithOwnerAndStranger();
    const trekId = await t.mutation(api.treks.createTrek, { userId: owner, ...place });

    await t.mutation(api.treks.addTrekDay, { userId: owner, trekId });
    await t.mutation(api.treks.addTrekDay, { userId: owner, trekId });

    const trek = await t.query(api.treks.getTrek, { trekId, viewerId: owner });
    expect(trek?.days.map((d) => d.date)).toEqual(["2026-11-02", "2026-11-03", "2026-11-04"]);
  });

  it("rejects adding a day to someone else's trek", async () => {
    const { t, owner, stranger } = await setupWithOwnerAndStranger();
    const trekId = await t.mutation(api.treks.createTrek, { userId: owner, ...place });

    await expect(
      t.mutation(api.treks.addTrekDay, { userId: stranger, trekId })
    ).rejects.toThrow();
  });

  it("stores stats and notes, and clears a field when sent null", async () => {
    const { t, owner } = await setupWithOwnerAndStranger();
    const trekId = await t.mutation(api.treks.createTrek, { userId: owner, ...place });
    const dayId = (await t.query(api.treks.getTrek, { trekId, viewerId: owner }))!.days[0]._id;

    await t.mutation(api.treks.updateTrekDay, {
      userId: owner,
      dayId,
      notes: "Wind at the pass",
      distanceMeters: 12_000,
      maxElevationMeters: 1500,
    });
    await t.mutation(api.treks.updateTrekDay, { userId: owner, dayId, notes: null });

    const day = (await t.query(api.treks.getTrek, { trekId, viewerId: owner }))!.days[0];
    expect(day.notes).toBeUndefined();
    expect(day.distanceMeters).toBe(12_000);
    expect(day.maxElevationMeters).toBe(1500);
  });

  it("rejects invalid stats without changing the day", async () => {
    const { t, owner } = await setupWithOwnerAndStranger();
    const trekId = await t.mutation(api.treks.createTrek, { userId: owner, ...place });
    const dayId = (await t.query(api.treks.getTrek, { trekId, viewerId: owner }))!.days[0]._id;

    await expect(
      t.mutation(api.treks.updateTrekDay, { userId: owner, dayId, distanceMeters: -5 })
    ).rejects.toThrow();

    const day = (await t.query(api.treks.getTrek, { trekId, viewerId: owner }))!.days[0];
    expect(day.distanceMeters).toBeUndefined();
  });

  it("rejects day edits from another user", async () => {
    const { t, owner, stranger } = await setupWithOwnerAndStranger();
    const trekId = await t.mutation(api.treks.createTrek, { userId: owner, ...place });
    const dayId = (await t.query(api.treks.getTrek, { trekId, viewerId: owner }))!.days[0]._id;

    await expect(
      t.mutation(api.treks.updateTrekDay, { userId: stranger, dayId, notes: "hacked" })
    ).rejects.toThrow();
    await expect(
      t.mutation(api.treks.deleteTrekDay, { userId: stranger, dayId })
    ).rejects.toThrow();
  });

  it("reports totals across days", async () => {
    const { t, owner } = await setupWithOwnerAndStranger();
    const trekId = await t.mutation(api.treks.createTrek, { userId: owner, ...place });
    await t.mutation(api.treks.addTrekDay, { userId: owner, trekId });
    const days = (await t.query(api.treks.getTrek, { trekId, viewerId: owner }))!.days;

    await t.mutation(api.treks.updateTrekDay, {
      userId: owner,
      dayId: days[0]._id,
      distanceMeters: 10_000,
      maxElevationMeters: 900,
    });
    await t.mutation(api.treks.updateTrekDay, {
      userId: owner,
      dayId: days[1]._id,
      distanceMeters: 7_000,
      maxElevationMeters: 1400,
    });

    const trek = await t.query(api.treks.getTrek, { trekId, viewerId: owner });
    expect(trek?.totals).toEqual({ distanceMeters: 17_000, maxElevationMeters: 1400 });
  });

  it("keeps the trek start date equal to its earliest day", async () => {
    const { t, owner } = await setupWithOwnerAndStranger();
    const trekId = await t.mutation(api.treks.createTrek, { userId: owner, ...place });
    await t.mutation(api.treks.addTrekDay, { userId: owner, trekId });
    const [first, second] = (await t.query(api.treks.getTrek, { trekId, viewerId: owner }))!.days;

    await t.mutation(api.treks.updateTrekDay, {
      userId: owner,
      dayId: first._id,
      date: "2026-11-10",
    });
    expect((await t.query(api.treks.getTrek, { trekId, viewerId: owner }))?.startDate).toBe(
      "2026-11-03"
    );

    await t.mutation(api.treks.deleteTrekDay, { userId: owner, dayId: second._id });
    expect((await t.query(api.treks.getTrek, { trekId, viewerId: owner }))?.startDate).toBe(
      "2026-11-10"
    );
  });

  it("never lets the last day be deleted", async () => {
    const { t, owner } = await setupWithOwnerAndStranger();
    const trekId = await t.mutation(api.treks.createTrek, { userId: owner, ...place });
    const dayId = (await t.query(api.treks.getTrek, { trekId, viewerId: owner }))!.days[0]._id;

    await expect(
      t.mutation(api.treks.deleteTrekDay, { userId: owner, dayId })
    ).rejects.toThrow();
  });
});

describe("deleteTrek", () => {
  it("removes the trek, its days and their stored photos", async () => {
    const { t, owner } = await setupWithOwnerAndStranger();
    const trekId = await t.mutation(api.treks.createTrek, { userId: owner, ...place });
    const dayId = (await t.query(api.treks.getTrek, { trekId, viewerId: owner }))!.days[0]._id;
    const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["photo"])));
    await t.mutation(api.treks.updateTrekDay, {
      userId: owner,
      dayId,
      images: [storageId],
    });

    await t.mutation(api.treks.deleteTrek, { userId: owner, trekId });

    const left = await t.run(async (ctx) => ({
      treks: (await ctx.db.query("treks").collect()).length,
      days: (await ctx.db.query("trek_days").collect()).length,
      photo: await ctx.storage.getUrl(storageId),
    }));
    expect(left).toEqual({ treks: 0, days: 0, photo: null });
  });

  it("refuses another user and keeps everything", async () => {
    const { t, owner, stranger } = await setupWithOwnerAndStranger();
    const trekId = await t.mutation(api.treks.createTrek, { userId: owner, ...place });

    await expect(
      t.mutation(api.treks.deleteTrek, { userId: stranger, trekId })
    ).rejects.toThrow();

    expect(await t.query(api.treks.getTrek, { trekId, viewerId: owner })).not.toBeNull();
  });
});

describe("public trek browsing", () => {
  async function setupWithThreeTreks() {
    const { t, owner, stranger } = await setupWithOwnerAndStranger();
    await t.mutation(api.treks.createTrek, {
      userId: owner,
      ...place,
      name: "Older",
      startDate: "2026-01-05",
    });
    await t.mutation(api.treks.createTrek, {
      userId: stranger,
      ...place,
      name: "Newer",
      placeName: "Huayhuash Circuit",
      startDate: "2026-06-20",
    });
    const privateId = await t.mutation(api.treks.createTrek, {
      userId: owner,
      ...place,
      name: "Secret",
      startDate: "2026-09-01",
      visibility: "private",
    });
    return { t, owner, stranger, privateId };
  }

  it("lists public treks newest first, with the owner's username, and leaves private treks out", async () => {
    const { t } = await setupWithThreeTreks();

    const treks = await t.query(api.treks.getPublicTreks, {});

    expect(treks.map((x) => x.name)).toEqual(["Newer", "Older"]);
    expect(treks.map((x) => x.owner?.username)).toEqual(["stranger", "owner"]);
  });

  it("matches the place name case-insensitively and never surfaces a private trek", async () => {
    const { t } = await setupWithThreeTreks();

    expect(
      (await t.query(api.treks.getPublicTreks, { search: "torres DEL" })).map((x) => x.name)
    ).toEqual(["Older"]);
    expect(
      (await t.query(api.treks.getPublicTreks, { search: "secret" })).map((x) => x.name)
    ).toEqual([]);
  });

  it("leaves private treks out of the sitemap and static-params id list", async () => {
    const { t, privateId } = await setupWithThreeTreks();

    const ids = await t.query(api.treks.getPublicTrekIds, {});

    expect(ids).toHaveLength(2);
    expect(ids.map((x) => x._id)).not.toContain(privateId);
  });
});

describe("companions", () => {
  async function setupWithFriend() {
    const { t, owner, stranger } = await setupWithOwnerAndStranger();
    const friend = await t.run((ctx) =>
      ctx.db.insert("users", { username: "friend", authId: "clerk_friend", citiesVisited: [] })
    );
    return { t, owner, stranger, friend };
  }

  it("resolves linked users to usernames and keeps plain names", async () => {
    const { t, owner, friend } = await setupWithFriend();

    const trekId = await t.mutation(api.treks.createTrek, {
      userId: owner,
      ...place,
      companions: [
        { kind: "user", userId: friend },
        { kind: "name", name: "Ana" },
      ],
    });

    const trek = await t.query(api.treks.getTrek, { trekId });
    expect(trek?.companions).toEqual([
      { kind: "user", userId: friend, username: "friend" },
      { kind: "name", name: "Ana" },
    ]);
  });

  it("rejects a guest session row as a companion, since it has no profile to link to", async () => {
    const { t, owner } = await setupWithFriend();
    const guest = await t.run((ctx) =>
      ctx.db.insert("users", { username: "curious-otter-43", citiesVisited: [] })
    );

    await expect(
      t.mutation(api.treks.createTrek, {
        userId: owner,
        ...place,
        companions: [{ kind: "user", userId: guest }],
      })
    ).rejects.toThrow();
  });

  it("rejects a companion the owner has blocked, so blocking cannot be undone from a trek", async () => {
    const { t, owner, friend } = await setupWithFriend();
    await t.run((ctx) =>
      ctx.db.insert("blocked_users", { blockerId: owner, blockedId: friend })
    );

    await expect(
      t.mutation(api.treks.createTrek, {
        userId: owner,
        ...place,
        companions: [{ kind: "user", userId: friend }],
      })
    ).rejects.toThrow("Companion not found");
  });

  it("rejects a companion who blocked the owner, without revealing the block", async () => {
    const { t, owner, friend } = await setupWithFriend();
    await t.run((ctx) =>
      ctx.db.insert("blocked_users", { blockerId: friend, blockedId: owner })
    );

    await expect(
      t.mutation(api.treks.createTrek, {
        userId: owner,
        ...place,
        companions: [{ kind: "user", userId: friend }],
      })
    ).rejects.toThrow("Companion not found");
  });

  it("rejects a linked user that does not exist, so a profile link can never dangle", async () => {
    const { t, owner, friend } = await setupWithFriend();
    await t.run((ctx) => ctx.db.delete(friend));

    await expect(
      t.mutation(api.treks.createTrek, {
        userId: owner,
        ...place,
        companions: [{ kind: "user", userId: friend }],
      })
    ).rejects.toThrow();
  });

  it("rejects the owner as a companion and a blank name on update, keeping the old list", async () => {
    const { t, owner, friend } = await setupWithFriend();
    const trekId = await t.mutation(api.treks.createTrek, {
      userId: owner,
      ...place,
      companions: [{ kind: "user", userId: friend }],
    });

    await expect(
      t.mutation(api.treks.updateTrek, {
        userId: owner,
        trekId,
        companions: [{ kind: "user", userId: owner }],
      })
    ).rejects.toThrow();
    await expect(
      t.mutation(api.treks.updateTrek, {
        userId: owner,
        trekId,
        companions: [{ kind: "name", name: "  " }],
      })
    ).rejects.toThrow();

    const trek = await t.query(api.treks.getTrek, { trekId });
    expect(trek?.companions).toEqual([{ kind: "user", userId: friend, username: "friend" }]);
  });

  it("replaces the whole list on update, and leaves it alone when the field is absent", async () => {
    const { t, owner, friend } = await setupWithFriend();
    const trekId = await t.mutation(api.treks.createTrek, {
      userId: owner,
      ...place,
      companions: [{ kind: "user", userId: friend }],
    });

    await t.mutation(api.treks.updateTrek, { userId: owner, trekId, name: "Renamed" });
    expect((await t.query(api.treks.getTrek, { trekId }))?.companions).toEqual([
      { kind: "user", userId: friend, username: "friend" },
    ]);

    await t.mutation(api.treks.updateTrek, {
      userId: owner,
      trekId,
      companions: [{ kind: "name", name: "Ana" }],
    });
    expect((await t.query(api.treks.getTrek, { trekId }))?.companions).toEqual([
      { kind: "name", name: "Ana" },
    ]);
  });

  it("drops a companion whose account was deleted instead of breaking the trek page", async () => {
    const { t, owner, friend } = await setupWithFriend();
    const trekId = await t.mutation(api.treks.createTrek, {
      userId: owner,
      ...place,
      companions: [
        { kind: "user", userId: friend },
        { kind: "name", name: "Ana" },
      ],
    });
    await t.run((ctx) => ctx.db.delete(friend));

    const trek = await t.query(api.treks.getTrek, { trekId });
    expect(trek?.companions).toEqual([{ kind: "name", name: "Ana" }]);
  });
});

describe("trek day photos", () => {
  async function dayWithPhotos() {
    const { t, owner } = await setupWithOwnerAndStranger();
    const trekId = await t.mutation(api.treks.createTrek, { userId: owner, ...place });
    const dayId = (await t.query(api.treks.getTrek, { trekId, viewerId: owner }))!.days[0]._id;
    const keep = await t.run((ctx) => ctx.storage.store(new Blob(["keep"])));
    const drop = await t.run((ctx) => ctx.storage.store(new Blob(["drop"])));
    await t.mutation(api.treks.updateTrekDay, { userId: owner, dayId, images: [keep, drop] });
    return { t, owner, trekId, dayId, keep, drop };
  }

  it("deletes only the photos removed from the day", async () => {
    const { t, owner, dayId, keep, drop } = await dayWithPhotos();

    await t.mutation(api.treks.updateTrekDay, { userId: owner, dayId, images: [keep] });

    const urls = await t.run(async (ctx) => ({
      keep: await ctx.storage.getUrl(keep),
      drop: await ctx.storage.getUrl(drop),
    }));
    expect(urls.keep).not.toBeNull();
    expect(urls.drop).toBeNull();
  });

  it("rejects an id that is not a stored file, leaving the day unchanged", async () => {
    const { t, owner, trekId, dayId, keep, drop } = await dayWithPhotos();

    await expect(
      t.mutation(api.treks.updateTrekDay, { userId: owner, dayId, images: [keep, "not-a-file"] })
    ).rejects.toThrow();

    const trek = await t.query(api.treks.getTrek, { trekId, viewerId: owner });
    expect(trek?.days[0].images).toEqual([keep, drop]);
  });

  it("still deletes the trek when a photo file is already gone", async () => {
    const { t, owner, trekId, drop } = await dayWithPhotos();
    await t.run((ctx) => ctx.storage.delete(drop));

    await t.mutation(api.treks.deleteTrek, { userId: owner, trekId });

    expect(await t.query(api.treks.getTrek, { trekId, viewerId: owner })).toBeNull();
  });
});

describe("addTrekDay limit", () => {
  it("stops at the per-trek day limit so listing queries stay within read limits", async () => {
    const { t, owner } = await setupWithOwnerAndStranger();
    const trekId = await t.mutation(api.treks.createTrek, { userId: owner, ...place });

    for (let day = 2; day <= TREK_LIMITS.daysMax; day++) {
      await t.mutation(api.treks.addTrekDay, { userId: owner, trekId });
    }

    await expect(
      t.mutation(api.treks.addTrekDay, { userId: owner, trekId })
    ).rejects.toThrow(/days per trek/);
  });
});

describe("trek comments", () => {
  async function setupWithPublicTrek() {
    const { t, owner, stranger } = await setupWithOwnerAndStranger();
    const trekId = await t.mutation(api.treks.createTrek, { userId: owner, ...place });
    const comment = (userId: typeof owner, content = "Is the bridge at km 12 open?") =>
      t.mutation(api.treks.addTrekComment, { userId, trekId, content });
    const commentsOf = (viewerId?: typeof owner) =>
      t.query(api.treks.getTrek, { trekId, viewerId }).then((trek) => trek?.comments ?? []);
    const setVisibility = (visibility: "public" | "private") =>
      t.mutation(api.treks.updateTrek, { userId: owner, trekId, visibility });
    return { t, owner, stranger, trekId, comment, commentsOf, setVisibility };
  }

  it("rejects a comment on a private trek, so a private log cannot gain content through the API", async () => {
    const { stranger, comment, setVisibility } = await setupWithPublicTrek();
    await setVisibility("private");

    await expect(comment(stranger)).rejects.toThrow();
  });

  it("rejects a comment from someone the owner blocked, so blocking protects the owner's page", async () => {
    const { t, owner, stranger, comment } = await setupWithPublicTrek();
    await t.run((ctx) =>
      ctx.db.insert("blocked_users", { blockerId: owner, blockedId: stranger })
    );

    await expect(comment(stranger)).rejects.toThrow("Cannot comment on this trek");
  });

  it("rejects a comment from someone who blocked the owner, so a block cannot be one-way harassment", async () => {
    const { t, owner, stranger, comment } = await setupWithPublicTrek();
    await t.run((ctx) =>
      ctx.db.insert("blocked_users", { blockerId: stranger, blockedId: owner })
    );

    await expect(comment(stranger)).rejects.toThrow("Cannot comment on this trek");
  });

  it("lets the owner delete any comment and the author delete their own, but no one else", async () => {
    const { t, owner, stranger, comment, commentsOf } = await setupWithPublicTrek();
    const third = await t.run((ctx) =>
      ctx.db.insert("users", { username: "third", authId: "clerk_third", citiesVisited: [] })
    );
    const byStranger = await comment(stranger);
    const byThird = await comment(third, "Snow above 4000m last week");

    await expect(
      t.mutation(api.treks.deleteTrekComment, { userId: third, commentId: byStranger })
    ).rejects.toThrow();
    expect(await commentsOf()).toHaveLength(2);

    await t.mutation(api.treks.deleteTrekComment, { userId: stranger, commentId: byStranger });
    await t.mutation(api.treks.deleteTrekComment, { userId: owner, commentId: byThird });
    expect(await commentsOf()).toEqual([]);
  });

  it("hides comments while the trek is private and shows them again when it goes public, losing nothing", async () => {
    const { owner, stranger, comment, commentsOf, setVisibility } = await setupWithPublicTrek();
    await comment(stranger);

    await setVisibility("private");
    expect(await commentsOf(owner)).toEqual([]);

    await setVisibility("public");
    const comments = await commentsOf();
    expect(comments).toHaveLength(1);
    expect(comments[0].content).toBe("Is the bridge at km 12 open?");
    expect(comments[0].author?.username).toBe("stranger");
  });

  it("hides comments from an author the viewer has blocked, so a block holds on every trek", async () => {
    const { t, owner, stranger, comment, commentsOf } = await setupWithPublicTrek();
    const reader = await t.run((ctx) =>
      ctx.db.insert("users", { username: "reader", authId: "clerk_reader", citiesVisited: [] })
    );
    await comment(stranger);
    await comment(owner, "Yes, open as of Monday");
    await t.run((ctx) =>
      ctx.db.insert("blocked_users", { blockerId: reader, blockedId: stranger })
    );

    expect((await commentsOf(reader)).map((c) => c.author?.username)).toEqual(["owner"]);
    expect((await commentsOf()).map((c) => c.author?.username)).toEqual(["stranger", "owner"]);
  });

  it("owner still sees comments from a user they blocked so they can delete them", async () => {
    const { t, owner, stranger, comment, commentsOf } = await setupWithPublicTrek();
    const third = await t.run((ctx) =>
      ctx.db.insert("users", { username: "third", authId: "clerk_third", citiesVisited: [] })
    );
    const commentId = await comment(stranger);
    await t.run(async (ctx) => {
      await ctx.db.insert("blocked_users", { blockerId: owner, blockedId: stranger });
      await ctx.db.insert("blocked_users", { blockerId: third, blockedId: stranger });
    });

    expect((await commentsOf(owner)).map((c) => c._id)).toEqual([commentId]);
    expect(await commentsOf(third)).toEqual([]);

    await t.mutation(api.treks.deleteTrekComment, { userId: owner, commentId });
    expect(await commentsOf(owner)).toEqual([]);
  });

  it("rejects empty and over-limit comments, so the thread stays readable", async () => {
    const { stranger, comment, commentsOf } = await setupWithPublicTrek();

    await expect(comment(stranger, "   ")).rejects.toThrow();
    await expect(comment(stranger, "x".repeat(TREK_LIMITS.commentMax + 1))).rejects.toThrow();
    expect(await commentsOf()).toEqual([]);
  });

  it("deletes the comments with the trek, so no orphan rows remain", async () => {
    const { t, owner, stranger, trekId, comment } = await setupWithPublicTrek();
    await comment(stranger);

    await t.mutation(api.treks.deleteTrek, { userId: owner, trekId });

    const left = await t.run((ctx) => ctx.db.query("trek_comments").collect());
    expect(left).toEqual([]);
  });

  it("emails the owner about a comment, but not about their own, so their inbox stays honest", async () => {
    const { t, owner, stranger, trekId, comment } = await setupWithPublicTrek();
    await t.run((ctx) =>
      ctx.db.patch(owner, { email: "owner@example.com", emailNotifications: true })
    );
    const logged = () =>
      t.run((ctx) =>
        ctx.db
          .query("notification_log")
          .withIndex("by_user_kind_key", (q) =>
            q.eq("userId", owner).eq("kind", "trek_comment").eq("key", trekId)
          )
          .collect()
      );

    await comment(owner, "Thanks for reading");
    expect(await logged()).toHaveLength(0);

    await comment(stranger);
    expect(await logged()).toHaveLength(1);
  });
});

describe("trek likes", () => {
  async function setupWithPublicTrek() {
    const { t, owner, stranger } = await setupWithOwnerAndStranger();
    const trekId = await t.mutation(api.treks.createTrek, { userId: owner, ...place });
    const like = (userId: typeof owner) =>
      t.mutation(api.treks.toggleTrekLike, { userId, trekId });
    const likesOf = (viewerId?: typeof owner) =>
      t
        .query(api.treks.getTrek, { trekId, viewerId })
        .then((trek) => ({ likeCount: trek?.likeCount, hasLiked: trek?.hasLiked }));
    const setVisibility = (visibility: "public" | "private") =>
      t.mutation(api.treks.updateTrek, { userId: owner, trekId, visibility });
    return { t, owner, stranger, trekId, like, likesOf, setVisibility };
  }

  it("rejects a like on a private trek, so a private log cannot gain likes through the API", async () => {
    const { stranger, like, setVisibility } = await setupWithPublicTrek();
    await setVisibility("private");

    await expect(like(stranger)).rejects.toThrow("Trek not found");
  });

  it("blocked users cannot like in either direction, so a block holds on every trek", async () => {
    const { t, owner, stranger, like } = await setupWithPublicTrek();
    const rows = () => t.run((ctx) => ctx.db.query("trek_likes").collect());

    const block = await t.run((ctx) =>
      ctx.db.insert("blocked_users", { blockerId: owner, blockedId: stranger })
    );
    await expect(like(stranger)).rejects.toThrow("Trek not found");
    expect(await rows()).toEqual([]);

    await t.run(async (ctx) => {
      await ctx.db.delete(block);
      await ctx.db.insert("blocked_users", { blockerId: stranger, blockedId: owner });
    });
    await expect(like(stranger)).rejects.toThrow("Trek not found");
    expect(await rows()).toEqual([]);
  });

  it("a like given before a block can still be removed, so a block cannot lock it in place", async () => {
    const { t, owner, stranger, like } = await setupWithPublicTrek();
    const rows = () => t.run((ctx) => ctx.db.query("trek_likes").collect());

    expect(await like(stranger)).toEqual({ liked: true });
    await t.run((ctx) =>
      ctx.db.insert("blocked_users", { blockerId: owner, blockedId: stranger })
    );

    expect(await like(stranger)).toEqual({ liked: false });
    expect(await rows()).toEqual([]);
    await expect(like(stranger)).rejects.toThrow("Trek not found");
  });

  it("rejects a guest, who has no account to like from", async () => {
    const { t, like } = await setupWithPublicTrek();
    const guest = await t.run((ctx) =>
      ctx.db.insert("users", { username: "curious-otter-43", citiesVisited: [] })
    );

    await expect(like(guest)).rejects.toThrow("Authentication required");
  });

  it("toggles once per user, so a double tap cannot inflate the count", async () => {
    const { stranger, like, likesOf } = await setupWithPublicTrek();

    expect(await like(stranger)).toEqual({ liked: true });
    expect(await likesOf(stranger)).toEqual({ likeCount: 1, hasLiked: true });

    expect(await like(stranger)).toEqual({ liked: false });
    expect(await likesOf(stranger)).toEqual({ likeCount: 0, hasLiked: false });
    expect(await likesOf()).toEqual({ likeCount: 0, hasLiked: false });
  });

  it("hides likes while the trek is private and shows them again when it goes public, losing nothing", async () => {
    const { owner, stranger, like, likesOf, setVisibility } = await setupWithPublicTrek();
    await like(stranger);

    await setVisibility("private");
    expect(await likesOf(owner)).toEqual({ likeCount: 0, hasLiked: false });

    await setVisibility("public");
    expect(await likesOf(stranger)).toEqual({ likeCount: 1, hasLiked: true });
    expect(await likesOf()).toEqual({ likeCount: 1, hasLiked: false });
  });

  it("deletes the likes with the trek, so no orphan rows remain", async () => {
    const { t, owner, stranger, trekId, like } = await setupWithPublicTrek();
    await like(stranger);

    await t.mutation(api.treks.deleteTrek, { userId: owner, trekId });

    const left = await t.run((ctx) => ctx.db.query("trek_likes").collect());
    expect(left).toEqual([]);
  });
});

describe("trek views", () => {
  async function setupWithPublicTrek() {
    const { t, owner, stranger } = await setupWithOwnerAndStranger();
    const trekId = await t.mutation(api.treks.createTrek, { userId: owner, ...place });
    const view = (userId: typeof owner) =>
      t.mutation(api.treks.recordTrekView, { userId, trekId });
    const viewCountFor = async (viewerId?: typeof owner) => {
      const trek = await t.query(api.treks.getTrek, { trekId, viewerId });
      expect(trek).not.toBeNull();
      return trek?.viewCount;
    };
    const rows = () => t.run((ctx) => ctx.db.query("trek_views").collect());
    const setVisibility = (visibility: "public" | "private") =>
      t.mutation(api.treks.updateTrek, { userId: owner, trekId, visibility });
    return { t, owner, stranger, trekId, view, viewCountFor, rows, setVisibility };
  }

  it("counts the same viewer once per day but again on a later day, so a refresh cannot inflate the number", async () => {
    const { t, owner, stranger, trekId, view, viewCountFor, rows } = await setupWithPublicTrek();
    await t.run((ctx) =>
      ctx.db.insert("trek_views", { trekId, viewerId: stranger, day: "2000-01-01" })
    );

    await view(stranger);
    await view(stranger);

    expect(await viewCountFor(owner)).toBe(2);
    expect((await rows()).map((row) => row.day)).toContain("2000-01-01");
  });

  it("does not count the owner's own visit, so the number is honest", async () => {
    const { owner, view, viewCountFor, rows } = await setupWithPublicTrek();

    await view(owner);

    expect(await rows()).toEqual([]);
    expect(await viewCountFor(owner)).toBe(0);
  });

  it("records nothing on a private trek, so a private log gains no data through the API", async () => {
    const { stranger, view, rows, setVisibility } = await setupWithPublicTrek();
    await setVisibility("private");

    await view(stranger);

    expect(await rows()).toEqual([]);
  });

  it("returns the count to the owner only, so views are not a public popularity signal", async () => {
    const { owner, stranger, view, viewCountFor } = await setupWithPublicTrek();
    await view(stranger);

    expect(await viewCountFor(owner)).toBe(1);
    expect(await viewCountFor(stranger)).toBeUndefined();
    expect(await viewCountFor()).toBeUndefined();
  });

  it("deletes the views with the trek, so no orphan rows remain", async () => {
    const { t, owner, stranger, trekId, view, rows } = await setupWithPublicTrek();
    await view(stranger);

    await t.mutation(api.treks.deleteTrek, { userId: owner, trekId });

    expect(await rows()).toEqual([]);
  });

  it("rejects a guest, who has no account to view from", async () => {
    const { t, view, rows } = await setupWithPublicTrek();
    const guest = await t.run((ctx) =>
      ctx.db.insert("users", { username: "curious-otter-43", citiesVisited: [] })
    );

    await expect(view(guest)).rejects.toThrow("Authentication required");
    expect(await rows()).toEqual([]);
  });
});

describe("profile stats", () => {
  async function setupWithTreks() {
    const { t, owner, stranger } = await setupWithOwnerAndStranger();
    const logTrek = async (
      visibility: "public" | "private",
      days: { distanceMeters?: number; elevationGainMeters?: number }[]
    ) => {
      const trekId = await t.mutation(api.treks.createTrek, { userId: owner, ...place, visibility });
      const [first] = await t.run((ctx) =>
        ctx.db.query("trek_days").withIndex("by_trek", (q) => q.eq("trekId", trekId)).collect()
      );
      for (const [index, stats] of days.entries()) {
        const dayId =
          index === 0 ? first._id : await t.mutation(api.treks.addTrekDay, { userId: owner, trekId });
        await t.mutation(api.treks.updateTrekDay, { userId: owner, dayId, ...stats });
      }
      return trekId;
    };
    const statsFor = (viewerId?: typeof owner) =>
      t.query(api.treks.getUserTrekStats, { userId: owner, viewerId });
    return { owner, stranger, logTrek, statsFor };
  }

  it("excludes private treks from a visitor's totals, so a private log cannot leak through the numbers", async () => {
    const { stranger, logTrek, statsFor } = await setupWithTreks();
    await logTrek("public", [{ distanceMeters: 1000, elevationGainMeters: 100 }]);
    await logTrek("private", [{ distanceMeters: 5000, elevationGainMeters: 500 }]);

    const asStranger = await statsFor(stranger);
    const asGuest = await statsFor();

    const expected = { trekCount: 1, dayCount: 1, distanceMeters: 1000, elevationGainMeters: 100 };
    expect(asStranger).toEqual(expected);
    expect(asGuest).toEqual(expected);
  });

  it("includes private treks in the owner's totals, so their own record is complete", async () => {
    const { owner, logTrek, statsFor } = await setupWithTreks();
    await logTrek("public", [{ distanceMeters: 1000, elevationGainMeters: 100 }]);
    await logTrek("private", [{ distanceMeters: 5000, elevationGainMeters: 500 }]);

    expect(await statsFor(owner)).toEqual({
      trekCount: 2,
      dayCount: 2,
      distanceMeters: 6000,
      elevationGainMeters: 600,
    });
  });

  it("returns zeros for a user with no treks, so the profile can render without null checks", async () => {
    const { owner, statsFor } = await setupWithTreks();

    expect(await statsFor(owner)).toEqual({
      trekCount: 0,
      dayCount: 0,
      distanceMeters: 0,
      elevationGainMeters: 0,
    });
  });

  it("sums across treks and days, counting days without stats and leaving no field undefined", async () => {
    const { owner, logTrek, statsFor } = await setupWithTreks();
    await logTrek("public", [
      { distanceMeters: 12_000, elevationGainMeters: 800 },
      { distanceMeters: 9_500 },
      {},
    ]);
    await logTrek("public", [
      { elevationGainMeters: 1_200 },
      { distanceMeters: 4_000, elevationGainMeters: 300 },
    ]);

    expect(await statsFor(owner)).toEqual({
      trekCount: 2,
      dayCount: 5,
      distanceMeters: 25_500,
      elevationGainMeters: 2_300,
    });
  });
});
