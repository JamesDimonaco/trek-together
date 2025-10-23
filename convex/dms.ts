import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Send a DM
export const sendDM = mutation({
  args: {
    senderId: v.id("users"),
    receiverId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify both users exist and are authenticated
    const sender = await ctx.db.get(args.senderId);
    const receiver = await ctx.db.get(args.receiverId);

    if (!sender || !sender.authId) {
      throw new Error("Sender must be authenticated");
    }

    if (!receiver || !receiver.authId) {
      throw new Error("Receiver must be authenticated");
    }

    // Check if either user has blocked the other
    const senderBlockedReceiver = await ctx.db
      .query("blocked_users")
      .withIndex("by_blocker_and_blocked", (q) =>
        q.eq("blockerId", args.senderId).eq("blockedId", args.receiverId)
      )
      .first();

    const receiverBlockedSender = await ctx.db
      .query("blocked_users")
      .withIndex("by_blocker_and_blocked", (q) =>
        q.eq("blockerId", args.receiverId).eq("blockedId", args.senderId)
      )
      .first();

    if (senderBlockedReceiver || receiverBlockedSender) {
      throw new Error("Cannot send message to blocked user");
    }

    return await ctx.db.insert("dms", {
      senderId: args.senderId,
      receiverId: args.receiverId,
      content: args.content,
      read: false, // Mark as unread by default
    });
  },
});

// Get DM conversation between two users
export const getConversation = query({
  args: {
    userId1: v.id("users"),
    userId2: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get messages where either user is sender/receiver
    const messages = await ctx.db
      .query("dms")
      .filter((q) =>
        q.or(
          q.and(
            q.eq(q.field("senderId"), args.userId1),
            q.eq(q.field("receiverId"), args.userId2)
          ),
          q.and(
            q.eq(q.field("senderId"), args.userId2),
            q.eq(q.field("receiverId"), args.userId1)
          )
        )
      )
      .order("asc")
      .take(100);
    
    return messages;
  },
});

// Get all conversations for a user
export const getUserConversations = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get all users this user has blocked
    const blockedByMe = await ctx.db
      .query("blocked_users")
      .withIndex("by_blocker", (q) => q.eq("blockerId", args.userId))
      .collect();

    // Get all users who have blocked this user
    const blockedMe = await ctx.db
      .query("blocked_users")
      .withIndex("by_blocked", (q) => q.eq("blockedId", args.userId))
      .collect();

    const blockedUserIds = new Set([
      ...blockedByMe.map(b => b.blockedId),
      ...blockedMe.map(b => b.blockerId),
    ]);

    // Get all unique users this user has messaged with
    const sentMessages = await ctx.db
      .query("dms")
      .withIndex("by_sender", (q) => q.eq("senderId", args.userId))
      .collect();

    const receivedMessages = await ctx.db
      .query("dms")
      .withIndex("by_receiver", (q) => q.eq("receiverId", args.userId))
      .collect();

    // Collect unique conversation partners (excluding blocked users)
    const conversationPartners = new Set<string>();
    sentMessages.forEach(msg => {
      if (!blockedUserIds.has(msg.receiverId)) {
        conversationPartners.add(msg.receiverId);
      }
    });
    receivedMessages.forEach(msg => {
      if (!blockedUserIds.has(msg.senderId)) {
        conversationPartners.add(msg.senderId);
      }
    });

    // Get last message for each conversation
    const conversations = [];
    for (const partnerId of conversationPartners) {
      const partner = await ctx.db.get(partnerId as any);
      if (!partner) continue;

      // Get last message in conversation
      const lastMessage = await ctx.db
        .query("dms")
        .filter((q) =>
          q.or(
            q.and(
              q.eq(q.field("senderId"), args.userId),
              q.eq(q.field("receiverId"), partnerId as any)
            ),
            q.and(
              q.eq(q.field("senderId"), partnerId as any),
              q.eq(q.field("receiverId"), args.userId)
            )
          )
        )
        .order("desc")
        .first();

      if (lastMessage) {
        // Get unread count for this conversation
        const unreadMessages = await ctx.db
          .query("dms")
          .withIndex("by_receiver_unread", (q) =>
            q.eq("receiverId", args.userId).eq("read", false)
          )
          .filter((q) => q.eq(q.field("senderId"), partnerId as any))
          .collect();

        conversations.push({
          partner,
          lastMessage,
          lastMessageTime: lastMessage._creationTime,
          unreadCount: unreadMessages.length,
        });
      }
    }

    // Sort by last message time
    conversations.sort((a, b) => b.lastMessageTime - a.lastMessageTime);

    return conversations;
  },
});

// Mark messages as read
export const markAsRead = mutation({
  args: {
    userId: v.id("users"),
    conversationPartnerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Find all unread messages from conversationPartner to userId
    const unreadMessages = await ctx.db
      .query("dms")
      .withIndex("by_receiver_unread", (q) =>
        q.eq("receiverId", args.userId).eq("read", false)
      )
      .filter((q) => q.eq(q.field("senderId"), args.conversationPartnerId))
      .collect();

    // Mark all as read
    for (const message of unreadMessages) {
      await ctx.db.patch(message._id, { read: true });
    }

    return { success: true, markedCount: unreadMessages.length };
  },
});

// Get unread message count for a specific conversation
export const getUnreadCount = query({
  args: {
    userId: v.id("users"),
    conversationPartnerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const unreadMessages = await ctx.db
      .query("dms")
      .withIndex("by_receiver_unread", (q) =>
        q.eq("receiverId", args.userId).eq("read", false)
      )
      .filter((q) => q.eq(q.field("senderId"), args.conversationPartnerId))
      .collect();

    return unreadMessages.length;
  },
});

// Get total unread DM count for the authenticated user
export const getTotalUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    // Authorization: only authenticated users can have DMs
    const identity = await ctx.auth.getUserIdentity();

    // If not authenticated, they can't have DMs (DMs require authentication)
    if (!identity) {
      return 0;
    }

    // Get the authenticated user's record
    const authenticatedUser = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", identity.subject))
      .first();

    // If user not found, return 0
    if (!authenticatedUser) {
      return 0;
    }

    const unreadMessages = await ctx.db
      .query("dms")
      .withIndex("by_receiver_unread", (q) =>
        q.eq("receiverId", authenticatedUser._id).eq("read", false)
      )
      .collect();

    return unreadMessages.length;
  },
});