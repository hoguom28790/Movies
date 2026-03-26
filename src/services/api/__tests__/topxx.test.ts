// src/services/api/__tests__/topxx.test.ts
import { getTopXXDetails } from "../topxx";

// Mock fetch globally
global.fetch = jest.fn();

const mockFetch = (response: any, ok = true, status = 200) => {
  (global.fetch as jest.Mock).mockImplementationOnce(() =>
    Promise.resolve({
      ok,
      status,
      json: () => Promise.resolve(response),
    })
  );
};

describe('getTopXXDetails', () => {
  it('rewrites topxx.vip play link to stable streamxx.net URL', async () => {
    const mockMovie = {
      code: 'ABCDEFGHIJ',
      video_url: null,
      play_url: null,
      trans: [{ locale: 'vi', title: 'Test Movie' }],
      thumbnail: 'https://example.com/poster.jpg',
    };
    mockFetch({ status: 'success', data: mockMovie });
    const result = await getTopXXDetails('ABCDEFGHIJ');
    expect(result?.servers?.[0]?.episodes?.[0]?.link_embed).toBe(
      'https://embed.streamxx.net/player/ABCDEFGHIJ'
    );
  });

  it('falls back to AVDB when topxx API returns 404', async () => {
    // First fetch returns 404
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({ ok: false, status: 404 })
    );
    // Mock AVDB fallback search and detail
    const avdbSearchResult = { items: [{ id: 'avdb123' }], pagination: { totalItems: 1, totalPages: 1, currentPage: 1 } };
    const avdbDetail = { servers: [{ server: 'AVDB', episodes: [{ link: 'https://avdb.example/stream.m3u8' }] }] } as any;
    // Mock getAVDBMovies and getAVDBDetails via dynamic import
    jest.mock('../../../../src/services/api/avdb', () => ({
      getAVDBMovies: jest.fn().mockResolvedValue(avdbSearchResult),
      getAVDBDetails: jest.fn().mockResolvedValue(avdbDetail),
    }));
    const result = await getTopXXDetails('CODE123');
    expect(result?.servers?.some((s: any) => s.server === 'Backup VIP (AVDB)')).toBe(true);
  });
});
