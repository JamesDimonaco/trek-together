import { internalAction } from "./_generated/server";
import { v } from "convex/values";

// Delivers a single email via the Resend HTTP API.
// Scheduled from mutations via ctx.scheduler (see convex/lib/notify.ts) so
// sending is server-side and survives the client closing the tab.
export const deliver = internalAction({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
    unsubscribeUrl: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn(
        `RESEND_API_KEY not set in Convex env; skipping email "${args.subject}"`
      );
      return;
    }

    const headers: Record<string, string> = {};
    if (args.unsubscribeUrl) {
      // RFC 8058 one-click unsubscribe (required by Gmail/Yahoo bulk-sender rules)
      headers["List-Unsubscribe"] = `<${args.unsubscribeUrl}>`;
      headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:
          process.env.EMAIL_FROM ||
          "TrekTogether <notifications@trektogether.app>",
        to: [args.to],
        subject: args.subject,
        html: args.html,
        headers,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`Resend send failed (${res.status}): ${body}`);
    }
  },
});
