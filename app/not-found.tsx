import Link from "next/link";
import { Mountain } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <Mountain className="h-16 w-16 text-green-700 dark:text-green-400 mx-auto" aria-hidden="true" />
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Page not found
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            The link may be old, or the page may have moved.
          </p>
        </div>

        <Button asChild>
          <Link href="/">
            Go to the home page
          </Link>
        </Button>
      </div>
    </div>
  );
}