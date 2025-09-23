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
    
    return await ctx.db.insert("dms", {
      senderId: args.senderId,
      receiverId: args.receiverId,
      content: args.content,
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
    // Get all unique users this user has messaged with
    const sentMessages = await ctx.db
      .query("dms")
      .withIndex("by_sender", (q) => q.eq("senderId", args.userId))
      .collect();
    
    const receivedMessages = await ctx.db
      .query("dms")
      .withIndex("by_receiver", (q) => q.eq("receiverId", args.userId))
      .collect();
    
    // Collect unique conversation partners
    const conversationPartners = new Set<string>();
    sentMessages.forEach(msg => conversationPartners.add(msg.receiverId));
    receivedMessages.forEach(msg => conversationPartners.add(msg.senderId));
    
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
        conversations.push({
          partner,
          lastMessage,
          lastMessageTime: lastMessage._creationTime,
        });
      }
    }
    
    // Sort by last message time
    conversations.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
    
    return conversations;
  },
});

// Mark messages as read (optional feature for future)
export const markAsRead = mutation({
  args: {
    userId: v.id("users"),
    conversationPartnerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // This would update a "read" status on messages
    // For MVP, we can implement this later
    // Would need to add a "read" field to the dms table
    return { success: true };
  },
});