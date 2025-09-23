import Link from "next/link";
import { Mountain } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <Mountain className="h-16 w-16 text-green-600 dark:text-green-400 mx-auto" />
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            404
          </h1>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            Trail Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            The page you're looking for doesn't exist or the city chat is no longer available.
          </p>
        </div>

        <Button asChild className="bg-green-600 hover:bg-green-700">
          <Link href="/">
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}