import '@testing-library/jest-dom'

// Mock environment variables
process.env.NEXT_PUBLIC_CONVEX_URL = 'https://test-convex-deployment.convex.cloud'
process.env.GOOGLE_MAPS_API_KEY = 'test-google-maps-key'
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'test-clerk-key'

// Mock nanoid to generate proper UUIDs
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => {
    // Generate a simple UUID-like string for testing
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }),
}))

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
  notFound: jest.fn(),
}))

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: null,
    isLoaded: true,
    isSignedIn: false,
  }),
  useClerk: () => ({
    openSignIn: jest.fn(),
    openSignUp: jest.fn(),
  }),
  currentUser: jest.fn(),
}))

// Mock Convex
jest.mock('convex/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}))

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
}

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
})

// Mock fetch
global.fetch = jest.fn()

// Global test utilities
global.mockFetch = (mockResponse) => {
  global.fetch.mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockResponse),
      text: () => Promise.resolve(JSON.stringify(mockResponse)),
    })
  )
}

global.mockFetchError = (error = 'Network error') => {
  global.fetch.mockImplementation(() => Promise.reject(new Error(error)))
}

// Make sure fetch is properly mocked by default
global.fetch.mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve('{}'),
  })
)

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
})