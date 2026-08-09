import { describe, expect, it } from 'vitest'
import { nicknameIcon, nicknameWithIcon } from './nicknameIcon'

describe('nicknameIcon', () => {
  it('matches star aliases case- and spacing-insensitively', () => {
    expect(nicknameIcon('Kom')).toBe('⭐')
    expect(nicknameIcon('K Dawg')).toBe('⭐')
    expect(nicknameIcon('k-dawg')).toBe('⭐')
    expect(nicknameIcon('KDAWG')).toBe('⭐')
    expect(nicknameIcon('Starfish')).toBe('⭐')
  })

  it('matches cowboy aliases case- and spacing-insensitively', () => {
    expect(nicknameIcon('RC')).toBe('🤠')
    expect(nicknameIcon('rc')).toBe('🤠')
    expect(nicknameIcon('Cowgirl')).toBe('🤠')
    expect(nicknameIcon('Cowboy')).toBe('🤠')
  })

  it('returns null for unrelated names', () => {
    expect(nicknameIcon('Sam')).toBeNull()
    expect(nicknameIcon('Star Wars fan')).toBeNull()
    expect(nicknameIcon('')).toBeNull()
  })
})

describe('nicknameWithIcon', () => {
  it('prefixes the icon when matched', () => {
    expect(nicknameWithIcon('Kom')).toBe('⭐ Kom')
    expect(nicknameWithIcon('RC')).toBe('🤠 RC')
  })

  it('returns the nickname unchanged when unmatched', () => {
    expect(nicknameWithIcon('Sam')).toBe('Sam')
  })
})
