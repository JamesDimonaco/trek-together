import { Metadata } from "next";
import ProfileEditForm from "@/components/profile/ProfileEditForm";

export const metadata: Metadata = {
  title: "Edit Profile | TrekTogether",
  description: "Edit your TrekTogether profile",
};

export default function ProfileEditPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ProfileEditForm />
    </div>
  );
}
