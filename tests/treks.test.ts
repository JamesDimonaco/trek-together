import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import schema from "../convex/schema";
import { api } from "../convex/_generated/api";

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
