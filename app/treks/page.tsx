import { Metadata } from "next";
import { BASE_URL } from "@/lib/convex-server";
import TrekBrowser from "@/components/treks/TrekBrowser";

export const metadata: Metadata = {
  title: "Trek logs | TrekTogether",
  description:
    "Browse treks logged by TrekTogether members: routes, daily stats, notes and photos from trails around the world.",
  alternates: { canonical: `${BASE_URL}/treks` },
  openGraph: {
    title: "Trek logs | TrekTogether",
    description: "Browse treks logged by TrekTogether members.",
    url: `${BASE_URL}/treks`,
    siteName: "TrekTogether",
  },
};

export default function TreksPage() {
  return <TrekBrowser />;
}
