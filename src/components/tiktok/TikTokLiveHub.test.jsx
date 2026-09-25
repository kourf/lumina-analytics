
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TikTokLiveHub from './TikTokLiveHub';
import { useTikTokLiveSocket } from '../../hooks/useTikTokLiveSocket';

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
    // Setup mock hook to return offline state
    useTikTokLiveSocket.mockReturnValue({
      isSocketConnected: false,
      isLive: false,
      metrics: {}
    });

    // Setup mock firestore to return empty archives
    mockGetDocs.mockResolvedValueOnce({
      docs: [],
    });

    render(<TikTokLiveHub liveData={{ isLive: false }} />);

    // Check basic render
    expect(screen.getByText('TikTok Live Hub')).toBeInTheDocument();
    expect(screen.getByText('HORS LIGNE')).toBeInTheDocument();

    // Check empty archives state
    await waitFor(() => {
      expect(screen.getByText(/Aucune archive disponible/)).toBeInTheDocument();
    });
  });

  it('renders "EN DIRECT" and live stats when live', async () => {
    // Setup mock hook to return live state
    useTikTokLiveSocket.mockReturnValue({
      isSocketConnected: true,
      isLive: true,
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

    // Check live state
    expect(screen.getByText('EN DIRECT')).toBeInTheDocument();

    // Check live data rendered correctly
    expect(screen.getByText('1.5k')).toBeInTheDocument(); // viewers formatted
    expect(screen.getByText('1.6k')).toBeInTheDocument(); // peak viewers
    // 25000 / 1000 = 25.0k due to toFixed(1)
    expect(screen.getByText('25.0k')).toBeInTheDocument(); // likes formatted
    expect(screen.getByText('500')).toBeInTheDocument(); // comments
    expect(screen.getByText('150')).toBeInTheDocument(); // new followers
    expect(screen.getByText('01:00')).toBeInTheDocument(); // duration
  });
});
