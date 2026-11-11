import { formatDayDivider } from "@/lib/time-utils";

export default function DayDivider({ timestamp }: { timestamp: number }) {
  return (
    <div className="flex items-center gap-3 py-1 text-sm text-gray-600 dark:text-gray-300">
      <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
      <span>{formatDayDivider(timestamp)}</span>
      <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
    </div>
  );
}
