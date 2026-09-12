import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function page(body: string) {
  return new NextResponse(
    `<!DOCTYPE html>
<html>
  <head><title>TrekTogether</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;margin:0;padding:48px 20px;text-align:center;color:#111827;">
    <p style="font-size:32px;margin:0 0 16px;">🏔️</p>
    <h1 style="font-size:20px;margin:0 0 8px;">TrekTogether</h1>
    ${body}
    <p style="margin-top:24px;"><a href="/" style="color:#16a34a;">Back to TrekTogether</a></p>
  </body>
</html>`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        // Never let a confirmation page be cached or prefetched into a hit
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}

// GET only renders a button. Consent is granted by the POST below.
//
// Mail security scanners (Outlook SafeLinks in particular, which this repo has
// already seen crawling TrekTogether notification links) follow every URL in an
// email. If GET flipped the flag, those scanners would silently confirm every
// address and the double opt-in would be worth nothing.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return page(
      `<p style="font-size:15px;color:#4b5563;">This confirmation link is invalid or has already been used.</p>`
    );
  }

  return page(
    `<p style="font-size:15px;color:#4b5563;">Confirm you want TrekTogether to email you when a trekker answers.</p>
     <form method="POST" action="/api/confirm?token=${encodeURIComponent(token)}">
       <button type="submit" style="background:#16a34a;color:#ffffff;padding:10px 20px;border-radius:8px;border:none;font-weight:600;font-size:15px;cursor:pointer;margin-top:12px;">Yes, email me replies</button>
     </form>`
  );
}

export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  let success = false;
  if (token) {
    try {
      const result = await convex.mutation(api.users.confirmEmailByToken, {
        token,
      });
      success = result.success;
    } catch (error) {
      console.error("Email confirmation failed:", error);
    }
  }

  return page(
    success
      ? `<p style="font-size:15px;color:#4b5563;">You're confirmed. We'll email you when a trekker answers you.</p>`
      : `<p style="font-size:15px;color:#4b5563;">This confirmation link is invalid or has already been used.</p>`
  );
}
