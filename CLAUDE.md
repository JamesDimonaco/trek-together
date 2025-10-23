# TrekTogether – Project Brief for Claude

## Overview

TrekTogether is a webapp that helps travelers connect in specific cities for trekking
and outdoor activities. The app provides **city-based group chats** (open to all) and
**private DMs** (for authenticated users).

**Current Status**: MVP Complete + Safety Features + Search & Discovery ✅
**Next Phase**: Production Readiness & Launch 🚀

Stack:

- **Frontend**: Next.js 16 (App Router) + shadcn/ui + Tailwind CSS
- **Backend/DB**: Convex (real-time database)
- **Auth**: Clerk (custom auth pages, no modals)
- **Hosting**: Vercel
- **Maps/Geo**: Google Maps API (geolocation + reverse geocoding)
- **Notifications**: Sonner (toast notifications)
- **Package Manager**: pnpm

Long term: Mobile app using React Native.

---

## Current Features (Built)

### 1. Landing & Location Detection ✅
- Hero section with "Find trekkers near you" CTA
- Browser geolocation → Google Maps API reverse geocoding → nearest city
- Dynamic city creation if not in database
- Shows "X trekkers online now" badge with real-time count
- Anonymous username prompt (adjective-animal-number format)

### 2. City Group Chat ✅
- **Public access** - No auth required to view/participate
- Real-time chat via Convex subscriptions
- Guest users assigned `session_id` + random username (e.g. `curious-otter-43`)
- Shows active user count (users active in last 10 minutes)
- **Message features**:
  - Clickable usernames → profile pages
  - Report/Block actions on hover (authenticated users only)
  - Auto-scroll to latest message
  - Filters out blocked users' messages automatically

### 3. Authentication (Clerk) ✅
- Custom `/sign-in` and `/sign-up` pages (not modals)
- Required for DMs, Profiles, Messages inbox
- Username sync from Clerk → Convex
- Anonymous → authenticated migration support
- Session persistence across page loads

### 4. User Profiles ✅
- **View profile**: `/profile/[userId]` (public route)
  - Username, avatar, bio, WhatsApp number (optional)
  - Date of birth (displays calculated age)
  - Location (where user is from)
  - Cities visited list
  - "Send Message" button (opens DM)
  - "Edit Profile" for own profile
- **Edit profile**: `/profile/edit` (auth required)
  - Avatar upload (max 5MB) with preview
  - Username, bio, WhatsApp, date of birth, location fields
  - Stored in Convex storage
- Uses Next.js Image component with Clerk and Convex domains configured

### 5. Direct Messages (DMs) ✅
- **DM Chat**: `/dm/[userId]` (auth required)
  - 1-on-1 private messaging
  - Real-time updates via Convex
  - Enter to send, Shift+Enter for new line
  - Report/Block actions available
  - Block check prevents messaging blocked users
- **Messages Inbox**: `/messages` (auth required)
  - List of all conversations
  - Last message preview (truncated)
  - Smart timestamps (time/day/date)
  - Excludes blocked users automatically
  - Empty state with CTA to browse cities
- Guests see AuthPromptModal with link to `/sign-in`

### 6. Safety & Moderation ✅
- **Report System**:
  - Report users from city chat or DMs
  - Predefined reasons (spam, harassment, inappropriate, scam, other)
  - Optional description field
  - Stored in `reports` table for admin review
- **Block/Unblock**:
  - Block users from message actions
  - Blocked users filtered from chat and inbox
  - Cannot send/receive DMs when blocked
  - Unblock from Settings page
- **Settings Page**: `/settings`
  - Manage blocked users list
  - Unblock with confirmation dialog
  - Shows block date
- Toast notifications for all actions

### 7. SEO & Discoverability ✅
- Dynamic metadata per city page
- Sitemap generation (`/sitemap.xml`) - auto-includes all cities
- Robots.txt configuration
- Open Graph and Twitter Card tags
- Canonical URLs
- Keywords optimization

