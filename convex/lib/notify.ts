import { Doc } from "../_generated/dataModel";
import { MutationCtx } from "../_generated/server";
import { internal } from "../_generated/api";

// Base URL for links in emails (Convex env var, falls back to prod domain)
export function appUrl(): string {
  return process.env.APP_URL || "https://trektogether.app";
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 254;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

// Convex mutations use seeded Math.random (deterministic per transaction),
// which is fine for an unguessable-enough unsubscribe token
export function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 40; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

export async function ensureUnsubscribeToken(
  ctx: MutationCtx,
  user: Doc<"users">
): Promise<string> {
  if (user.unsubscribeToken) return user.unsubscribeToken;
  const token = generateToken();
  await ctx.db.patch(user._id, { unsubscribeToken: token });
  return token;
}

// Minimal transactional layout: text-forward, single link, unsubscribe footer.
// Kept deliberately plain for deliverability.
function renderLayout(bodyHtml: string, unsubscribeUrl?: string): string {
  const footer = unsubscribeUrl
    ? `<p style="margin-top:24px;font-size:12px;color:#9ca3af;">
        You're receiving this because you asked TrekTogether to notify you.
        <a href="${unsubscribeUrl}" style="color:#9ca3af;">Unsubscribe</a>
      </p>`
    : "";
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f9fafb;">
    <div style="max-width:520px;margin:0 auto;padding:32px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111827;">
      <p style="font-size:16px;font-weight:700;margin:0 0 20px;">🏔️ TrekTogether</p>
      ${bodyHtml}
      ${footer}
    </div>
  </body>
</html>`;
}

function ctaButton(url: string, label: string): string {
  return `<p style="margin:20px 0;">
    <a href="${url}" style="background:#16a34a;color:#ffffff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">${label}</a>
  </p>`;
}

export interface NotifyOptions {
  user: Doc<"users">;
  kind: string;
  key: string;
  // "once" = never repeat for this (user, kind, key); number = cooldown in ms
  cooldown: number | "once";
  subject: string;
  bodyHtml: string;
}

// Store a contact address and ask its owner to confirm it before anything else
// is sent. Consent stays off until they click, so typing a stranger's address
// into a chat box subscribes nobody - it sends them one mail they can ignore.
// Returns false only when the address is malformed.
export async function captureEmail(
  ctx: MutationCtx,
  user: Doc<"users">,
  rawEmail: string
): Promise<boolean> {
  const email = rawEmail.trim().toLowerCase();
  if (!isValidEmail(email)) return false;

  // Already confirmed for this address - don't make them do it twice
  if (user.email === email && user.emailNotifications === true) return true;

  const token = generateToken();
  await ctx.db.patch(user._id, {
    email,
    emailNotifications: false,
    emailConfirmToken: token,
  });

  await ctx.scheduler.runAfter(0, internal.notifications.deliver, {
    to: email,
    subject: "Confirm your TrekTogether notifications",
    html: renderLayout(
      `<p style="font-size:15px;">Someone entered this address on TrekTogether so we can tell you when a trekker answers you.</p>
       <p style="font-size:15px;">If that was you, confirm it below. If it wasn't, ignore this - nothing else will be sent.</p>
       ${ctaButton(`${appUrl()}/api/confirm?token=${token}`, "Yes, email me replies")}`
    ),
  });

  return true;
}

// Send a notification email to a user, respecting consent, dedupe, and cooldowns.
// Returns true if an email was scheduled.
export async function notifyUser(
  ctx: MutationCtx,
  opts: NotifyOptions
): Promise<boolean> {
  const { user, kind, key, cooldown, subject, bodyHtml } = opts;

  // Consent: explicit opt-in plus a stored email address
  if (!user.email || user.emailNotifications !== true) return false;

  const prior = await ctx.db
    .query("notification_log")
    .withIndex("by_user_kind_key", (q) =>
      q.eq("userId", user._id).eq("kind", kind).eq("key", key)
    )
    .order("desc")
    .first();

  if (prior) {
    if (cooldown === "once") return false;
    if (Date.now() - prior.sentAt < cooldown) return false;
  }

  const token = await ensureUnsubscribeToken(ctx, user);
  const unsubscribeUrl = `${appUrl()}/api/unsubscribe?token=${token}`;

  await ctx.db.insert("notification_log", {
    userId: user._id,
    kind,
    key,
    sentAt: Date.now(),
  });

  await ctx.scheduler.runAfter(0, internal.notifications.deliver, {
    to: user.email,
    subject,
    html: renderLayout(bodyHtml, unsubscribeUrl),
    unsubscribeUrl,
  });

  return true;
}

// Alert the founder about new activity so a human can respond fast.
// No consent/cooldown machinery: goes to FOUNDER_ALERT_EMAIL (Convex env var).
export async function notifyFounder(
  ctx: MutationCtx,
  subject: string,
  bodyHtml: string
): Promise<void> {
  const to = process.env.FOUNDER_ALERT_EMAIL;
  if (!to) return;
  await ctx.scheduler.runAfter(0, internal.notifications.deliver, {
    to,
    subject,
    html: renderLayout(bodyHtml),
  });
}

// --- Template builders (all user content must arrive pre-escaped via these) ---

export function interestEmailBody(args: {
  actorName: string;
  requestTitle: string;
  requestUrl: string;
}): string {
  return `<p style="font-size:15px;line-height:1.6;">
      <strong>${escapeHtml(args.actorName)}</strong> wants to join your trek:
    </p>
    <p style="font-size:15px;line-height:1.6;background:#f3f4f6;padding:12px 16px;border-radius:8px;margin:12px 0;">
      ${escapeHtml(args.requestTitle)}
    </p>
    <p style="font-size:14px;line-height:1.6;color:#4b5563;">
      Reply in the comments to make a plan together.
    </p>
    ${ctaButton(args.requestUrl, "Reply to them")}`;
}

export function commentEmailBody(args: {
  actorName: string;
  requestTitle: string;
  requestUrl: string;
  commentPreview: string;
}): string {
  return `<p style="font-size:15px;line-height:1.6;">
      <strong>${escapeHtml(args.actorName)}</strong> replied on
      "${escapeHtml(args.requestTitle)}":
    </p>
    <p style="font-size:15px;line-height:1.6;background:#f3f4f6;padding:12px 16px;border-radius:8px;margin:12px 0;">
      ${escapeHtml(truncate(args.commentPreview, 200))}
    </p>
    ${ctaButton(args.requestUrl, "View the conversation")}`;
}

export function chatReplyEmailBody(args: {
  actorName: string;
  cityName: string;
  preview: string;
  chatUrl: string;
}): string {
  return `<p style="font-size:15px;line-height:1.6;">
      <strong>${escapeHtml(args.actorName)}</strong> just posted in the
      ${escapeHtml(args.cityName)} chat:
    </p>
    <p style="font-size:15px;line-height:1.6;background:#f3f4f6;padding:12px 16px;border-radius:8px;margin:12px 0;">
      ${escapeHtml(truncate(args.preview, 200))}
    </p>
    ${ctaButton(args.chatUrl, "Join the conversation")}`;
}

export function dmEmailBody(args: {
  senderName: string;
  preview: string;
  dmUrl: string;
}): string {
  return `<p style="font-size:15px;line-height:1.6;">
      <strong>${escapeHtml(args.senderName)}</strong> sent you a message:
    </p>
    <p style="font-size:15px;line-height:1.6;background:#f3f4f6;padding:12px 16px;border-radius:8px;margin:12px 0;">
      ${escapeHtml(truncate(args.preview, 200))}
    </p>
    ${ctaButton(args.dmUrl, "Reply")}`;
}

export function founderAlertBody(args: {
  what: string;
  content: string;
  where: string;
  url: string;
}): string {
  return `<p style="font-size:15px;line-height:1.6;"><strong>${escapeHtml(args.what)}</strong> in ${escapeHtml(args.where)}</p>
    <p style="font-size:15px;line-height:1.6;background:#f3f4f6;padding:12px 16px;border-radius:8px;margin:12px 0;white-space:pre-wrap;">
      ${escapeHtml(truncate(args.content, 500))}
    </p>
    <p style="font-size:14px;"><a href="${args.url}" style="color:#16a34a;">Open</a></p>`;
}
