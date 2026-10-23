import { describe, expect, it } from "vitest";
import {
  canViewTrek,
  computeTrekTotals,
  nextDayDate,
  validateCompanions,
  validateDayFields,
  validateTrekFields,
} from "../convex/lib/treks";
import {
  formatDistance,
  formatDuration,
  formatElevation,
  formatTrekDate,
  hoursMinutesToMinutes,
  kmToMeters,
  summarizeStats,
} from "../lib/trek-utils";

const validTrek = {
  name: "Torres del Paine W",
  placeName: "Torres del Paine National Park",
  lat: -50.94,
  lng: -73.4,
  startDate: "2026-11-02",
};

describe("canViewTrek", () => {
  it("lets anyone, including signed-out visitors, see a public trek", () => {
    const trek = { userId: "owner", visibility: "public" as const };
    expect(canViewTrek(trek, "someone-else")).toBe(true);
    expect(canViewTrek(trek, null)).toBe(true);
  });

  it("shows a private trek to its owner only", () => {
    const trek = { userId: "owner", visibility: "private" as const };
    expect(canViewTrek(trek, "owner")).toBe(true);
    expect(canViewTrek(trek, "someone-else")).toBe(false);
    expect(canViewTrek(trek, null)).toBe(false);
    expect(canViewTrek(trek, undefined)).toBe(false);
  });
});

describe("computeTrekTotals", () => {
  it("sums distance, duration and gain, and takes the highest max elevation", () => {
    const totals = computeTrekTotals([
      {
        distanceMeters: 12_000,
        durationMinutes: 300,
        elevationGainMeters: 800,
        maxElevationMeters: 1500,
      },
      {
        distanceMeters: 9_500,
        durationMinutes: 240,
        elevationGainMeters: 1100,
        maxElevationMeters: 2100,
      },
    ]);
    expect(totals).toEqual({
      distanceMeters: 21_500,
      durationMinutes: 540,
      elevationGainMeters: 1900,
      maxElevationMeters: 2100,
    });
  });

  it("skips days with missing values instead of counting them as zero", () => {
    const totals = computeTrekTotals([
      { distanceMeters: 5_000 },
      {},
      { distanceMeters: 3_000, maxElevationMeters: -20 },
    ]);
    expect(totals.distanceMeters).toBe(8_000);
    expect(totals.maxElevationMeters).toBe(-20);
    expect(totals.durationMinutes).toBeUndefined();
    expect(totals.elevationGainMeters).toBeUndefined();
  });

  it("returns no totals for a trek with no stats", () => {
    expect(computeTrekTotals([{}, {}])).toEqual({});
  });
});

describe("nextDayDate", () => {
  it("rolls over month, year and leap-day boundaries", () => {
    expect(nextDayDate("2026-11-02")).toBe("2026-11-03");
    expect(nextDayDate("2026-11-30")).toBe("2026-12-01");
    expect(nextDayDate("2026-12-31")).toBe("2027-01-01");
    expect(nextDayDate("2028-02-28")).toBe("2028-02-29");
    expect(nextDayDate("2027-02-28")).toBe("2027-03-01");
  });
});

describe("validateTrekFields", () => {
  it("accepts a valid trek", () => {
    expect(() => validateTrekFields(validTrek)).not.toThrow();
  });

  it("rejects coordinates outside the globe", () => {
    expect(() => validateTrekFields({ ...validTrek, lat: 90.5 })).toThrow();
    expect(() => validateTrekFields({ ...validTrek, lng: -180.1 })).toThrow();
    expect(() => validateTrekFields({ ...validTrek, lat: NaN })).toThrow();
    expect(() =>
      validateTrekFields({ ...validTrek, lng: Infinity })
    ).toThrow();
  });

  it("rejects impossible dates, not just malformed ones", () => {
    expect(() =>
      validateTrekFields({ ...validTrek, startDate: "2026-02-30" })
    ).toThrow();
    expect(() =>
      validateTrekFields({ ...validTrek, startDate: "02/11/2026" })
    ).toThrow();
  });

  it("rejects blank or oversized names", () => {
    expect(() => validateTrekFields({ ...validTrek, name: "   " })).toThrow();
    expect(() =>
      validateTrekFields({ ...validTrek, name: "x".repeat(121) })
    ).toThrow();
    expect(() =>
      validateTrekFields({ ...validTrek, placeName: "" })
    ).toThrow();
  });
});

