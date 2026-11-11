import { format, isSameDay, isSameYear, subDays } from "date-fns";

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

// Chat shows one divider per day; bubbles then only need the time.
export function formatDayDivider(timestamp: number, now: number = Date.now()): string {
  if (isSameDay(timestamp, now)) return "Today";
  if (isSameDay(timestamp, subDays(now, 1))) return "Yesterday";
  if (isSameYear(timestamp, now)) return format(timestamp, "EEE d MMM");
  return format(timestamp, "d MMM yyyy");
}

export function startsNewDay(previous: number | undefined, current: number): boolean {
  return previous === undefined || !isSameDay(previous, current);
}

// Inbox rows: time for today, then Yesterday, then the date.
export function formatConversationTime(timestamp: number, now: number = Date.now()): string {
  if (isSameDay(timestamp, now)) return format(timestamp, "HH:mm");
  if (isSameDay(timestamp, subDays(now, 1))) return "Yesterday";
  return format(timestamp, isSameYear(timestamp, now) ? "d MMM" : "d MMM yyyy");
}
