import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchIssueReports, reportIssue, setIssueReportReviewed } from './issueReports'
import { getSupabase } from './supabase'

vi.mock('./supabase', () => ({
  getSupabase: vi.fn(),
}))

const mockedGetSupabase = vi.mocked(getSupabase)

afterEach(() => {
  vi.clearAllMocks()
})

describe('reportIssue', () => {
  it('no-ops when multiplayer is not configured', async () => {
    mockedGetSupabase.mockReturnValue(null)
    await expect(reportIssue('music-timeline', 'track-1', 'Some Song', 'wrong year')).resolves.toBeUndefined()
  })

  it('inserts a row, defaulting roomId to null for solo play', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    const from = vi.fn(() => ({ insert }))
    mockedGetSupabase.mockReturnValue({ from } as never)

    await reportIssue('music-timeline', 'track-1', 'Some Song', 'wrong year')

    expect(from).toHaveBeenCalledWith('issue_reports')
    expect(insert).toHaveBeenCalledWith({
      room_id: null,
      game_slug: 'music-timeline',
      item_id: 'track-1',
      item_label: 'Some Song',
      reason: 'wrong year',
    })
  })

  it('passes a provided roomId through', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    mockedGetSupabase.mockReturnValue({ from: vi.fn(() => ({ insert })) } as never)

    await reportIssue('music-timeline', 'track-1', 'Some Song', 'wrong year', 'room-1')

    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ room_id: 'room-1' }))
  })

  it('warns instead of throwing on a Supabase error', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const insert = vi.fn().mockResolvedValue({ error: { message: 'boom' } })
    mockedGetSupabase.mockReturnValue({ from: vi.fn(() => ({ insert })) } as never)

    await expect(reportIssue('music-timeline', 'track-1', null, 'wrong year')).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalledWith('Failed to report issue:', 'boom')
    warn.mockRestore()
  })
})

describe('fetchIssueReports', () => {
  it('returns an empty array when multiplayer is not configured', async () => {
    mockedGetSupabase.mockReturnValue(null)
    await expect(fetchIssueReports()).resolves.toEqual([])
  })

  it('maps snake_case rows to the camelCase IssueReport shape, defaulting limit to 200', async () => {
    const limit = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'ir1',
          room_id: null,
          game_slug: 'music-timeline',
          item_id: 'track-1',
          item_label: 'Some Song',
          reason: 'wrong year',
          reported_at: '2026-01-01T00:00:00Z',
          reviewed: false,
        },
      ],
      error: null,
    })
    const order = vi.fn(() => ({ limit }))
    const select = vi.fn(() => ({ order }))
    mockedGetSupabase.mockReturnValue({ from: vi.fn(() => ({ select })) } as never)

    const results = await fetchIssueReports()

    expect(results).toEqual([
      {
        id: 'ir1',
        roomId: null,
        gameSlug: 'music-timeline',
        itemId: 'track-1',
        itemLabel: 'Some Song',
        reason: 'wrong year',
        reportedAt: '2026-01-01T00:00:00Z',
        reviewed: false,
      },
    ])
    expect(limit).toHaveBeenCalledWith(200)
  })

  it('returns an empty array and warns on a Supabase error', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const limit = vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } })
    mockedGetSupabase.mockReturnValue({
      from: vi.fn(() => ({ select: vi.fn(() => ({ order: vi.fn(() => ({ limit })) })) })),
    } as never)

    await expect(fetchIssueReports()).resolves.toEqual([])
    expect(warn).toHaveBeenCalledWith('Failed to fetch issue reports:', 'boom')
    warn.mockRestore()
  })
})

describe('setIssueReportReviewed', () => {
  it('no-ops when multiplayer is not configured', async () => {
    mockedGetSupabase.mockReturnValue(null)
    await expect(setIssueReportReviewed('ir1', true)).resolves.toBeUndefined()
  })

  it('updates the reviewed flag for the given id', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn(() => ({ eq }))
    mockedGetSupabase.mockReturnValue({ from: vi.fn(() => ({ update })) } as never)

    await setIssueReportReviewed('ir1', true)

    expect(update).toHaveBeenCalledWith({ reviewed: true })
    expect(eq).toHaveBeenCalledWith('id', 'ir1')
  })

  it('warns instead of throwing on a Supabase error', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const eq = vi.fn().mockResolvedValue({ error: { message: 'boom' } })
    mockedGetSupabase.mockReturnValue({ from: vi.fn(() => ({ update: vi.fn(() => ({ eq })) })) } as never)

    await expect(setIssueReportReviewed('ir1', false)).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalledWith('Failed to update issue report:', 'boom')
    warn.mockRestore()
  })
})
