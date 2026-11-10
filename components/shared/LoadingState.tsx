import { Loader2 } from "lucide-react";

// The one loading indicator. Announced to screen readers via role="status".
export default function LoadingState({ label = "Loading", className = "py-12" }: { label?: string; className?: string }) {
  return (
    <div role="status" className={`flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300 ${className}`}>
      <Loader2 className="h-6 w-6 animate-spin text-green-700 dark:text-green-400" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
