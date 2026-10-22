import { cache } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { BASE_URL, convex, safeJsonLd, truncateAtWord } from "@/lib/convex-server";
import { formatTrekDate, summarizeStats } from "@/lib/trek-utils";
import TrekView from "@/components/treks/TrekView";

export const revalidate = 3600;

interface TrekPageProps {
  params: Promise<{ trekId: string }>;
}

// Prerender known public treks; unknown ids still render on demand (dynamicParams default).
export async function generateStaticParams() {
  try {
    const treks = await convex.query(api.treks.getPublicTrekIds);
    return treks.map((trek) => ({ trekId: trek._id }));
  } catch (error) {
    console.error("Could not list public treks at build time:", error);
    return [];
  }
}

const getPublicTrek = cache(async (trekId: string) => {
  if (!/^[0-9a-z]{28,34}$/i.test(trekId)) return null;
  return await convex.query(api.treks.getTrek, { trekId: trekId as Id<"treks"> });
});

export async function generateMetadata({ params }: TrekPageProps): Promise<Metadata> {
  const { trekId } = await params;
  const trek = await getPublicTrek(trekId);
  if (!trek) return { title: "Trek not found | TrekTogether", robots: { index: false } };

  const title = `${trek.name} - trek in ${trek.placeName} | TrekTogether`;
  const stats = summarizeStats(trek.totals);
  const firstNotes = trek.days.find((day) => day.notes)?.notes;
  const description = truncateAtWord(
    [
      `${trek.owner?.username ?? "A trekker"} trekked ${trek.placeName} on ${formatTrekDate(trek.startDate)}.`,
      stats.length > 0 && `${stats.join(", ")}.`,
      firstNotes,
    ]
      .filter(Boolean)
      .join(" "),
    160
  );
  const canonicalUrl = `${BASE_URL}/treks/${trekId}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: canonicalUrl,
      siteName: "TrekTogether",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: trek.name }],
    },
    twitter: { card: "summary_large_image", title, description, images: ["/og-image.png"] },
    alternates: { canonical: canonicalUrl },
  };
}

export default async function TrekPage({ params }: TrekPageProps) {
  const { trekId } = await params;
  const trek = await getPublicTrek(trekId);
  if (!trek) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: trek.placeName,
    description: truncateAtWord(trek.days.find((day) => day.notes)?.notes ?? trek.name, 300),
    geo: { "@type": "GeoCoordinates", latitude: trek.lat, longitude: trek.lng },
    url: `${BASE_URL}/treks/${trekId}`,
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <TrekView trek={trek} />
    </div>
  );
}
