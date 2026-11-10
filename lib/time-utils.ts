import { format, isSameDay, isSameYear } from "date-fns";

export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return format(timestamp, isSameYear(timestamp, Date.now()) ? "d MMM" : "d MMM yyyy");
}

// Time alone for today; older messages carry the day (and year) so the thread reads in order.
export function formatMessageTime(timestamp: number, now: number = Date.now()): string {
  if (isSameDay(timestamp, now)) return format(timestamp, "HH:mm");
  if (isSameYear(timestamp, now)) return format(timestamp, "d MMM, HH:mm");
  return format(timestamp, "d MMM yyyy, HH:mm");
}
