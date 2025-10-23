import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is required");
}
const convex = new ConvexHttpClient(convexUrl);

type ClerkWebhookEvent = {
  object: "event";
  type: string;
  timestamp: number;
  instance_id: string;
  data: {
    id: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    email_addresses?: Array<{
      email_address: string;
      id: string;
      verification?: {
        status: string;
        strategy: string;
      };
    }>;
    phone_numbers?: Array<{
      phone_number: string;
      id: string;
    }>;
    image_url?: string;
    profile_image_url?: string;
    external_id?: string;
    primary_email_address_id?: string;
    last_sign_in_at?: number;
    created_at?: number;
    updated_at?: number;
    public_metadata?: Record<string, unknown>;
    private_metadata?: Record<string, unknown>;
    // Additional fields that might be present
    [key: string]: unknown;
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

async function upsertUserData(
  userData: ClerkWebhookEvent["data"],
  action: string
) {
  const username = generateUsername(userData);

  // Get primary email address
  const primaryEmail = userData.email_addresses?.find(
    (email) => email.id === userData.primary_email_address_id
  )?.email_address;

  console.log(`${action} authenticated user:`, {
    authId: userData.id,
    username,
    avatarUrl: userData.image_url,
    email: primaryEmail,
  });

  // Check if user already exists before upserting
  const existing = await convex.query(api.users.getUserByAuthId, {
    authId: userData.id,
  });

  if (existing) {
    console.log(`User already exists, updating:`, {
      userId: existing._id,
      existingUsername: existing.username,
      newUsername: username,
    });
  } else {
    console.log(`Creating new authenticated user for authId: ${userData.id}`);
  }

  await convex.mutation(api.users.upsertUser, {
    authId: userData.id,
    username,
    avatarUrl: userData.image_url,
    email: primaryEmail,
  });
}

function generateUsername(userData: ClerkWebhookEvent["data"]): string {
  return (
    userData.username || userData.first_name || `user-${userData.id.slice(-8)}`
  );
}

async function handleUserCreated(userData: ClerkWebhookEvent["data"]) {
  await upsertUserData(userData, "Creating");
}

async function handleUserUpdated(userData: ClerkWebhookEvent["data"]) {
  await upsertUserData(userData, "Updating");
}

async function handleUserDeleted(userData: ClerkWebhookEvent["data"]) {
  console.log("User deleted from Clerk:", userData.id);

  try {
    // Anonymize user data (GDPR compliant approach)
    // This preserves message history while removing personal data
    await convex.mutation(api.users.anonymizeUser, { 
      authId: userData.id 
    });
    
    console.log("User data anonymized successfully:", userData.id);
  } catch (error) {
    console.error("Failed to anonymize user data:", error);
    // Don't throw - webhook should still return success to Clerk
    // Consider implementing a retry mechanism or dead letter queue
  }
}