### 8. Error Handling & UX ✅
- Global error boundary (`app/error.tsx`)
- Loading states (`app/loading.tsx`)
- Custom 404 page
- Sonner toast notifications throughout
- Form validation and error messages
- Loading spinners for async actions

### 9. Search & Discovery ✅
- **Browse Cities**: `/cities`
  - Search by city name or country
  - Live active user count per city
  - Sorted by most active cities
  - Mobile-responsive grid layout
  - Direct links to city chats
- **Find Trekkers**: `/users`
  - Search users by username (min 2 characters)
  - Shows avatar, bio, location
  - Direct links to user profiles
  - Mobile-friendly list view
- **Navigation**: Icon-based navigation in header (mobile-optimized)
- **Convex Queries**:
  - `searchCities` - filter cities by name/country
  - `getCitiesWithActiveUsers` - cities with real-time active counts
  - `searchUsers` - find authenticated users by username

---

## Convex Schema (Current Implementation)

```ts
// convex/schema.ts
export default defineSchema({
  users: defineTable({
    authId: v.optional(v.string()),        // Clerk ID (undefined if guest)
    sessionId: v.optional(v.string()),     // Identifier for guests
    username: v.string(),
    avatarUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    whatsappNumber: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),   // User's date of birth (ISO format)
    location: v.optional(v.string()),      // Where user is from (city, country)
    citiesVisited: v.array(v.id("cities")), // List of city IDs
    currentCityId: v.optional(v.id("cities")), // Current/last active city
    lastSeen: v.optional(v.number()),      // Timestamp of last activity
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

  blocked_users: defineTable({
    blockerId: v.id("users"),           // User who blocked
    blockedId: v.id("users"),           // User who was blocked
    reason: v.optional(v.string()),     // Optional reason
  })
    .index("by_blocker", ["blockerId"])
    .index("by_blocked", ["blockedId"])
    .index("by_blocker_and_blocked", ["blockerId", "blockedId"]),

  reports: defineTable({
    reporterId: v.id("users"),              // User reporting
    reportedUserId: v.id("users"),          // User being reported
    messageId: v.optional(v.string()),      // Message ID being reported
    messageType: v.optional(v.union(        // Type of message
      v.literal("city_message"),
      v.literal("dm")
    )),
    reason: v.string(),                     // Report reason
    description: v.optional(v.string()),    // Additional details
    status: v.union(                        // Moderation status
      v.literal("pending"),
      v.literal("reviewed"),
      v.literal("resolved"),
      v.literal("dismissed")
    ),
  })
    .index("by_reporter", ["reporterId"])
    .index("by_reported_user", ["reportedUserId"])
    .index("by_status", ["status"]),
});
```

### Key Convex Files

- **`convex/users.ts`**: User CRUD, authentication sync, profile updates, active user tracking, user search
- **`convex/cities.ts`**: City CRUD, city search, active user counts per city
- **`convex/messages.ts`**: City chat messages (with blocked user filtering)
- **`convex/dms.ts`**: Direct messages (with block checks)
- **`convex/safety.ts`**: Block, unblock, report operations
- **`convex/files.ts`**: Avatar upload URL generation

---

## Route Structure

### Public Routes
- `/` - Landing page with location detection
- `/sign-in` - Clerk sign-in page
- `/sign-up` - Clerk sign-up page
- `/chat/[cityId]` - City chat room (public access)
- `/profile/[userId]` - User profile view (public access)
- `/cities` - Browse all cities with search
- `/users` - Search for trekkers by username

### Protected Routes (Auth Required)
- `/profile/edit` - Edit own profile
- `/dm/[userId]` - Direct message conversation
- `/messages` - DM inbox with conversation list
- `/settings` - Account settings (blocked users management)

### API Routes
- `/api/session` - Get current user session (auth + guest)
- `/api/current-city` - Get user's current/last city
- `/api/set-current-city` - Update user's current city
- `/api/webhooks/clerk` - Clerk user sync webhook

