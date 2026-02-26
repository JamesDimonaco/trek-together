import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Helper: get blocked user IDs (bidirectional)
async function getBlockedUserIds(
  ctx: { db: any },
  userId: Id<"users">
): Promise<Set<string>> {
  const blockedByMe = await ctx.db
    .query("blocked_users")
    .withIndex("by_blocker", (q: any) => q.eq("blockerId", userId))
    .collect();
  const blockedMe = await ctx.db
    .query("blocked_users")
    .withIndex("by_blocked", (q: any) => q.eq("blockedId", userId))
    .collect();
  return new Set([
    ...blockedByMe.map((b: any) => b.blockedId),
    ...blockedMe.map((b: any) => b.blockerId),
  ]);
}

// Helper: verify caller identity and return their user record
async function authenticateCaller(ctx: { auth: any; db: any }, userId: Id<"users">) {
  const user = await ctx.db.get(userId);
  if (!user || !user.authId) {
    throw new Error("Authentication required");
  }
  return user;
}

// Get posts for a city with author info, like/comment counts, and hasLiked
export const getPostsByCity = query({
  args: {
    cityId: v.id("cities"),
    currentUserId: v.optional(v.id("users")),
    typeFilter: v.optional(
      v.union(
        v.literal("trail_report"),
        v.literal("recommendation"),
        v.literal("general")
      )
    ),
  },
  handler: async (ctx, args) => {
    let posts;
    if (args.typeFilter) {
      posts = await ctx.db
        .query("posts")
        .withIndex("by_city_type", (q) =>
          q.eq("cityId", args.cityId).eq("type", args.typeFilter!)
        )
        .order("desc")
        .take(50);
    } else {
      posts = await ctx.db
        .query("posts")
        .withIndex("by_city", (q) => q.eq("cityId", args.cityId))
        .order("desc")
        .take(50);
    }

    // Get blocked user IDs (bidirectional) if authenticated
    let blockedUserIds = new Set<string>();
    if (args.currentUserId) {
      blockedUserIds = await getBlockedUserIds(ctx, args.currentUserId);
    }

    // Enrich posts with author info and counts
    const enriched = await Promise.all(
      posts
        .filter((post) => !blockedUserIds.has(post.authorId))
        .map(async (post) => {
          const author = await ctx.db.get(post.authorId);
          const likes = await ctx.db
            .query("post_likes")
            .withIndex("by_post", (q) => q.eq("postId", post._id))
            .collect();
          const comments = await ctx.db
            .query("post_comments")
            .withIndex("by_post", (q) => q.eq("postId", post._id))
            .collect();

          let hasLiked = false;
          if (args.currentUserId) {
            const like = await ctx.db
              .query("post_likes")
              .withIndex("by_user_post", (q) =>
                q.eq("userId", args.currentUserId!).eq("postId", post._id)
              )
              .first();
            hasLiked = !!like;
          }

          return {
            ...post,
            author: author
              ? {
                  _id: author._id,
                  username: author.username,
                  avatarUrl: author.avatarUrl,
                }
              : null,
            likeCount: likes.length,
            commentCount: comments.length,
            hasLiked,
          };
        })
    );

    return enriched;
  },
});

// Get a single post with full details, resolved image URLs, comments, likes
export const getPostById = query({
  args: {
    postId: v.id("posts"),
    currentUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) return null;

    // Block check: hide post if author is blocked (bidirectional)
    if (args.currentUserId) {
      const blockedUserIds = await getBlockedUserIds(ctx, args.currentUserId);
      if (blockedUserIds.has(post.authorId)) return null;
    }

    const author = await ctx.db.get(post.authorId);

    // Resolve image URLs
    const imageUrls = await Promise.all(
      post.images.map(async (storageId) => {
        const url = await ctx.storage.getUrl(storageId);
        return url;
      })
    );

    const likes = await ctx.db
      .query("post_likes")
      .withIndex("by_post", (q) => q.eq("postId", post._id))
      .collect();

    const comments = await ctx.db
      .query("post_comments")
      .withIndex("by_post", (q) => q.eq("postId", post._id))
      .order("asc")
      .collect();

    // Get blocked IDs for filtering comments
    let blockedUserIds = new Set<string>();
    if (args.currentUserId) {
      blockedUserIds = await getBlockedUserIds(ctx, args.currentUserId);
    }

    // Enrich comments with author info, filter blocked users
    const enrichedCommentsRaw = await Promise.all(
      comments.map(async (comment) => {
        if (blockedUserIds.has(comment.authorId)) return null;
        const commentAuthor = await ctx.db.get(comment.authorId);
        return {
          ...comment,
          author: commentAuthor
            ? {
                _id: commentAuthor._id,
                username: commentAuthor.username,
                avatarUrl: commentAuthor.avatarUrl,
              }
            : null,
        };
      })
    );
    const enrichedComments = enrichedCommentsRaw.filter(
      (c): c is NonNullable<typeof c> => c !== null
    );

    let hasLiked = false;
    if (args.currentUserId) {
      const like = await ctx.db
        .query("post_likes")
        .withIndex("by_user_post", (q) =>
          q.eq("userId", args.currentUserId!).eq("postId", post._id)
        )
        .first();
      hasLiked = !!like;
    }

    return {
      ...post,
      author: author
        ? {
            _id: author._id,
            username: author.username,
            avatarUrl: author.avatarUrl,
          }
        : null,
      imageUrls: imageUrls.filter(Boolean) as string[],
      likeCount: likes.length,
      comments: enrichedComments,
      hasLiked,
    };
  },
});

