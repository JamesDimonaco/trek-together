import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import DMNotificationEmail from "@/components/emails/dm-notification";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const resend = new Resend(process.env.RESEND_API_KEY);
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderId, receiverId, messageContent } = body;

    if (!senderId || !receiverId || !messageContent) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get sender and receiver info from Convex
    const sender = await convex.query(api.users.getUserById, {
      userId: senderId as Id<"users">,
    });

    const receiver = await convex.query(api.users.getUserById, {
      userId: receiverId as Id<"users">,
    });

    if (!sender || !receiver) {
      return NextResponse.json(
        { error: "Sender or receiver not found" },
        { status: 404 }
      );
    }

    // Check if receiver has email notifications enabled
    if (!receiver.emailNotifications || !receiver.email) {
      return NextResponse.json(
        { success: false, reason: "Email notifications disabled or no email" },
        { status: 200 }
      );
    }

    // Truncate message preview to 100 characters
    const messagePreview =
      messageContent.length > 100
        ? `${messageContent.substring(0, 100)}...`
        : messageContent;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://trektogether.app";
    const conversationUrl = `${appUrl}/dm/${senderId}`;

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: "TrekTogether <notifications@trektogether.app>",
      to: [receiver.email],
      subject: `New message from ${sender.username}`,
      react: DMNotificationEmail({
        senderUsername: sender.username,
        messagePreview,
        conversationUrl,
        recipientUsername: receiver.username,
      }),
    });

    if (error) {
      console.error("Failed to send email:", error);
      return NextResponse.json(
        { error: "Failed to send email", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: data?.id,
    });
  } catch (error) {
    console.error("Email notification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
