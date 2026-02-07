import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    authId: v.optional(v.string()),        // Clerk ID (null if guest)
    sessionId: v.optional(v.string()),     // identifier for guests
    username: v.string(),
    avatarUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    whatsappNumber: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),   // user's date of birth (ISO format)
    location: v.optional(v.string()),      // where user is from (city, country)
    email: v.optional(v.string()),         // email for notifications
    citiesVisited: v.array(v.id("cities")), // list of city_ids
    currentCityId: v.optional(v.id("cities")), // current/last active city
    lastSeen: v.optional(v.number()),      // timestamp of last activity
    // Notification preferences
    emailNotifications: v.optional(v.boolean()), // receive email notifications for DMs
    browserNotifications: v.optional(v.boolean()), // receive browser notifications
  })
    .index("by_auth_id", ["authId"])
    .index("by_session_id", ["sessionId"])
    .index("by_current_city", ["currentCityId"])
    .index("by_last_seen", ["lastSeen"])
    .index("by_email", ["email"]),

  countries: defineTable({
    name: v.string(),           // "Peru", "Colombia"
    slug: v.string(),           // "peru", "colombia" (URL-safe)
  })
    .index("by_slug", ["slug"])
    .index("by_name", ["name"]),

  cities: defineTable({
    name: v.string(),
    country: v.string(),
    lat: v.float64(),
    lng: v.float64(),
  })
    .index("by_name_country", ["name", "country"]),

  city_messages: defineTable({
    cityId: v.id("cities"),
    userId: v.optional(v.id("users")),
    sessionId: v.optional(v.string()),
    username: v.string(),
    content: v.string(),
  })
    .index("by_city", ["cityId"]),

  country_messages: defineTable({
    countryId: v.id("countries"),
    userId: v.optional(v.id("users")),
    sessionId: v.optional(v.string()),
    username: v.string(),
    content: v.string(),
  })
    .index("by_country", ["countryId"]),

  dms: defineTable({
    senderId: v.id("users"),
    receiverId: v.id("users"),
    content: v.string(),
    read: v.optional(v.boolean()), // has receiver read this message
  })
    .index("by_sender", ["senderId"])
    .index("by_receiver", ["receiverId"])
    .index("by_participants", ["senderId", "receiverId"])
    .index("by_receiver_unread", ["receiverId", "read"]),

  blocked_users: defineTable({
    blockerId: v.id("users"),           // User who blocked
    blockedId: v.id("users"),           // User who was blocked
    reason: v.optional(v.string()),     // Optional reason
  })
    .index("by_blocker", ["blockerId"])
    .index("by_blocked", ["blockedId"])
    .index("by_blocker_and_blocked", ["blockerId", "blockedId"]),

  reports: defineTable({
    reporterId: v.id("users"),              // User reporting
    reportedUserId: v.id("users"),          // User being reported
    messageId: v.optional(v.string()),      // Message ID being reported (stored as string)
    messageType: v.optional(v.union(        // Type of message
      v.literal("city_message"),
      v.literal("dm"),
      v.literal("country_message")
    )),
    reason: v.string(),                     // Report reason
    description: v.optional(v.string()),    // Additional details
    status: v.union(                        // Moderation status
      v.literal("pending"),
      v.literal("reviewed"),
      v.literal("resolved"),
      v.literal("dismissed")
    ),
  })
    .index("by_reporter", ["reporterId"])
    .index("by_reported_user", ["reportedUserId"])
    .index("by_status", ["status"]),

  typing_indicators: defineTable({
    userId: v.id("users"),                  // User who is typing
    conversationId: v.string(),             // Chat identifier (cityId or dm-userId1-userId2)
    conversationType: v.union(              // Type of conversation
      v.literal("city"),
      v.literal("dm"),
      v.literal("country")
    ),
    expiresAt: v.number(),                  // Auto-expire after timestamp
  })
    .index("by_conversation", ["conversationId"])
    .index("by_expires", ["expiresAt"]),

  // Posts / Articles per city
  posts: defineTable({
    cityId: v.id("cities"),
    authorId: v.id("users"),
    title: v.string(),
    content: v.string(),
    type: v.union(
      v.literal("trail_report"),
      v.literal("recommendation"),
      v.literal("general")
    ),
    images: v.array(v.string()),            // Storage IDs
    difficulty: v.optional(v.union(
      v.literal("easy"),
      v.literal("moderate"),
      v.literal("hard"),
      v.literal("expert")
    )),
    rating: v.optional(v.number()),         // 1-5
  })
    .index("by_city", ["cityId"])
    .index("by_author", ["authorId"])
    .index("by_city_type", ["cityId", "type"]),

  post_comments: defineTable({
    postId: v.id("posts"),
    authorId: v.id("users"),
    content: v.string(),
  })
    .index("by_post", ["postId"]),

  post_likes: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),
  })
    .index("by_post", ["postId"])
    .index("by_user_post", ["userId", "postId"]),

  // Trek Requests per city
  requests: defineTable({
    cityId: v.id("cities"),
    authorId: v.id("users"),
    title: v.string(),
    description: v.string(),
    dateFrom: v.string(),                   // ISO date
    dateTo: v.optional(v.string()),         // ISO date
    activityType: v.union(
      v.literal("trekking"),
      v.literal("hiking"),
      v.literal("climbing"),
      v.literal("camping"),
      v.literal("other")
    ),
    status: v.union(
      v.literal("open"),
      v.literal("closed")
    ),
  })
    .index("by_city", ["cityId"])
    .index("by_author", ["authorId"])
    .index("by_city_status", ["cityId", "status"]),

  request_interests: defineTable({
    requestId: v.id("requests"),
    userId: v.id("users"),
  })
    .index("by_request", ["requestId"])
    .index("by_user_request", ["userId", "requestId"]),

  request_comments: defineTable({
    requestId: v.id("requests"),
    authorId: v.id("users"),
    content: v.string(),
  })
    .index("by_request", ["requestId"]),
});