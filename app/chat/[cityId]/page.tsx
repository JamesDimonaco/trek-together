import { Id } from "@/convex/_generated/dataModel";
import { getCityData } from "./actions/city";
import ChatHeaderServer from "@/components/chat/ChatHeaderServer";
import ChatClient from "@/components/chat/ChatClient";
import { Metadata } from "next";

interface ChatPageProps {
  params: Promise<{ cityId: string }>;
}

export async function generateMetadata({
  params,
}: ChatPageProps): Promise<Metadata> {
  const { cityId } = await params;

  try {
    const city = await getCityData(cityId);

    const title = `${city.name} Trekking & Hiking Community | TrekTogether`;
    const description = `Connect with trekkers in ${city.name}, ${city.country}. Join the chat, find hiking buddies, and explore outdoor adventures together. Real-time community for travelers and outdoor enthusiasts.`;

    return {
      title,
      description,
      keywords: [
        `trekking in ${city.name}`,
        `hiking in ${city.name}`,
        `${city.name} hiking buddies`,
        `${city.name} trekking community`,
        `outdoor adventures ${city.name}`,
        `travel buddies ${city.country}`,
      ],
      openGraph: {
        title,
        description,
        type: "website",
        url: `https://trektogether.com/chat/${cityId}`,
        siteName: "TrekTogether",
        images: [
          {
            url: "/og-image.png",
            width: 1200,
            height: 630,
            alt: `${city.name} Trekking Community`,
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
        canonical: `https://trektogether.com/chat/${cityId}`,
      },
    };
  } catch (error) {
    // Fallback metadata if city fetch fails
    return {
      title: "City Chat | TrekTogether",
      description: "Connect with trekkers and hikers around the world.",
    };
  }
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { cityId } = await params;

  // Fetch city data on server - will trigger notFound() if city doesn't exist
  const city = await getCityData(cityId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <ChatHeaderServer city={city} />
      <ChatClient cityId={cityId as Id<"cities">} cityName={city.name} />
    </div>
  );
}
