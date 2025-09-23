import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

type ClerkWebhookEvent = {
  type: string;
  data: {
    id: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    email_addresses?: Array<{
      email_address: string;
      id: string;
    }>;
    image_url?: string;
    created_at?: number;
    updated_at?: number;
  };
};

export async function POST(request: NextRequest) {
  // Get webhook secret
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Missing CLERK_WEBHOOK_SECRET");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Get headers
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    );
  }

  // Get body
  const payload = await request.text();

  // Verify webhook
  const webhook = new Webhook(webhookSecret);
  let event: ClerkWebhookEvent;

  try {
    event = webhook.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 }
    );
  }

  // Handle different event types
  try {
    switch (event.type) {
      case "user.created":
        await handleUserCreated(event.data);
        break;
      case "user.updated":
        await handleUserUpdated(event.data);
        break;
      case "user.deleted":
        await handleUserDeleted(event.data);
        break;
      default:
        console.log(`Unhandled webhook event: ${event.type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleUserCreated(userData: ClerkWebhookEvent["data"]) {
  const username = 
    userData.username || 
    userData.first_name || 
    `user-${userData.id.slice(-8)}`;

  console.log("Creating authenticated user:", {
    authId: userData.id,
    username,
    avatarUrl: userData.image_url,
  });

  // Create or update user in Convex with Clerk data
  await convex.mutation(api.users.upsertUser, {
    authId: userData.id,
    username,
    avatarUrl: userData.image_url,
  });
}

async function handleUserUpdated(userData: ClerkWebhookEvent["data"]) {
  const username = 
    userData.username || 
    userData.first_name || 
    `user-${userData.id.slice(-8)}`;

  console.log("Updating authenticated user:", {
    authId: userData.id,
    username,
    avatarUrl: userData.image_url,
  });

  // Update user in Convex
  await convex.mutation(api.users.upsertUser, {
    authId: userData.id,
    username,
    avatarUrl: userData.image_url,
  });
}

async function handleUserDeleted(userData: ClerkWebhookEvent["data"]) {
  console.log("User deleted:", userData.id);
  
  // We might want to anonymize the user rather than delete
  // For now, we'll just log it
  // Could implement: await convex.mutation(api.users.anonymizeUser, { authId: userData.id });
}