import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// The one empty state: icon, short title, one line of help, and the next step.
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  // Inside a card, pass a smaller padding: the card already pads.
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-4 py-12 text-center", className)}>
      <Icon className="mb-4 h-10 w-10 text-gray-500" aria-hidden="true" />
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
      {description && <p className="mt-1 max-w-sm text-gray-600 dark:text-gray-300">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
