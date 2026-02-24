import { cache } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { getCityData } from "../../actions/city";
import { getRequestData } from "./actions/request";
import { getServerSession } from "@/lib/server-session";
import { BASE_URL, safeJsonLd, truncateAtWord } from "@/lib/convex-server";
import RequestPageContent from "@/components/requests/RequestPageContent";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface RequestPageProps {
  params: Promise<{ cityId: string; requestId: string }>;
}

// React.cache deduplicates getCityData across generateMetadata + page render
const getCachedCityData = cache(getCityData);

export async function generateMetadata({
  params,
}: RequestPageProps): Promise<Metadata> {
  const { cityId, requestId } = await params;

  try {
    const [city, request] = await Promise.all([
      getCachedCityData(cityId),
      getRequestData(requestId, cityId),
    ]);

    const title = `${request.title} - ${request.activityType} in ${city.name} | TrekTogether`;
    const dateRange = request.dateTo
      ? `${request.dateFrom} to ${request.dateTo}`
      : request.dateFrom;
    const description = `Looking for ${request.activityType} buddies in ${city.name}: ${truncateAtWord(request.description, 120)}. Dates: ${dateRange}.`;
    const canonicalUrl = `${BASE_URL}/chat/${cityId}/requests/${requestId}`;

    const metadata: Metadata = {
      title,
      description,
      keywords: [
        `find ${request.activityType} buddy ${city.name}`,
        `${request.activityType} partner ${city.name}`,
        `join ${request.activityType} ${city.name}`,
        `${city.name} ${request.activityType} group`,
      ],
      openGraph: {
        title,
        description,
        type: "website",
        url: canonicalUrl,
        siteName: "TrekTogether",
        images: [
          {
            url: "/og-image.png",
            width: 1200,
            height: 630,
            alt: `${request.activityType} request in ${city.name}`,
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
        canonical: canonicalUrl,
      },
    };

    // noindex closed requests to keep stale content out of search
    if (request.status === "closed") {
      metadata.robots = { index: false };
    }

    return metadata;
  } catch {
    return {
      title: "Request | TrekTogether",
      description: "Find trekking and hiking buddies on TrekTogether.",
    };
  }
}

export default async function RequestPage({ params }: RequestPageProps) {
  const { cityId, requestId } = await params;

  const [city, request, session] = await Promise.all([
    getCachedCityData(cityId),
    getRequestData(requestId, cityId),
    getServerSession(),
  ]);

  // JSON-LD structured data (Event schema)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: request.title,
    description: truncateAtWord(request.description, 300),
    startDate: request.dateFrom,
    endDate: request.dateTo || request.dateFrom,
    eventStatus: request.status === "open"
      ? "https://schema.org/EventScheduled"
      : "https://schema.org/EventCancelled",
    location: {
      "@type": "Place",
      name: city.name,
      address: {
        "@type": "PostalAddress",
        addressLocality: city.name,
        addressCountry: city.country,
      },
    },
    organizer: request.author
      ? {
          "@type": "Person",
          name: request.author.username,
        }
      : undefined,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="w-full max-w-3xl mx-auto flex flex-col flex-1">
        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />

        {/* Breadcrumb */}
        <Breadcrumb className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/cities">Cities</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/chat/${cityId}`}>{city.name}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="truncate max-w-[200px]">
                {request.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Content */}
        <div className="p-4">
          <RequestPageContent
            requestId={requestId}
            cityId={cityId}
            session={session}
          />
        </div>
      </div>
    </div>
  );
}