// Create a post (auth required)
export const createPost = mutation({
  args: {
    userId: v.id("users"),
    cityId: v.id("cities"),
    title: v.string(),
    content: v.string(),
    type: v.union(
      v.literal("trail_report"),
      v.literal("recommendation"),
      v.literal("general")
    ),
    images: v.array(v.string()),
    difficulty: v.optional(
      v.union(
        v.literal("easy"),
        v.literal("moderate"),
        v.literal("hard"),
        v.literal("expert")
      )
    ),
    rating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateCaller(ctx, args.userId);

    if (!args.title.trim()) {
      throw new Error("Title is required");
    }
    if (args.title.length > 200) {
      throw new Error("Title must be 200 characters or less");
    }
    if (!args.content.trim()) {
      throw new Error("Content is required");
    }
    if (args.content.length > 10000) {
      throw new Error("Content must be 10000 characters or less");
    }
    if (args.images.length > 5) {
      throw new Error("Maximum 5 images per post");
    }
    if (
      args.rating !== undefined &&
      (args.rating < 1 || args.rating > 5 || Math.floor(args.rating) !== args.rating)
    ) {
      throw new Error("Rating must be an integer between 1 and 5");
    }

    return await ctx.db.insert("posts", {
      cityId: args.cityId,
      authorId: user._id,
      title: args.title.trim(),
      content: args.content.trim(),
      type: args.type,
      images: args.images,
      difficulty: args.difficulty,
      rating: args.rating,
    });
  },
});

// Delete a post (auth required, author only, cascade deletes)
export const deletePost = mutation({
  args: {
    userId: v.id("users"),
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const user = await authenticateCaller(ctx, args.userId);

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");
    if (post.authorId !== user._id) {
      throw new Error("Only the author can delete this post");
    }

    // Delete all comments
    const comments = await ctx.db
      .query("post_comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    // Delete all likes
    const likes = await ctx.db
      .query("post_likes")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    // Delete post images from storage
    for (const storageId of post.images) {
      try {
        await ctx.storage.delete(storageId);
      } catch {
        // Image may already be deleted
      }
    }

    await ctx.db.delete(args.postId);
  },
});

// Update a post (auth required, author only)
export const updatePost = mutation({
  args: {
    userId: v.id("users"),
    postId: v.id("posts"),
    title: v.string(),
    content: v.string(),
    type: v.union(
      v.literal("trail_report"),
      v.literal("recommendation"),
      v.literal("general")
    ),
    images: v.array(v.string()),
    difficulty: v.optional(
      v.union(
        v.literal("easy"),
        v.literal("moderate"),
        v.literal("hard"),
        v.literal("expert")
      )
    ),
    rating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateCaller(ctx, args.userId);

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");
    if (post.authorId !== user._id) {
      throw new Error("Only the author can edit this post");
    }

    if (!args.title.trim()) {
      throw new Error("Title is required");
    }
    if (args.title.length > 200) {
      throw new Error("Title must be 200 characters or less");
    }
    if (!args.content.trim()) {
      throw new Error("Content is required");
    }
    if (args.content.length > 10000) {
      throw new Error("Content must be 10000 characters or less");
    }
    if (args.images.length > 5) {
      throw new Error("Maximum 5 images per post");
    }
    if (
      args.rating !== undefined &&
      (args.rating < 1 || args.rating > 5 || Math.floor(args.rating) !== args.rating)
    ) {
      throw new Error("Rating must be an integer between 1 and 5");
    }

    // Delete removed images from storage
    const oldImages = new Set(post.images);
    const newImages = new Set(args.images);
    for (const storageId of oldImages) {
      if (!newImages.has(storageId)) {
        try {
          await ctx.storage.delete(storageId);
        } catch {
          // Image may already be deleted
        }
      }
    }

    await ctx.db.patch(args.postId, {
      title: args.title.trim(),
      content: args.content.trim(),
      type: args.type,
      images: args.images,
      difficulty: args.difficulty,
      rating: args.rating,
    });
  },
});

// Count posts for a city
export const countPostsByCity = query({
  args: { cityId: v.id("cities") },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_city", (q) => q.eq("cityId", args.cityId))
      .collect();
    return posts.length;
  },
});

