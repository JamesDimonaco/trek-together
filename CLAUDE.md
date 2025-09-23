# TrekTogether – Project Brief for Claude

## Overview

TrekTogether is a webapp that helps travelers connect in specific cities for trekking
and outdoor activities. The app provides **city-based group chats** (open to all) and
**private DMs** (for authenticated users).

Stack:

- **Frontend**: Next.js 14 + shadcn/ui
- **Backend/DB**: Convex
- **Auth + Payments**: Clerk
- **Hosting**: Vercel
- **Maps/Geo**: Google Maps API (geolocation + reverse geocoding)

Long term: Mobile app using React Native.

---

## MVP Scope

### User Flow

1. **Landing Page**

   - CTA: “Find trekkers near you”
   - Detects location (browser geolocation → Google Maps API → nearest city lookup)
   - If city not in DB → allow user to add (dynamic city creation)

2. **City Group Chat (No Auth Needed)**

   - Real-time chat via Convex
   - Each message persists in DB
   - Guest users:
     - Assigned `session_id` + random username (e.g. `curious-otter-43`)
     - Can chat anonymously
   - Show city occupancy: "12 trekkers currently here" (count active users in past 10min)

3. **Authentication (Clerk)**

   - Required for DMs and Profiles
   - Onboarding suggests a username (`FirstName` or random animal format)
   - Auth users can see their visited city history

4. **Profiles (Authed Only)**

   - Fields: username, avatar, bio, optional WhatsApp number
   - Saved in Convex
   - Display cities visited

5. **Direct Messages (Authed Only)**
   - User-to-user private chat stored in Convex
   - Guests see CTA to sign in

---

## Convex Schema (Proposed)

```ts
// USERS
users: {
  id: string
  auth_id: string | null      // Clerk ID (null if guest)
  session_id: string | null   // identifier for guests
  username: string
  avatar_url: string | null
  bio: string | null
  whatsapp_number: string | null
  cities_visited: string[]    // list of city_ids
  created_at: Date
}

// CITIES
cities: {
  id: string
  name: string
  country: string
  lat: number
  lng: number
  created_at: Date
}

// CITY MESSAGES
city_messages: {
  id: string
  city_id: string
  user_id: string | null
  session_id: string | null
  username: string
  content: string
  created_at: Date
}

// DMS
dms: {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: Date
}
```

---

## MVP Development Plan

### Step 1 – Setup

- Scaffold Next.js + shadcn/ui project
- Integrate Convex + Clerk (basic config, skip auth usage first)
- Deploy baseline to Vercel

### Step 2 – Cities + Location

- Implement `cities` table in Convex
- Use Google Maps API to:
  - Detect current location
  - Reverse geocode → nearest city
  - Query Convex → if missing, insert city

### Step 3 – Group Chat

- Convex mutation/query to `sendMessage(city_id, content, user/session info)`
- Convex live query for `getMessages(city_id)`
- Build chat UI (shadcn `Textarea` for input, `ScrollArea` for messages)
- Assign guest usernames with `adjective-animal-number` generator

### Step 4 – User Presence Count

- Track "active" users by update heartbeat (last_seen timestamp per user in city)
- Show count of users active in the last X minutes

### Step 5 – Authentication + Profiles

- Add Clerk login/signup
- Extend schema → save profile data
- Add profile editing UI (shadcn form)

### Step 6 – DMs (Auth Only)

- Convex schema for DMs
- New page/modal for DM threads
- Guest → see message "Sign in to start private chats"

---

## Example Convex Functions (City Chat)

```ts
// convex/messages.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Send message
export const sendMessage = mutation({
  args: {
    cityId: v.string(),
    content: v.string(),
    userId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("city_messages", {
      city_id: args.cityId,
      user_id: args.userId ?? null,
      session_id: args.sessionId ?? null,
      username: args.username,
      content: args.content,
      created_at: Date.now(),
    });
  },
});

// Subscribe to messages
export const getMessages = query({
  args: { cityId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("city_messages")
      .filter((q) => q.eq(q.field("city_id"), args.cityId))
      .order("desc")
      .take(50); // last 50 messages
  },
});
```

---

## Notes for Claude

- Always scaffold code in small steps, check Convex schema consistency
- Suggest UI with shadcn components, keep accessible + mobile friendly
- Save working deployable checkpoints early (Vercel preview URLs)
- Focus on speed of MVP over polish, expand later

---

## Next Tasks

1. [ ] Scaffold Next.js + Convex project
2. [ ] Create Convex schema (cities, users, city_messages)
3. [ ] Integrate Google Maps API for city detection
4. [ ] Basic anon group chat per city w/ random usernames
5. [ ] Show active users count

After MVP is live:

- [ ] Add Clerk auth
- [ ] Profiles + DMs
- [ ] Map + "cities you’ve visited"
- [ ] Anti-spam (rate limiting, captcha)
