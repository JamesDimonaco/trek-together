import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
        .collect();
    } else {
      posts = await ctx.db
        .query("posts")
        .withIndex("by_city", (q) => q.eq("cityId", args.cityId))
        .order("desc")
        .collect();
    }

    // Get blocked user IDs if authenticated
    let blockedUserIds = new Set<string>();
    if (args.currentUserId) {
      const blocked = await ctx.db
        .query("blocked_users")
        .withIndex("by_blocker", (q) => q.eq("blockerId", args.currentUserId!))
        .collect();
      blockedUserIds = new Set(blocked.map((b) => b.blockedId));
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

    // Enrich comments with author info
    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
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
    cityId: v.id("cities"),
    authorId: v.id("users"),
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
    if (args.title.length > 200) {
      throw new Error("Title must be 200 characters or less");
    }
    if (args.content.length > 5000) {
      throw new Error("Content must be 5000 characters or less");
    }
    if (args.images.length > 5) {
      throw new Error("Maximum 5 images per post");
    }
    if (args.rating !== undefined && (args.rating < 1 || args.rating > 5)) {
      throw new Error("Rating must be between 1 and 5");
    }

    return await ctx.db.insert("posts", {
      cityId: args.cityId,
      authorId: args.authorId,
      title: args.title,
      content: args.content,
      type: args.type,
      images: args.images,
      difficulty: args.difficulty,
      rating: args.rating,
    });
  },
});

// Delete a post (author only, cascade deletes comments + likes)
export const deletePost = mutation({
  args: {
    postId: v.id("posts"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Post not found");
    if (post.authorId !== args.userId) {
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

// Toggle like on a post
export const likePost = mutation({
  args: {
    postId: v.id("posts"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("post_likes")
      .withIndex("by_user_post", (q) =>
        q.eq("userId", args.userId).eq("postId", args.postId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { liked: false };
    } else {
      await ctx.db.insert("post_likes", {
        postId: args.postId,
        userId: args.userId,
      });
      return { liked: true };
    }
  },
});

// Add a comment to a post
export const addPostComment = mutation({
  args: {
    postId: v.id("posts"),
    authorId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.content.length > 1000) {
      throw new Error("Comment must be 1000 characters or less");
    }

    return await ctx.db.insert("post_comments", {
      postId: args.postId,
      authorId: args.authorId,
      content: args.content,
    });
  },
});

// Delete a comment (author only)
export const deletePostComment = mutation({
  args: {
    commentId: v.id("post_comments"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");
    if (comment.authorId !== args.userId) {
      throw new Error("Only the author can delete this comment");
    }

    await ctx.db.delete(args.commentId);
  },
});
