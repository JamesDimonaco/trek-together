import { Metadata } from "next";
import SettingsClient from "@/components/settings/SettingsClient";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account settings and preferences",
};

export default function SettingsPage() {
  return <SettingsClient />;
}
