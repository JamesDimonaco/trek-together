import { Metadata } from "next";
import { notFound } from "next/navigation";
import ProfileView from "@/components/profile/ProfileView";

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { userId } = await params;

  return {
    title: "User Profile",
    description: "View user profile on TrekTogether",
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = await params;

  // Validate userId format (Convex ID)
  if (!userId || !/^[0-9a-z]{28,34}$/i.test(userId)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ProfileView userId={userId} />
    </div>
  );
}
