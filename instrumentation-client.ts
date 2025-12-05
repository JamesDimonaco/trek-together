import posthog from "posthog-js";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (typeof window !== "undefined" && posthogKey && posthogHost) {
  posthog.init(posthogKey, {
    api_host: posthogHost,
    person_profiles: "identified_only",
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    loaded: (posthog) => {
      if (process.env.NODE_ENV === "development") {
        posthog.debug();
      }
    },
  });
}

export { posthog };
