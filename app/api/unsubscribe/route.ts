import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function unsubscribe(token: string | null): Promise<boolean> {
  if (!token) return false;
  try {
    const result = await convex.mutation(api.users.unsubscribeByToken, {
      token,
    });
    return result.success;
  } catch (error) {
    console.error("Unsubscribe failed:", error);
    return false;
  }
}

// Human clicking the footer link in an email
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const success = await unsubscribe(token);

  const message = success
    ? "You've been unsubscribed from TrekTogether email notifications."
    : "This unsubscribe link is invalid or has already been used.";

  return new NextResponse(
    `<!DOCTYPE html>
<html>
  <head><title>TrekTogether</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;margin:0;padding:48px 20px;text-align:center;color:#111827;">
    <p style="font-size:32px;margin:0 0 16px;">🏔️</p>
    <h1 style="font-size:20px;margin:0 0 8px;">TrekTogether</h1>
    <p style="font-size:15px;color:#4b5563;">${message}</p>
    <p style="margin-top:24px;"><a href="/" style="color:#16a34a;">Back to TrekTogether</a></p>
  </body>
</html>`,
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
}

// RFC 8058 one-click unsubscribe (Gmail/Yahoo POST here automatically)
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const success = await unsubscribe(token);
  return NextResponse.json({ success }, { status: success ? 200 : 400 });
}
