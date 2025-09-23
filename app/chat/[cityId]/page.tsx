import { Id } from "@/convex/_generated/dataModel";
import { getCityData } from "./actions/city";
import ChatHeaderServer from "@/components/chat/ChatHeaderServer";
import ChatClient from "@/components/chat/ChatClient";

interface ChatPageProps {
  params: Promise<{ cityId: string }>;
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
