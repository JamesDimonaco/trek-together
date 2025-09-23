import { nanoid } from 'nanoid';

// Generate a unique session ID
export function generateSessionId(): string {
  return nanoid(21); // 21 chars for good uniqueness
}

// Animal-based username generation
const adjectives = [
  'adventurous', 'brave', 'curious', 'daring', 'eager',
  'fearless', 'graceful', 'happy', 'intrepid', 'jolly',
  'keen', 'lively', 'mighty', 'nimble', 'outdoor',
  'peaceful', 'quick', 'resilient', 'spirited', 'swift',
  'trail', 'valiant', 'wandering', 'zealous', 'active'
];

const animals = [
  'alpaca', 'badger', 'bear', 'beaver', 'bison',
  'bobcat', 'caribou', 'cheetah', 'deer', 'eagle',
  'elk', 'falcon', 'fox', 'hawk', 'jaguar',
  'leopard', 'llama', 'lynx', 'moose', 'mountain-goat',
  'otter', 'panther', 'puma', 'rabbit', 'ram',
  'raven', 'squirrel', 'tiger', 'wolf', 'yak'
];

export function generateAnonymousUsername(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const number = Math.floor(Math.random() * 100);
  return `${adjective}-${animal}-${number}`;
}

// Cookie names
export const COOKIE_NAMES = {
  SESSION_ID: 'trek_session_id',
  USER_ID: 'trek_user_id',
  USERNAME: 'trek_username',
  CURRENT_CITY: 'trek_current_city',
} as const;