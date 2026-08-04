import { describe, expect, it } from 'vitest'
import { generateRoomCode, isValidRoomCode, normalizeRoomCode } from './roomCode'

const AMBIGUOUS_CHARS = ['0', 'O', '1', 'I', 'L']

describe('generateRoomCode', () => {
  it('generates a 6-character code', () => {
    expect(generateRoomCode()).toHaveLength(6)
  })

  it('never includes visually ambiguous characters', () => {
    for (let i = 0; i < 50; i += 1) {
      const code = generateRoomCode()
      for (const ch of AMBIGUOUS_CHARS) {
        expect(code).not.toContain(ch)
      }
    }
  })

  it('produces different codes across calls', () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateRoomCode()))
    expect(codes.size).toBeGreaterThan(1)
  })
})

describe('normalizeRoomCode', () => {
  it('trims, uppercases, and strips internal whitespace', () => {
    expect(normalizeRoomCode('  ab c1 23  ')).toBe('ABC123')
  })

  it('is a no-op on an already-normalized code', () => {
    expect(normalizeRoomCode('ABC234')).toBe('ABC234')
  })
})

describe('isValidRoomCode', () => {
  it('accepts a valid 6-character code from the alphabet', () => {
    expect(isValidRoomCode('ABCDEF')).toBe(true)
  })

  it('accepts lowercase input by normalizing first', () => {
    expect(isValidRoomCode('abcdef')).toBe(true)
  })

  it('rejects the wrong length', () => {
    expect(isValidRoomCode('ABC')).toBe(false)
    expect(isValidRoomCode('ABCDEFG')).toBe(false)
  })

  it('rejects codes containing ambiguous characters', () => {
    expect(isValidRoomCode('ABCDE0')).toBe(false)
    expect(isValidRoomCode('ABCDEO')).toBe(false)
    expect(isValidRoomCode('ABCDE1')).toBe(false)
    expect(isValidRoomCode('ABCDEI')).toBe(false)
    expect(isValidRoomCode('ABCDEL')).toBe(false)
  })
})