### Special Routes
- `/sitemap.xml` - Auto-generated sitemap
- `/robots.txt` - SEO crawling rules

---

## Development Guidelines

### Best Practices
- **Use pnpm**: Package manager of choice (`pnpm dlx shadcn@latest add <component>`)
- **shadcn/ui components**: Import via shadcn CLI, customize as needed
- **Convex patterns**:
  - Use mutations for writes
  - Use queries for reads (automatically reactive)
  - Index frequently queried fields
  - Filter blocked users in queries, not UI
- **Error handling**: Always use toast notifications (Sonner) for user feedback
- **Loading states**: Show loading spinners/skeletons for async operations
- **Route protection**: Middleware handles auth, but always verify in components
- **Mobile-first**: Test responsive design, keep UI accessible

### Code Style
- TypeScript strict mode
- Server Components by default, "use client" when needed
- Tailwind CSS for styling
- Lucide React for icons
- next/image for all images (configure domains in next.config.ts)

---

## 🚀 Production Readiness Checklist

### Legal & Compliance (CRITICAL)
- [ ] **Privacy Policy** (`/privacy`)
  - GDPR compliance (EU users)
  - CCPA compliance (California)
  - Data collection disclosure
  - Cookie usage explanation
  - Third-party services (Clerk, Convex, Google Maps, Vercel)
  - User rights (access, deletion, portability)
  - Contact information

- [ ] **Terms of Service** (`/terms`)
  - User responsibilities
  - Content guidelines
  - Account termination conditions
  - Limitation of liability
  - Dispute resolution
  - Age restrictions (13+ / 18+ depending on region)

- [ ] **Cookie Policy** (`/cookies`)
  - Essential vs. analytics cookies
  - Cookie consent banner (EU requirement)
  - How to opt-out
  - List of all cookies used

- [ ] **Footer Links**
  - Add Privacy, Terms, Cookies links to footer
  - Contact email / support page
  - Social media links (if applicable)

### SEO & Marketing
- [x] **Metadata** - Already configured in `app/layout.tsx` ✅
- [x] **Sitemap** - Auto-generated at `/sitemap.xml` ✅
- [x] **Robots.txt** - Configured ✅
- [ ] **Google Search Console Setup**
  - Submit sitemap
  - Verify ownership
  - Monitor indexing status
- [ ] **Google Analytics / Plausible**
  - Privacy-friendly analytics
  - Track user flows
  - Monitor conversion rates
- [ ] **Open Graph Image**
  - Create `/public/og-image.png` (1200x630)
  - Show app screenshot or branded image
- [ ] **Favicon & App Icons**
  - Multiple sizes for different devices
  - Apple touch icons
  - Manifest.json for PWA

### About & Transparency
- [ ] **About Page** (`/about`)
  - Who you are (solo developer)
  - Why you built TrekTogether
  - Mission: connect outdoor enthusiasts
  - Your trekking background
  - How the app works
  - Future vision
  - Contact/feedback email

- [ ] **FAQ Page** (optional but recommended)
  - How does location detection work?
  - Is it free?
  - How do I report abuse?
  - Can I delete my data?
  - Mobile app coming?

### Launch Strategy (Cold Start Problem)
**🎯 Target ONE City First** - Critical for success!

**Recommended first city criteria:**
- You have personal connections there
- Active outdoor/hiking community
- English-speaking (if targeting English first)
- Medium size (50k-500k population)

**Launch tactics:**
1. **In-person** (most effective):
   - Visit local hiking meetups
   - Outdoor gear shops (ask to put up flyers)
   - Climbing gyms / adventure sports centers
   - Hostel bulletin boards

2. **Online local communities**:
   - Reddit: r/[cityname], r/[cityname]hiking
   - Facebook: Local hiking groups
   - Instagram: Tag local outdoor influencers
   - Meetup.com: hiking/outdoor groups

3. **Content marketing**:
   - Blog post: "Best hiking spots near [city]"
   - Instagram: Photo stories of the city
   - Twitter: Share user stats as they grow

