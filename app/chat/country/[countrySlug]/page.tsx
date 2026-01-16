import { Id } from "@/convex/_generated/dataModel";
import { getCountryData } from "./actions/country";
import CountryChatHeader from "@/components/chat/CountryChatHeader";
import CountryChatClient from "@/components/chat/CountryChatClient";
import { Metadata } from "next";

interface CountryChatPageProps {
  params: Promise<{ countrySlug: string }>;
}

export async function generateMetadata({
  params,
}: CountryChatPageProps): Promise<Metadata> {
  const { countrySlug } = await params;

  try {
    const country = await getCountryData(countrySlug);

    const title = `${country.name} Trekking Community | TrekTogether`;
    const description = `Connect with trekkers across ${country.name}. Join the country-wide chat, coordinate adventures, and find hiking buddies. Real-time community for travelers exploring ${country.name}.`;

    return {
      title,
      description,
      keywords: [
        `trekking in ${country.name}`,
        `hiking ${country.name}`,
        `${country.name} hiking community`,
        `${country.name} trekking buddies`,
        `backpacking ${country.name}`,
        `outdoor adventures ${country.name}`,
      ],
      openGraph: {
        title,
        description,
        type: "website",
        url: `https://trektogether.com/chat/country/${countrySlug}`,
        siteName: "TrekTogether",
        images: [
          {
            url: "/og-image.png",
            width: 1200,
            height: 630,
            alt: `${country.name} Trekking Community`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: ["/og-image.png"],
      },
      alternates: {
        canonical: `https://trektogether.com/chat/country/${countrySlug}`,
      },
    };
  } catch (error) {
    // Fallback metadata if country fetch fails
    return {
      title: "Country Chat | TrekTogether",
      description: "Connect with trekkers and hikers around the world.",
    };
  }
}

export default async function CountryChatPage({ params }: CountryChatPageProps) {
  const { countrySlug } = await params;

  // Fetch country data on server - will trigger notFound() if country doesn't exist
  const country = await getCountryData(countrySlug);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="w-full max-w-3xl mx-auto flex flex-col flex-1">
        <CountryChatHeader country={country} />
        <CountryChatClient
          countryId={country._id as Id<"countries">}
          countryName={country.name}
          countrySlug={country.slug}
        />
      </div>
    </div>
  );
}
