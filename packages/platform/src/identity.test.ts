// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearStoredPlayerRoom,
  getStoredNickname,
  getStoredPlayerRoom,
  playerRoomStorageKey,
  setStoredNickname,
  setStoredPlayerRoom,
} from './identity'

beforeEach(() => {
  localStorage.clear()
})

describe('nickname', () => {
  it('round-trips through storage', () => {
    expect(getStoredNickname()).toBeNull()
    setStoredNickname('Alice')
    expect(getStoredNickname()).toBe('Alice')
  })

  it('is global — not scoped to a game slug', () => {
    setStoredNickname('Bob')
    expect(localStorage.getItem('games-platform:nickname')).toBe('Bob')
  })
})

describe('player room', () => {
  it('round-trips through storage, scoped per game slug', () => {
    expect(getStoredPlayerRoom('family-feud')).toBeNull()
    setStoredPlayerRoom('family-feud', 'ABCDEF')
    expect(getStoredPlayerRoom('family-feud')).toBe('ABCDEF')
    expect(getStoredPlayerRoom('weakest-link')).toBeNull()
  })

  it('uses a namespaced key per slug', () => {
    setStoredPlayerRoom('family-feud', 'ABCDEF')
    expect(localStorage.getItem(playerRoomStorageKey('family-feud'))).toBe('ABCDEF')
  })

  it('clears independently of other slugs', () => {
    setStoredPlayerRoom('family-feud', 'ABCDEF')
    setStoredPlayerRoom('weakest-link', 'ZZZZZZ')
    clearStoredPlayerRoom('family-feud')
    expect(getStoredPlayerRoom('family-feud')).toBeNull()
    expect(getStoredPlayerRoom('weakest-link')).toBe('ZZZZZZ')
  })
})

describe('storage failures', () => {
  it('degrades to "nothing remembered" instead of throwing when localStorage is unavailable', () => {
    const getSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const setSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const removeSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked')
    })

    expect(() => setStoredNickname('Alice')).not.toThrow()
    expect(getStoredNickname()).toBeNull()
    expect(() => setStoredPlayerRoom('family-feud', 'ABCDEF')).not.toThrow()
    expect(getStoredPlayerRoom('family-feud')).toBeNull()
    expect(() => clearStoredPlayerRoom('family-feud')).not.toThrow()

    getSpy.mockRestore()
    setSpy.mockRestore()
    removeSpy.mockRestore()
  })
})
