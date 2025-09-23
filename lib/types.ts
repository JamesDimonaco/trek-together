export interface LocationData {
  city: string;
  state?: string;
  country: string;
  formattedAddress: string;
  location: {
    lat: number;
    lng: number;
  };
}

export interface SessionData {
  sessionId: string;
  userId?: string;
  username?: string;
  currentCity?: string;
  isAnonymous: boolean;
}

export type LocationStep = "initial" | "requesting" | "manual" | "confirming" | "username";