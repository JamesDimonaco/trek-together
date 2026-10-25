export type TrekVisibility = "public" | "private";

export const TREK_LIMITS = {
  nameMax: 120,
  placeNameMax: 200,
  notesMax: 5000,
  shortTextMax: 100,
  imagesMax: 5,
  daysMax: 60,
  distanceMetersMax: 500_000,
  durationMinutesMax: 24 * 60,
  elevationGainMetersMax: 20_000,
  maxElevationMetersMin: -500,
  maxElevationMetersMax: 9_000,
  companionsMax: 10,
  companionNameMax: 100,
  commentMax: 1000,
} as const;

export type TrekCompanion =
  | { kind: "user"; userId: string }
  | { kind: "name"; name: string };

export interface DayStats {
  distanceMeters?: number;
  durationMinutes?: number;
  elevationGainMeters?: number;
  maxElevationMeters?: number;
}

export function canViewTrek(
  trek: { userId: string; visibility: TrekVisibility },
  viewerId: string | null | undefined
): boolean {
  return trek.visibility === "public" || trek.userId === viewerId;
}

export function computeTrekTotals(days: DayStats[]): DayStats {
  const totals: DayStats = {};
  for (const day of days) {
    if (day.distanceMeters !== undefined) {
      totals.distanceMeters = (totals.distanceMeters ?? 0) + day.distanceMeters;
    }
    if (day.durationMinutes !== undefined) {
      totals.durationMinutes =
        (totals.durationMinutes ?? 0) + day.durationMinutes;
    }
    if (day.elevationGainMeters !== undefined) {
      totals.elevationGainMeters =
        (totals.elevationGainMeters ?? 0) + day.elevationGainMeters;
    }
    if (day.maxElevationMeters !== undefined) {
      totals.maxElevationMeters = Math.max(
        totals.maxElevationMeters ?? -Infinity,
        day.maxElevationMeters
      );
    }
  }
  return totals;
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

export function nextDayDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function requireText(label: string, value: string, max: number) {
  if (value.trim().length === 0) throw new Error(`${label} is required`);
  if (value.length > max) throw new Error(`${label} is too long`);
}

function requireWholeNumber(label: string, value: number, min: number, max: number) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${label} must be a whole number from ${min} to ${max}`);
  }
}

export function validateTrekFields(fields: {
  name: string;
  placeName: string;
  lat: number;
  lng: number;
  startDate: string;
}) {
  requireText("Name", fields.name, TREK_LIMITS.nameMax);
  requireText("Place", fields.placeName, TREK_LIMITS.placeNameMax);
  if (!Number.isFinite(fields.lat) || fields.lat < -90 || fields.lat > 90) {
    throw new Error("Latitude must be between -90 and 90");
  }
  if (!Number.isFinite(fields.lng) || fields.lng < -180 || fields.lng > 180) {
    throw new Error("Longitude must be between -180 and 180");
  }
  if (!isIsoDate(fields.startDate)) throw new Error("Invalid date");
}

// Returns the list with names trimmed. Whether a linked user exists is checked by the caller.
export function validateCompanions<T extends TrekCompanion>(
  companions: T[],
  ownerId: string
): T[] {
  if (companions.length > TREK_LIMITS.companionsMax) {
    throw new Error(`At most ${TREK_LIMITS.companionsMax} companions`);
  }
  const seen = new Set<string>();
  const addOnce = (key: string) => {
    if (seen.has(key)) throw new Error("Companion already added");
    seen.add(key);
  };
  return companions.map((companion) => {
    if (companion.kind === "name") {
      const name = companion.name.trim();
      requireText("Companion name", name, TREK_LIMITS.companionNameMax);
      addOnce(`name:${name.toLowerCase()}`);
      return { ...companion, name };
    }
    if (companion.userId === ownerId) {
      throw new Error("You cannot add yourself as a companion");
    }
    addOnce(`user:${companion.userId}`);
    return companion;
  });
}

// A null value means "clear this field", so there is nothing to check.
export function validateDayFields(fields: {
  date?: string;
  notes?: string | null;
  placeNote?: string | null;
  weather?: string | null;
  distanceMeters?: number | null;
  durationMinutes?: number | null;
  elevationGainMeters?: number | null;
  maxElevationMeters?: number | null;
  images?: string[];
}) {
  if (fields.date !== undefined && !isIsoDate(fields.date)) {
    throw new Error("Invalid date");
  }
  if (fields.notes && fields.notes.length > TREK_LIMITS.notesMax) {
    throw new Error("Notes are too long");
  }
  if (fields.placeNote && fields.placeNote.length > TREK_LIMITS.shortTextMax) {
    throw new Error("Place note is too long");
  }
  if (fields.weather && fields.weather.length > TREK_LIMITS.shortTextMax) {
    throw new Error("Weather is too long");
  }
  if (fields.distanceMeters != null) {
    requireWholeNumber("Distance", fields.distanceMeters, 0, TREK_LIMITS.distanceMetersMax);
  }
  if (fields.durationMinutes != null) {
    requireWholeNumber("Duration", fields.durationMinutes, 0, TREK_LIMITS.durationMinutesMax);
  }
  if (fields.elevationGainMeters != null) {
    requireWholeNumber(
      "Elevation gain",
      fields.elevationGainMeters,
      0,
      TREK_LIMITS.elevationGainMetersMax
    );
  }
  if (fields.maxElevationMeters != null) {
    requireWholeNumber(
      "Max elevation",
      fields.maxElevationMeters,
      TREK_LIMITS.maxElevationMetersMin,
      TREK_LIMITS.maxElevationMetersMax
    );
  }
  if (fields.images && fields.images.length > TREK_LIMITS.imagesMax) {
    throw new Error(`At most ${TREK_LIMITS.imagesMax} photos per day`);
  }
}
