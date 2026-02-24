export const activityColors: Record<string, string> = {
  trekking:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  hiking:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  climbing:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  camping:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  other:
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export function formatDateRange(from: string, to?: string) {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  const fromDate = new Date(from + "T00:00:00");
  if (!to) return fromDate.toLocaleDateString("en-US", options);
  const toDate = new Date(to + "T00:00:00");
  return `${fromDate.toLocaleDateString("en-US", options)} \u2013 ${toDate.toLocaleDateString("en-US", options)}`;
}