4. **Guerrilla marketing**:
   - Host a real trek using the app
   - Offer "founding member" badge
   - Referral incentives

**Success metrics before expanding:**
- 50+ registered users in first city
- 10+ daily active users
- 100+ messages per week

### Technical Production Checklist
- [ ] **Environment Variables**
  - Verify all production env vars in Vercel
  - Remove debug queries in production (already done ✅)

- [ ] **Error Monitoring**
  - Sentry or similar for production errors
  - Log critical failures
  - Alert on high error rates

- [ ] **Performance**
  - Lighthouse score >90
  - Core Web Vitals passing
  - Image optimization check
  - Lazy loading where needed

- [ ] **Security Audit**
  - All mutations have auth checks ✅ (already done)
  - All queries verify ownership ✅ (already done)
  - Rate limiting on API routes (partially done via Convex)
  - SQL injection prevention (N/A - using Convex)
  - XSS prevention (React default + CSP headers)

- [ ] **Backup & Data**
  - Convex automatic backups (verify enabled)
  - Export user data endpoint (GDPR requirement)
  - Data retention policy

- [ ] **Monitoring**
  - Uptime monitoring (UptimeRobot, BetterUptime)
  - Vercel Analytics ✅ (already enabled)
  - Database query performance

### Pre-Launch Testing
- [ ] **Mobile devices**
  - iPhone Safari
  - Android Chrome
  - Tablet layouts

- [ ] **Browsers**
  - Chrome, Firefox, Safari, Edge
  - Test all critical flows

- [ ] **User flows**
  - Anonymous user → city chat
  - Sign up → profile edit → DM
  - Report/block functionality
  - Mobile navigation

---

## Roadmap & Next Features

### ✅ Completed (MVP + Safety + Discovery)
- [x] Landing page + location detection
- [x] City group chat (anonymous + authenticated)
- [x] Authentication (Clerk custom pages)
- [x] User profiles (view + edit)
- [x] Direct messaging
- [x] DM inbox
- [x] Report/Block/Unblock system
- [x] Settings page
- [x] SEO (metadata, sitemap, robots.txt)
- [x] Error handling + toast notifications
- [x] Active user counter
- [x] Search & Discovery (browse cities, find trekkers)

### 🎯 High Priority (Next Up)
- [ ] **Anti-spam Measures**
  - Rate limiting on messages (per user per minute)
  - Captcha on sign-up (Cloudflare Turnstile)
  - Auto-mod flagging (excessive reports)
- [ ] **Notifications**
  - Unread DM badge count
  - Browser notifications (opt-in)
  - Email notifications for DMs (optional)
- [ ] **Maps Integration**
  - Interactive map showing cities visited
  - City location pins on profile
  - "Cities near me" feature

### 📋 Medium Priority
- [ ] **City Pages Enhancement**
  - City stats (total users, messages)
  - "Featured trekkers" section
  - Popular times to visit
- [ ] **User Verification**
  - Badge for verified trekkers
  - Social media link verification
- [ ] **Photo Sharing**
  - Upload trip photos to city chat
  - Image previews in messages
  - Photo gallery per city
- [ ] **Events/Meetups**
  - Create trekking events per city
  - RSVP system
  - Event calendar view

### 🎨 Polish & UX
- [ ] **Dark Mode Toggle** (currently system preference only)
- [ ] **Message Features**
  - Emoji reactions to messages
  - Typing indicators
  - Message read receipts (DMs)
  - Link previews
- [ ] **Profile Enhancements**
  - Profile completion percentage
  - "About me" rich text editor
  - Social links (Instagram, etc.)
  - User badges/achievements
- [ ] **Accessibility**
  - Keyboard navigation improvements
  - Screen reader optimization
  - ARIA labels audit

### 🔮 Future Considerations
- Mobile app (React Native)
- Push notifications
- Payment integration (premium features)
- Admin dashboard (report management)
- Multi-language support (i18n)
- Message search functionality
- Export conversation history
