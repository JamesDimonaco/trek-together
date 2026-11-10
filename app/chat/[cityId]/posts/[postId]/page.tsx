import { cache } from "react";
import { Metadata } from "next";
import { getCityData } from "../../actions/city";
import { getPostData } from "./actions/post";
import { getServerSession } from "@/lib/server-session";
import { BASE_URL, safeJsonLd, truncateAtWord } from "@/lib/convex-server";
import PostPageContent from "@/components/posts/PostPageContent";
import BackLink from "@/components/layout/BackLink";

interface PostPageProps {
  params: Promise<{ cityId: string; postId: string }>;
}

// React.cache deduplicates getCityData across generateMetadata + page render
const getCachedCityData = cache(getCityData);

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { cityId, postId } = await params;

  try {
    const [city, post] = await Promise.all([
      getCachedCityData(cityId),
      getPostData(postId, cityId),
    ]);

    const title = `${post.title} | ${city.name} | TrekTogether`;
    const description = truncateAtWord(post.content, 160);
    const ogImage = post.imageUrls?.[0] || "/og-image.png";
    const canonicalUrl = `${BASE_URL}/chat/${cityId}/posts/${postId}`;

    const keywordsByType: Record<string, string[]> = {
      trail_report: [
        `trail report ${city.name}`,
        `${city.name} trail conditions`,
        `${post.difficulty || ""} hike ${city.name}`.trim(),
        `hiking ${city.name}`,
      ],
      recommendation: [
        `best hikes ${city.name}`,
        `where to hike ${city.name}`,
        `${city.name} hiking guide`,
        `${city.name} outdoor tips`,
      ],
      general: [
        `trekking ${city.name}`,
        `${city.name} outdoor community`,
        `hiking ${city.name}`,
      ],
    };

    return {
      title,
      description,
      keywords: keywordsByType[post.type] || keywordsByType.general,
      openGraph: {
        title,
        description,
        type: "article",
        url: canonicalUrl,
        siteName: "TrekTogether",
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImage],
      },
      alternates: {
        canonical: canonicalUrl,
      },
    };
  } catch {
    return {
      title: "Post | TrekTogether",
      description: "Read trail reports, recommendations, and community posts on TrekTogether.",
    };
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { cityId, postId } = await params;

  const [city, post, session] = await Promise.all([
    getCachedCityData(cityId),
    getPostData(postId, cityId),
    getServerSession(),
  ]);

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    author: post.author
      ? {
          "@type": "Person",
          name: post.author.username,
        }
      : undefined,
    datePublished: new Date(post._creationTime).toISOString(),
    description: truncateAtWord(post.content, 160),
    image: post.imageUrls?.[0] || "/og-image.png",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BASE_URL}/chat/${cityId}/posts/${postId}`,
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="w-full max-w-3xl mx-auto flex flex-col flex-1">
        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />

        <div className="px-4 pt-3">
          <BackLink href={`/chat/${cityId}`} label={city.name} />
        </div>

        {/* Content */}
        <div className="p-4">
          <PostPageContent postId={postId} cityId={cityId} session={session} />
        </div>
      </div>
    </div>
  );
}
