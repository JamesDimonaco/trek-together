import { currentUser } from "@clerk/nextjs/server";
import { convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { SessionData } from "@/lib/types";

/**
 * Resolve session data on the server side (for Server Components).
 * Avoids the client-side fetch + double-render that happens with useEffect.
 */
export async function getServerSession(): Promise<SessionData> {
  try {
    const user = await currentUser();
    if (user) {
      const convexUser = await convex.query(api.users.getUserByAuthId, {
        authId: user.id,
      });
      if (convexUser) {
        return {
          sessionId: convexUser._id,
          userId: convexUser._id,
          username: convexUser.username,
          isAnonymous: false,
          isAuthenticated: true,
        };
      }
    }
  } catch (error) {
    console.error("Failed to get server session:", error);
  }
  return {
    sessionId: "",
    userId: undefined,
    username: undefined,
    isAnonymous: true,
    isAuthenticated: false,
  };
}
