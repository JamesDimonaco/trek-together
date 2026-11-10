import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// The one loading indicator. Announced to screen readers via role="status".
export default function LoadingState({ label = "Loading", className }: { label?: string; className?: string }) {
  return (
    <div role="status" className={cn("flex items-center justify-center gap-2 py-12 text-gray-600 dark:text-gray-300", className)}>
      <Loader2 className="h-6 w-6 animate-spin text-primary dark:text-green-400" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
