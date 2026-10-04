import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TikTokLiveHub from './TikTokLiveHub';
import { useTikTokLiveSocket } from '../../hooks/useTikTokLiveSocket';

// Mock recharts ResponsiveContainer to avoid size measurement issues in jsdom
vi.mock('recharts', async () => {
  const originalModule = await vi.importActual('recharts');
  return {
    ...originalModule,
    ResponsiveContainer: ({ children }) => <div style={{ width: 500, height: 300 }}>{children}</div>,
  };
});

// Mock the hook
vi.mock('../../hooks/useTikTokLiveSocket', () => ({
  useTikTokLiveSocket: vi.fn(),
}));

// Mock Firebase config
vi.mock('../../config/firebase', () => ({
  db: {},
}));

// Mock Firestore functions
const mockGetDocs = vi.fn();
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: (...args) => mockGetDocs(...args),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
}));

describe('TikTokLiveHub Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "HORS LIGNE" when not live and fetches archives', async () => {
    useTikTokLiveSocket.mockReturnValue({
      isSocketConnected: false,
      isLive: false,
      metrics: {}
    });

    mockGetDocs.mockResolvedValueOnce({
      docs: [],
    });

    render(<TikTokLiveHub liveData={{ isLive: false }} />);

    expect(screen.getByText('Hub Live Streaming')).toBeInTheDocument();
    expect(screen.getByText('HORS LIGNE')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/0 sessions enregistrées/)).toBeInTheDocument();
    });
  });

  it('renders "EN DIRECT" and live stats when live with timeline data without ReferenceError', async () => {
    useTikTokLiveSocket.mockReturnValue({
      isSocketConnected: true,
      isLive: true,
      liveTimeline: [{ time: 1, viewers: 1200 }, { time: 2, viewers: 1500 }],
      metrics: {
        viewers: 1500,
        peakViewers: 1600,
        likes: 25000,
        comments: 500,
        durationStr: '01:00',
        newFollowers: 150,
      }
    });

    render(<TikTokLiveHub liveData={{ isLive: true }} />);

    expect(screen.getByText('EN DIRECT')).toBeInTheDocument();
    expect(screen.getByText('1.5k')).toBeInTheDocument();
    expect(screen.getByText(/1\.6k/)).toBeInTheDocument();
    expect(screen.getByText('25.0k')).toBeInTheDocument();
    expect(screen.getByText('Courbe de Rétention du Live')).toBeInTheDocument();
  });

  it('safely renders topQuestions with objects and topCommenters without crashing', async () => {
    useTikTokLiveSocket.mockReturnValue({
      isSocketConnected: false,
      isLive: true,
      metrics: {}
    });

    render(
      <TikTokLiveHub
        liveData={{
          isLive: true,
          topQuestions: [
            { original: 'Tu utilises Webflow ?', count: 3 },
            { text: 'Quel micro utilises-tu ?', count: 1 },
            'Question texte direct'
          ],
          topCommenters: [
            { name: 'AlexUI', count: 420, badge: 'Top 1' }
          ]
        }}
      />
    );

    expect(screen.getByText('EN DIRECT')).toBeInTheDocument();
    expect(screen.getByText(/"Tu utilises Webflow \?"/)).toBeInTheDocument();
    expect(screen.getByText(/"Quel micro utilises-tu \?"/)).toBeInTheDocument();
    expect(screen.getByText(/"Question texte direct"/)).toBeInTheDocument();
  });
});
