import {
  generateSessionId,
  generateAnonymousUsername,
  COOKIE_NAMES,
} from '@/lib/utils/session'

describe('Session utilities', () => {
  it('should generate session ID', () => {
    const sessionId = generateSessionId()
    expect(typeof sessionId).toBe('string')
    expect(sessionId.length).toBeGreaterThan(0)
  })

  it('should generate anonymous username', () => {
    const username = generateAnonymousUsername()
    expect(typeof username).toBe('string')
    expect(username).toMatch(/^[a-z-]+-[a-z-]+-\d+$/)
  })

  it('should export cookie names', () => {
    expect(COOKIE_NAMES.SESSION_ID).toBe('trek_session_id')
    expect(COOKIE_NAMES.USERNAME).toBe('trek_username')
    expect(COOKIE_NAMES.CURRENT_CITY).toBe('trek_current_city')
  })
})