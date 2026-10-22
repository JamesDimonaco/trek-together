import Link from "next/link";
import { ArrowRight, Mountain } from "lucide-react";
import { Button } from "@/components/ui/button";
import RecentTreks from "./RecentTreks";

export default function GuestLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto max-w-2xl px-4 py-12 sm:py-20">
        <section className="space-y-6 text-center">
          <Mountain className="mx-auto h-12 w-12 text-green-600 dark:text-green-400" />
          <h1 className="text-4xl font-extrabold leading-tight text-gray-900 dark:text-white sm:text-5xl">
            Log your treks
          </h1>
          <p className="mx-auto max-w-xl text-lg text-gray-600 dark:text-gray-400">
            Keep a record of every trek you walk: days, distance, notes and photos.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-green-600 px-8 hover:bg-green-700">
              <Link href="/sign-up">
                Sign up
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="px-8">
              <Link href="/treks">Browse public treks</Link>
            </Button>
          </div>
        </section>

        <RecentTreks />

        <p className="mt-16 text-center text-sm text-gray-500 dark:text-gray-400">
          Looking for trekking buddies?{" "}
          <Link href="/cities" className="text-green-600 hover:underline dark:text-green-400">
            Browse city chats
          </Link>
        </p>
      </div>
    </div>
  );
}
