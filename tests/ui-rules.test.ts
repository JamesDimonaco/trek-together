import { describe, expect, it } from "vitest";
import { formatDateRange } from "../lib/request-utils";
import { formatPostDate } from "../lib/post-utils";
import { newTrekFormErrors } from "../lib/trek-utils";
import { formatMessageTime, timeAgo } from "../lib/time-utils";

// Users read one date style everywhere (day first), matching trek dates.
describe("dates across posts and requests", () => {
  it("writes a request's date range day-first", () => {
    expect(formatDateRange("2026-11-17", "2026-11-20")).toBe("17 Nov 2026 – 20 Nov 2026");
    expect(formatDateRange("2026-01-01")).toBe("1 Jan 2026");
  });

  it("writes a post's date day-first", () => {
    expect(formatPostDate(new Date(2026, 10, 2, 12).getTime())).toBe("2 Nov 2026");
  });
});

describe("new trek form errors", () => {
  const filled = { hasPin: true, placeName: "Ausangate, Peru", name: "Ausangate loop", startDate: "2026-11-02" };

  it("has no errors when everything is filled in", () => {
    expect(newTrekFormErrors(filled)).toEqual({});
  });

  it("names each missing field next to its own input", () => {
    expect(newTrekFormErrors({ hasPin: false, placeName: " ", name: "", startDate: "" })).toEqual({
      place: "Search for a place, or drop a pin on the map.",
      placeName: "Give this place a name.",
      name: "Give your trek a name.",
      startDate: "Pick the date you started.",
    });
  });

  it("clears an error as soon as that field is fixed", () => {
    expect(newTrekFormErrors({ ...filled, name: "" })).toEqual({ name: "Give your trek a name." });
    expect(newTrekFormErrors({ ...filled, hasPin: false })).toEqual({
      place: "Search for a place, or drop a pin on the map.",
    });
  });
});

// Chat shows only a time for today's messages; older ones need the day, or they read out of order.
describe("chat message times", () => {
  const now = new Date(2026, 10, 10, 15, 0).getTime();

  it("shows only the time for today", () => {
    expect(formatMessageTime(new Date(2026, 10, 10, 9, 5).getTime(), now)).toBe("09:05");
  });

  it("adds the day for earlier days this year", () => {
    expect(formatMessageTime(new Date(2026, 10, 9, 23, 59).getTime(), now)).toBe("9 Nov, 23:59");
  });

  it("adds the year for other years", () => {
    expect(formatMessageTime(new Date(2025, 11, 31, 8, 0).getTime(), now)).toBe("31 Dec 2025, 08:00");
  });
});

describe("time ago", () => {
  it("adds the year once a date is in another year", () => {
    const old = new Date(2025, 0, 3).getTime();
    expect(timeAgo(old)).toBe("3 Jan 2025");
  });
});
