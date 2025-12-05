import posthog from "posthog-js";

// Safe capture wrapper - only tracks if PostHog is initialized
const safeCapture = (event: string, properties?: Record<string, unknown>) => {
  if (typeof window !== "undefined" && posthog.__loaded) {
    posthog.capture(event, properties);
  }
};

// Event tracking helper functions for PostHog analytics
export const analytics = {
  // Location & Onboarding
  locationDetected: (city: string, country: string, method: "auto" | "manual") => {
    safeCapture("location_detected", { city, country, method });
  },

  usernameChosen: (isAnonymous: boolean) => {
    safeCapture("username_chosen", { is_anonymous: isAnonymous });
  },

  // City Chat
  cityJoined: (cityId: string, cityName: string, country: string) => {
    safeCapture("city_joined", { city_id: cityId, city_name: cityName, country });
  },

  messageSent: (type: "city" | "dm", cityId?: string) => {
    safeCapture("message_sent", { message_type: type, city_id: cityId });
  },

  // Direct Messages
  dmConversationStarted: (receiverId: string) => {
    safeCapture("dm_conversation_started", { receiver_id: receiverId });
  },

  dmOpened: () => {
    safeCapture("dm_opened");
  },

  // Profile
  profileViewed: (profileUserId: string, isOwnProfile: boolean) => {
    safeCapture("profile_viewed", {
      profile_user_id: profileUserId,
      is_own_profile: isOwnProfile,
    });
  },

  profileEdited: (fieldsUpdated: string[]) => {
    safeCapture("profile_edited", { fields_updated: fieldsUpdated });
  },

  avatarUploaded: () => {
    safeCapture("avatar_uploaded");
  },

  // Search & Discovery
  citySearched: (query: string, resultsCount: number) => {
    safeCapture("city_searched", { query, results_count: resultsCount });
  },

  userSearched: (query: string, resultsCount: number) => {
    safeCapture("user_searched", { query, results_count: resultsCount });
  },

  // Safety & Moderation
  userReported: (reason: string) => {
    safeCapture("user_reported", { reason });
  },

  userBlocked: () => {
    safeCapture("user_blocked");
  },

  userUnblocked: () => {
    safeCapture("user_unblocked");
  },

  // Authentication
  signUpStarted: () => {
    safeCapture("signup_started");
  },

  signUpCompleted: () => {
    safeCapture("signup_completed");
  },

  signInCompleted: () => {
    safeCapture("signin_completed");
  },

  // Engagement
  sendMessageClicked: (fromPage: string) => {
    safeCapture("send_message_clicked", { from_page: fromPage });
  },

  cityChatLinkClicked: (cityName: string, fromPage: string) => {
    safeCapture("city_chat_link_clicked", { city_name: cityName, from_page: fromPage });
  },

  // Notifications
  notificationPreferenceChanged: (type: "email" | "browser", enabled: boolean) => {
    safeCapture("notification_preference_changed", { type, enabled });
  },
};
