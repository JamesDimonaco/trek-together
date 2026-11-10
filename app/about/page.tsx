import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Mountain, Heart, Users } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "About TrekTogether",
  description: "The story behind TrekTogether - connecting solo trekkers around the world",
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white">
            <Mountain className="h-8 w-8 text-green-700" aria-hidden="true" />
            About TrekTogether
          </h1>
        </CardHeader>
        <CardContent className="prose prose-sm sm:prose dark:prose-invert max-w-none prose-h2:mt-0 prose-h2:mb-3 prose-h2:text-lg prose-h2:font-semibold">
          <section className="mb-8">
            <h2 className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-green-700" aria-hidden="true" />
              The story
            </h2>
            <p className="text-base leading-relaxed mb-4">
              Hey! I&apos;m James, a developer currently traveling around South America with my girlfriend.
              We&apos;re working part-time while exploring this incredible continent, and we&apos;ve really
              fallen in love with trekking here.
            </p>
            <p className="text-base leading-relaxed mb-4">
              After doing many treks by ourselves—notably the Salkantay trek to Machu Picchu—we noticed
              something: there isn&apos;t an easy way to meet other people who want to trek solo without
              a guide and create a group themselves.
            </p>
            <p className="text-base leading-relaxed mb-4">
              It was hard. We did meet people, but we found there wasn&apos;t a convenient way to do it.
              Hostel World group chats were somewhat helpful, but we even made fake bookings just to join
              the chats! This was especially challenging in low season, though I think it would be useful
              in high season too.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-700" aria-hidden="true" />
              The solution
            </h2>
            <p className="text-base leading-relaxed mb-4">
              So I started building a little trekking chat app. That&apos;s why TrekTogether is here today.
            </p>
            <p className="text-base leading-relaxed mb-4">
              The idea is simple: city-based chat rooms where travelers can connect, plan treks together,
              share tips, and meet like-minded people who want to explore the outdoors—whether you&apos;re
              in the high season rush or the quiet low season.
            </p>
            <p className="text-base leading-relaxed">
              I hope it can be useful not only for us but for others trying to meet like-minded people
              for trekking. No fake bookings required. Just real connections with real trekkers.
            </p>
          </section>

          <section className="mb-6">
            <h2>Built by one person</h2>
            <p className="text-base leading-relaxed mb-4">
              TrekTogether is a solo project—just me, my laptop, and countless hours in hostels and
              cafes across South America. It&apos;s built with modern web technologies and designed to
              be fast, simple, and actually useful.
            </p>
            <p className="text-base leading-relaxed">
              If you have feedback, find bugs, or just want to say hi, please reach out at{" "}
              <a href="mailto:dimonaco.james@gmail.com" className="text-green-700 hover:underline">
                dimonaco.james@gmail.com
              </a>
              . I&apos;d love to hear from you!
            </p>
          </section>

          <section className="bg-green-50 dark:bg-green-950 p-4 rounded-lg [&>p]:mt-0">
            <h2>Ready to trek?</h2>
            <p className="mb-4">
              Find your city, join the chat, and start connecting with fellow trekkers today.
            </p>
            <div className="not-prose">
              <Button asChild size="lg">
                <Link href="/cities">
                  <Mountain className="h-5 w-5" aria-hidden="true" />
                  Find your city
                </Link>
              </Button>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
