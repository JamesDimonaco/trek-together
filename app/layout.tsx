import { type Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import AuthHeader from "@/components/layout/AuthHeader";
import AuthSync from "@/components/auth/AuthSync";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://trektogether.app"
  ),
  title: {
    default: "TrekTogether - Find Hiking & Trekking Buddies in Your City",
    template: "%s | TrekTogether",
  },
  description:
    "Connect with fellow trekkers and hikers worldwide. Join city-based chats, find adventure buddies, and explore the outdoors together. Real-time communities for travelers and outdoor enthusiasts.",
  keywords: [
    "trekking",
    "hiking",
    "travel buddies",
    "outdoor adventures",
    "backpacking",
    "hiking community",
    "trekking community",
    "adventure travel",
    "hiking partners",
    "trail buddies",
  ],
  authors: [{ name: "TrekTogether" }],
  creator: "TrekTogether",
  publisher: "TrekTogether",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "TrekTogether",
    title: "TrekTogether - Find Hiking & Trekking Buddies in Your City",
    description:
      "Connect with fellow trekkers and hikers worldwide. Join city-based chats, find adventure buddies, and explore the outdoors together.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TrekTogether - Connect with trekkers worldwide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TrekTogether - Find Hiking & Trekking Buddies in Your City",
    description:
      "Connect with fellow trekkers and hikers worldwide. Join city-based chats and explore the outdoors together.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add these when you set up search console
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#059669", // green-600
        },
        elements: {
          formButtonPrimary: "bg-green-600 hover:bg-green-700",
          card: "shadow-lg",
        },
      }}
    >
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ConvexClientProvider>
            <AuthHeader />
            <AuthSync />
            {children}
            <Analytics />
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