describe("validateDayFields", () => {
  it("accepts a day with only some fields", () => {
    expect(() =>
      validateDayFields({ notes: "Cold and windy", distanceMeters: 8000 })
    ).not.toThrow();
    expect(() => validateDayFields({})).not.toThrow();
  });

  it("requires whole-number metric values within sane limits", () => {
    expect(() => validateDayFields({ distanceMeters: -1 })).toThrow();
    expect(() => validateDayFields({ distanceMeters: 1500.5 })).toThrow();
    expect(() => validateDayFields({ durationMinutes: 1441 })).toThrow();
    expect(() => validateDayFields({ elevationGainMeters: -5 })).toThrow();
    expect(() => validateDayFields({ maxElevationMeters: 9001 })).toThrow();
    expect(() => validateDayFields({ maxElevationMeters: -430 })).not.toThrow();
  });

  it("limits photos to five per day and notes to 5000 characters", () => {
    expect(() =>
      validateDayFields({ images: ["a", "b", "c", "d", "e", "f"] })
    ).toThrow();
    expect(() =>
      validateDayFields({ images: ["a", "b", "c", "d", "e"] })
    ).not.toThrow();
    expect(() => validateDayFields({ notes: "x".repeat(5001) })).toThrow();
  });

  it("rejects an impossible day date", () => {
    expect(() => validateDayFields({ date: "2026-13-01" })).toThrow();
  });
});

describe("validateCompanions", () => {
  const user = (userId: string) => ({ kind: "user" as const, userId });
  const name = (value: string) => ({ kind: "name" as const, name: value });

  it("returns trimmed names and keeps linked users as they are", () => {
    expect(validateCompanions([user("u2"), name("  Ana  ")], "owner")).toEqual([
      user("u2"),
      name("Ana"),
    ]);
  });

  it("caps the list at ten so a trek page cannot be stuffed with names", () => {
    const ten = Array.from({ length: 10 }, (_, i) => name(`Friend ${i}`));
    expect(() => validateCompanions(ten, "owner")).not.toThrow();
    expect(() => validateCompanions([...ten, name("One more")], "owner")).toThrow();
  });

  it("rejects the same linked user twice", () => {
    expect(() => validateCompanions([user("u2"), user("u2")], "owner")).toThrow();
  });

  it("rejects the same plain name twice, ignoring case and spacing, so a double-click cannot duplicate a chip", () => {
    expect(() => validateCompanions([name("Ana"), name(" ana ")], "owner")).toThrow();
    expect(() => validateCompanions([name("Ana"), name("Anna")], "owner")).not.toThrow();
  });

  it("rejects the owner listing themself as a companion", () => {
    expect(() => validateCompanions([user("owner")], "owner")).toThrow();
  });

  it("rejects blank or oversized names", () => {
    expect(() => validateCompanions([name("   ")], "owner")).toThrow();
    expect(() => validateCompanions([name("x".repeat(101))], "owner")).toThrow();
  });
});

describe("display formatters", () => {
  it("formats distance in metres below 1 km and kilometres above", () => {
    expect(formatDistance(850)).toBe("850 m");
    expect(formatDistance(12_400)).toBe("12.4 km");
    expect(formatDistance(21_000)).toBe("21 km");
  });

  it("formats duration as hours and minutes", () => {
    expect(formatDuration(45)).toBe("45m");
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(150)).toBe("2h 30m");
  });

  it("formats elevation in metres", () => {
    expect(formatElevation(1850)).toBe("1,850 m");
  });

  it("writes dates day-first, with no timezone shift", () => {
    expect(formatTrekDate("2026-11-02")).toBe("2 Nov 2026");
    expect(formatTrekDate("2026-01-01")).toBe("1 Jan 2026");
  });

  it("summarises only the stats that were logged", () => {
    expect(
      summarizeStats({ distanceMeters: 12_400, elevationGainMeters: 1900 })
    ).toEqual(["12.4 km", "1,900 m gain"]);
    expect(summarizeStats({})).toEqual([]);
    expect(summarizeStats({ maxElevationMeters: 0 })).toEqual(["max 0 m"]);
  });
});

describe("form input conversion", () => {
  it("turns kilometres into whole metres and blank into null (clear)", () => {
    expect(kmToMeters("12.4")).toBe(12_400);
    expect(kmToMeters("0.0005")).toBe(1);
    expect(kmToMeters("")).toBeNull();
    expect(kmToMeters("  ")).toBeNull();
  });

  it("turns hours and minutes into total minutes, treating one blank field as zero", () => {
    expect(hoursMinutesToMinutes("2", "30")).toBe(150);
    expect(hoursMinutesToMinutes("", "45")).toBe(45);
    expect(hoursMinutesToMinutes("3", "")).toBe(180);
    expect(hoursMinutesToMinutes("", "")).toBeNull();
  });
});