// Toggle like on a post (auth required)
export const likePost = mutation({
  args: {
    userId: v.id("users"),
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const user = await authenticateCaller(ctx, args.userId);

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    const existing = await ctx.db
      .query("post_likes")
      .withIndex("by_user_post", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { liked: false };
    } else {
      await ctx.db.insert("post_likes", {
        postId: args.postId,
        userId: user._id,
      });
      return { liked: true };
    }
  },
});

// Add a comment to a post (auth required)
export const addPostComment = mutation({
  args: {
    userId: v.id("users"),
    postId: v.id("posts"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authenticateCaller(ctx, args.userId);

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");

    if (!args.content.trim()) {
      throw new Error("Comment is required");
    }
    if (args.content.length > 1000) {
      throw new Error("Comment must be 1000 characters or less");
    }

    return await ctx.db.insert("post_comments", {
      postId: args.postId,
      authorId: user._id,
      content: args.content.trim(),
    });
  },
});

// Get posts by a specific author (for My Activity page, auth required)
export const getPostsByAuthor = query({
  args: {
    userId: v.id("users"),
    authorId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Verify caller is authenticated and is the author
    const user = await ctx.db.get(args.userId);
    if (!user || !user.authId) {
      throw new Error("Authentication required");
    }
    if (args.userId !== args.authorId) {
      throw new Error("You can only view your own activity");
    }

    const safeLimit = Math.max(1, Math.min(args.limit ?? 50, 50));
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", args.authorId))
      .order("desc")
      .take(safeLimit);

    const enriched = await Promise.all(
      posts.map(async (post) => {
        const city = await ctx.db.get(post.cityId);
        const likes = await ctx.db
          .query("post_likes")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect();
        const comments = await ctx.db
          .query("post_comments")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect();

        return {
          ...post,
          city: city
            ? { _id: city._id, name: city.name, country: city.country }
            : null,
          likeCount: likes.length,
          commentCount: comments.length,
        };
      })
    );

    return enriched;
  },
});

// Get recent posts across all cities (for homepage carousel)
export const getRecentPosts = query({
  args: {
    limit: v.optional(v.number()),
    currentUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const safeLimit = Math.max(1, Math.min(args.limit ?? 10, 20));

    // Build blocked user set if caller is authenticated
    let blockedUserIds = new Set<string>();
    if (args.currentUserId) {
      blockedUserIds = await getBlockedUserIds(ctx, args.currentUserId);
    }

    const posts = await ctx.db
      .query("posts")
      .order("desc")
      .take(safeLimit + blockedUserIds.size);

    const filtered = posts.filter(
      (post) => !blockedUserIds.has(post.authorId)
    ).slice(0, safeLimit);

    const enriched = await Promise.all(
      filtered.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        const city = await ctx.db.get(post.cityId);
        const likes = await ctx.db
          .query("post_likes")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect();
        const comments = await ctx.db
          .query("post_comments")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect();

        return {
          ...post,
          author: author
            ? {
                _id: author._id,
                username: author.username,
                avatarUrl: author.avatarUrl,
              }
            : null,
          city: city
            ? { _id: city._id, name: city.name, country: city.country }
            : null,
          likeCount: likes.length,
          commentCount: comments.length,
        };
      })
    );

    return enriched;
  },
});

// Get all post IDs with cityId and creation time (for sitemap)
export const getAllPostIds = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("posts").take(10000);
    return posts.map((post) => ({
      _id: post._id,
      cityId: post.cityId,
      _creationTime: post._creationTime,
    }));
  },
});

// Delete a comment (auth required, author only)
export const deletePostComment = mutation({
  args: {
    userId: v.id("users"),
    commentId: v.id("post_comments"),
  },
  handler: async (ctx, args) => {
    const user = await authenticateCaller(ctx, args.userId);

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");
    if (comment.authorId !== user._id) {
      throw new Error("Only the author can delete this comment");
    }

    await ctx.db.delete(args.commentId);
  },
});
