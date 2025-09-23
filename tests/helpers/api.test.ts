import {
  initializeSession,
  reverseGeocode,
  joinCity,
  getCurrentCity,
} from '@/lib/helpers/api'

// Simple setup
beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    })
  )
})

describe('API helpers', () => {
  it('should initialize session', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ sessionId: 'test-123' })
    })

    const result = await initializeSession()
    expect(result).toEqual({ sessionId: 'test-123' })
  })

  it('should handle reverse geocoding', async () => {
    const mockLocation = {
      city: 'San Francisco',
      country: 'United States',
      location: { lat: 37.7749, lng: -122.4194 }
    }

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockLocation)
    })

    const result = await reverseGeocode(37.7749, -122.4194)
    expect(result).toEqual(mockLocation)
  })

  it('should join city', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, redirectUrl: '/chat/123' })
    })

    const locationData = {
      city: 'Denver',
      country: 'United States',
      location: { lat: 39.7392, lng: -104.9903 }
    }

    const result = await joinCity(locationData)
    expect(result.success).toBe(true)
    expect(result.redirectUrl).toBe('/chat/123')
  })

  it('should get current city', async () => {
    const mockCity = { _id: 'city-123', name: 'Boulder' }
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, city: mockCity })
    })

    const result = await getCurrentCity()
    expect(result.city).toEqual(mockCity)
  })
})