export const typeLabels = {
  trail_report: "Trail Report",
  recommendation: "Recommendation",
  general: "General",
} as const;

export const typeColors = {
  trail_report: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  recommendation: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  general: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
} as const;

export const difficultyColors = {
  easy: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  moderate: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  hard: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  expert: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
} as const;

export function formatPostDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function isHtmlContent(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content);
}

export function stripHtml(html: string): string {
  const text = html.replace(/<[^>]*>/g, "");
  if (typeof document !== "undefined") {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value.trim();
  }
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}
