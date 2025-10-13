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
    citiesVisited: v.array(v.id("cities")), // list of city_ids
    currentCityId: v.optional(v.id("cities")), // current/last active city
    lastSeen: v.optional(v.number()),      // timestamp of last activity
  })
    .index("by_auth_id", ["authId"])
    .index("by_session_id", ["sessionId"])
    .index("by_current_city", ["currentCityId"])
    .index("by_last_seen", ["lastSeen"]),

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

  dms: defineTable({
    senderId: v.id("users"),
    receiverId: v.id("users"),
    content: v.string(),
  })
    .index("by_sender", ["senderId"])
    .index("by_receiver", ["receiverId"])
    .index("by_participants", ["senderId", "receiverId"]),
});