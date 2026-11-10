import { format, parseISO } from "date-fns";

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  return `${Math.round(meters / 100) / 10} km`;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

export function formatElevation(meters: number): string {
  return `${String(meters).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} m`;
}

export function formatTrekDate(isoDate: string): string {
  return format(parseISO(isoDate), "d MMM yyyy");
}

export function summarizeStats(stats: {
  distanceMeters?: number;
  durationMinutes?: number;
  elevationGainMeters?: number;
  maxElevationMeters?: number;
}): string[] {
  return [
    stats.distanceMeters !== undefined && formatDistance(stats.distanceMeters),
    stats.durationMinutes !== undefined && formatDuration(stats.durationMinutes),
    stats.elevationGainMeters !== undefined &&
      `${formatElevation(stats.elevationGainMeters)} gain`,
    stats.maxElevationMeters !== undefined &&
      `max ${formatElevation(stats.maxElevationMeters)}`,
  ].filter((part): part is string => part !== false);
}

export function kmToMeters(km: string): number | null {
  if (km.trim() === "") return null;
  return Math.round(Number(km) * 1000);
}

export function hoursMinutesToMinutes(hours: string, minutes: string): number | null {
  if (hours.trim() === "" && minutes.trim() === "") return null;
  return Math.round(Number(hours || 0) * 60 + Number(minutes || 0));
}

export type NewTrekField = "place" | "placeName" | "name" | "startDate";

// Field-level errors for the new trek form, so each message sits under its own input.
export function newTrekFormErrors(fields: {
  hasPin: boolean;
  placeName: string;
  name: string;
  startDate: string;
}): Partial<Record<NewTrekField, string>> {
  const errors: Partial<Record<NewTrekField, string>> = {};
  if (!fields.hasPin) errors.place = "Search for a place, or drop a pin on the map.";
  if (!fields.placeName.trim()) errors.placeName = "Give this place a name.";
  if (!fields.name.trim()) errors.name = "Give your trek a name.";
  if (!fields.startDate) errors.startDate = "Pick the date you started.";
  return errors;
}
