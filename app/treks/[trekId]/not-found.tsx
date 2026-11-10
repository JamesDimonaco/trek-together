import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

// Private treks and bad ids look the same from outside, so say both and offer both ways on.
export default function TrekNotFound() {
  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <Lock className="h-12 w-12 text-gray-500" aria-hidden="true" />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">This trek is private or doesn&apos;t exist</h1>
      <p className="text-gray-600 dark:text-gray-300">
        If it&apos;s your trek, open it from your logbook.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild>
          <Link href="/my-treks">Open my logbook</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/treks">Browse public treks</Link>
        </Button>
      </div>
    </div>
  );
}
