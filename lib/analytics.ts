import posthog from "posthog-js";

// Safe capture wrapper - only tracks if PostHog is initialized
const safeCapture = (event: string, properties?: Record<string, unknown>) => {
  if (typeof window !== "undefined" && posthog.__loaded) {
    posthog.capture(event, properties);
  }
};

// Error capture for manual error logging (caught errors, API failures, etc.)
export const captureError = (
  error: Error | string,
  context?: {
    source?: string; // Where the error occurred (e.g., "dm_send", "profile_upload")
    userId?: string;
    extra?: Record<string, unknown>;
  }
) => {
  if (typeof window !== "undefined" && posthog.__loaded) {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;

    posthog.capture("$exception", {
      $exception_message: errorMessage,
      $exception_stack_trace_raw: errorStack,
      $exception_type: error instanceof Error ? error.name : "Error",
      $exception_source: context?.source || "manual",
      // Custom properties
      error_source: context?.source,
      user_id: context?.userId,
      ...context?.extra,
    });
  }
};

// Wrapper for async operations that captures errors
export const withErrorCapture = async <T>(
  fn: () => Promise<T>,
  source: string
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    captureError(error instanceof Error ? error : new Error(String(error)), {
      source,
    });
    throw error;
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

  // Country Chat
  countryJoined: (countryId: string, countryName: string, countrySlug: string) => {
    safeCapture("country_joined", { country_id: countryId, country_name: countryName, country_slug: countrySlug });
  },

  countryChatLinkClicked: (countryName: string, fromPage: string) => {
    safeCapture("country_chat_link_clicked", { country_name: countryName, from_page: fromPage });
  },

  messageSent: (type: "city" | "dm" | "country", locationId?: string) => {
    safeCapture("message_sent", { message_type: type, location_id: locationId });
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

  // Posts
  postCreated: (cityId: string, type: string) => {
    safeCapture("post_created", { city_id: cityId, post_type: type });
  },

  postViewed: (postId: string) => {
    safeCapture("post_viewed", { post_id: postId });
  },

  postLiked: (postId: string, liked: boolean) => {
    safeCapture("post_liked", { post_id: postId, liked });
  },

  postCommented: (postId: string) => {
    safeCapture("post_commented", { post_id: postId });
  },

  // Requests
  requestCreated: (cityId: string, activityType: string) => {
    safeCapture("request_created", { city_id: cityId, activity_type: activityType });
  },

  requestInterested: (requestId: string, interested: boolean) => {
    safeCapture("request_interested", { request_id: requestId, interested });
  },

  requestCommented: (requestId: string) => {
    safeCapture("request_commented", { request_id: requestId });
  },

  requestClosed: (requestId: string) => {
    safeCapture("request_closed", { request_id: requestId });
  },

  // PWA
  pwaInstallPromptShown: () => {
    safeCapture("pwa_install_prompt_shown");
  },

  pwaInstalled: () => {
    safeCapture("pwa_installed");
  },
};
