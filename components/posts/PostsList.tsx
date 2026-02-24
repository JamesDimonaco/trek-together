"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SessionData } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PostCard from "./PostCard";
import PostDetail from "./PostDetail";
import CreatePostForm from "./CreatePostForm";
import AuthPromptModal from "@/components/dm/AuthPromptModal";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { analytics } from "@/lib/analytics";

interface PostsListProps {
  cityId: Id<"cities">;
  session: SessionData;
}

type PostType = "trail_report" | "recommendation" | "general";

export default function PostsList({ cityId, session }: PostsListProps) {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedPostId, setSelectedPostId] = useState<Id<"posts"> | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const hasValidConvexUserId = session.isAuthenticated && session.userId;

  const posts = useQuery(api.posts.getPostsByCity, {
    cityId,
    currentUserId: hasValidConvexUserId
      ? (session.userId as Id<"users">)
      : undefined,
    typeFilter: typeFilter !== "all" ? (typeFilter as PostType) : undefined,
  });

  const likePost = useMutation(api.posts.likePost);

  const handleLike = async (postId: Id<"posts">) => {
    if (!hasValidConvexUserId) {
      setShowAuthPrompt(true);
      return;
    }
    try {
      const result = await likePost({ userId: session.userId as Id<"users">, postId });
      analytics.postLiked(postId as string, result.liked);
    } catch {
      toast.error("Failed to like post");
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header with filter and create button */}
      <div className="flex items-center justify-between gap-2">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Posts</SelectItem>
            <SelectItem value="trail_report">Trail Reports</SelectItem>
            <SelectItem value="recommendation">Recommendations</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>

        {hasValidConvexUserId && (
          <CreatePostForm cityId={cityId} userId={session.userId as Id<"users">} />
        )}
      </div>

      {/* Posts list */}
      {posts === undefined ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            No posts yet
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Be the first to share a trail report or recommendation!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              cityId={cityId as string}
              onLike={() => handleLike(post._id as Id<"posts">)}
              onClick={() => {
                setSelectedPostId(post._id as Id<"posts">);
                analytics.postViewed(post._id as string);
              }}
              isAuthenticated={!!hasValidConvexUserId}
              onAuthPrompt={() => setShowAuthPrompt(true)}
            />
          ))}
        </div>
      )}

      {/* Post detail dialog */}
      {selectedPostId && (
        <PostDetail
          postId={selectedPostId}
          cityId={cityId as string}
          currentUserId={
            hasValidConvexUserId ? (session.userId as Id<"users">) : undefined
          }
          isAuthenticated={!!hasValidConvexUserId}
          open={!!selectedPostId}
          onClose={() => setSelectedPostId(null)}
          onAuthPrompt={() => setShowAuthPrompt(true)}
        />
      )}

      {/* Auth prompt */}
      <AuthPromptModal
        isOpen={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
      />
    </div>
  );
}
