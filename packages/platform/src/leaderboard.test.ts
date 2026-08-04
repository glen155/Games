import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchRecentResults, recordGameResult } from './leaderboard'
import { getSupabase } from './supabase'

vi.mock('./supabase', () => ({
  getSupabase: vi.fn(),
}))

const mockedGetSupabase = vi.mocked(getSupabase)

afterEach(() => {
  vi.clearAllMocks()
})

describe('recordGameResult', () => {
  it('no-ops when multiplayer is not configured', async () => {
    mockedGetSupabase.mockReturnValue(null)
    await expect(recordGameResult('family-feud', 'room-1', { winner: 'Team 1' })).resolves.toBeUndefined()
  })

  it('inserts a row with the expected payload shape', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    const from = vi.fn(() => ({ insert }))
    mockedGetSupabase.mockReturnValue({ from } as never)

    await recordGameResult('family-feud', 'room-1', { winner: 'Team 1' })

    expect(from).toHaveBeenCalledWith('game_results')
    expect(insert).toHaveBeenCalledWith({
      room_id: 'room-1',
      game_slug: 'family-feud',
      summary: { winner: 'Team 1' },
    })
  })

  it('warns instead of throwing on a Supabase error', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const insert = vi.fn().mockResolvedValue({ error: { message: 'boom' } })
    mockedGetSupabase.mockReturnValue({ from: vi.fn(() => ({ insert })) } as never)

    await expect(recordGameResult('family-feud', 'room-1', {})).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalledWith('Failed to record game result:', 'boom')
    warn.mockRestore()
  })
})

describe('fetchRecentResults', () => {
  it('returns an empty array when multiplayer is not configured', async () => {
    mockedGetSupabase.mockReturnValue(null)
    await expect(fetchRecentResults()).resolves.toEqual([])
  })

  it('maps snake_case rows to the camelCase GameResult shape', async () => {
    const limit = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'r1',
          room_id: 'room-1',
          game_slug: 'family-feud',
          finished_at: '2026-01-01T00:00:00Z',
          summary: { winner: 'Team 1' },
        },
      ],
      error: null,
    })
    const order = vi.fn(() => ({ limit }))
    const select = vi.fn(() => ({ order }))
    mockedGetSupabase.mockReturnValue({ from: vi.fn(() => ({ select })) } as never)

    const results = await fetchRecentResults()

    expect(results).toEqual([
      {
        id: 'r1',
        roomId: 'room-1',
        gameSlug: 'family-feud',
        finishedAt: '2026-01-01T00:00:00Z',
        summary: { winner: 'Team 1' },
      },
    ])
    expect(order).toHaveBeenCalledWith('finished_at', { ascending: false })
    expect(limit).toHaveBeenCalledWith(50)
  })

  it('passes a custom limit through', async () => {
    const limit = vi.fn().mockResolvedValue({ data: [], error: null })
    mockedGetSupabase.mockReturnValue({
      from: vi.fn(() => ({ select: vi.fn(() => ({ order: vi.fn(() => ({ limit })) })) })),
    } as never)

    await fetchRecentResults(5)
    expect(limit).toHaveBeenCalledWith(5)
  })

  it('returns an empty array and warns on a Supabase error', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const limit = vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } })
    mockedGetSupabase.mockReturnValue({
      from: vi.fn(() => ({ select: vi.fn(() => ({ order: vi.fn(() => ({ limit })) })) })),
    } as never)

    await expect(fetchRecentResults()).resolves.toEqual([])
    expect(warn).toHaveBeenCalledWith('Failed to fetch game results:', 'boom')
    warn.mockRestore()
  })
})
