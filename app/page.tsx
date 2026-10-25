import { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { BASE_URL } from "@/lib/convex-server";
import MyTreks from "@/components/treks/MyTreks";
import GuestLanding from "@/components/landing/GuestLanding";

const description =
  "Keep a logbook of every trek you walk: days, distance, notes and photos. Share treks publicly or keep them private.";

export const metadata: Metadata = {
  title: { absolute: "TrekTogether - Log your treks" },
  description,
  alternates: { canonical: `${BASE_URL}/` },
  openGraph: {
    title: "TrekTogether - Log your treks",
    description,
    url: `${BASE_URL}/`,
    siteName: "TrekTogether",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "TrekTogether trek log" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TrekTogether - Log your treks",
    description,
    images: ["/og-image.png"],
  },
};

export default async function Home() {
  const { userId } = await auth();
  if (userId) return <MyTreks />;

  return <GuestLanding />;
}
