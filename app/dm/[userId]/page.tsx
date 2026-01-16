import { Metadata } from "next";
import { notFound } from "next/navigation";
import DMChat from "@/components/dm/DMChat";

interface DMPageProps {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({
  params,
}: DMPageProps): Promise<Metadata> {
  return {
    title: "Direct Message | TrekTogether",
    description: "Send a direct message on TrekTogether",
  };
}

export default async function DMPage({ params }: DMPageProps) {
  const { userId } = await params;

  // Validate userId format (Convex ID)
  if (!userId || !/^[0-9a-z]{28,34}$/i.test(userId)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="w-full max-w-3xl mx-auto flex flex-col flex-1">
        <DMChat receiverId={userId} />
      </div>
    </div>
  );
}
