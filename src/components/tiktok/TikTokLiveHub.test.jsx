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
    const mockConnect = vi.fn();
    const mockDisconnect = vi.fn();

    useTikTokLiveSocket.mockReturnValue({
      isLive: false,
      liveData: {},
      chatMessages: [],
      connect: mockConnect,
      disconnect: mockDisconnect,
    });

    // Setup mock firestore to return empty archives
    mockGetDocs.mockResolvedValueOnce({
      docs: [],
    });

    render(<TikTokLiveHub />);

    // Check basic render
    expect(screen.getByText('TikTok Live Hub Central')).toBeInTheDocument();
    expect(screen.getByText('HORS LIGNE')).toBeInTheDocument();
    expect(screen.getByTestId('offline-state')).toBeInTheDocument();

    // Check that connect was called on mount
    expect(mockConnect).toHaveBeenCalled();

    // Check empty archives state
    await waitFor(() => {
      expect(screen.getByTestId('empty-archives')).toBeInTheDocument();
      expect(screen.getByText(/Les archives extraites/)).toBeInTheDocument();
    });
  });

  it('renders "DIFFUSION EN COURS" and live stats when live', async () => {
    // Setup mock hook to return live state
    useTikTokLiveSocket.mockReturnValue({
      isLive: true,
      liveData: {
        startedAt: '12:00',
        title: 'My Awesome Live Stream',
        kpis: {
          viewers: 1500,
          totalLikes: 25000,
        },
      },
      chatMessages: [
        { user: 'Alice', comment: 'Hello!' },
        { user: 'Bob', comment: 'Cool stream' },
      ],
      connect: vi.fn(),
      disconnect: vi.fn(),
    });

    // Setup mock firestore to return some archives
    mockGetDocs.mockResolvedValueOnce({
      docs: [
        {
          id: '1',
          data: () => ({ date: '2023-10-25', views: 500, shares: 10, followers: 5 }),
        },
        {
          id: '2',
          data: () => ({ date: '2023-10-26', viewers: 1000, shares: 20, followers: 15 }), // tests fallback mapping
        },
      ],
    });

    render(<TikTokLiveHub />);

    // Check live state
    expect(screen.getByText('DIFFUSION EN COURS')).toBeInTheDocument();
    expect(screen.getByTestId('live-supervision')).toBeInTheDocument();

    // Check live data rendered correctly
    expect(screen.getByText('My Awesome Live Stream')).toBeInTheDocument();
    expect(screen.getByText('Démarré à : 12:00')).toBeInTheDocument();
    expect(screen.getByText('1,500')).toBeInTheDocument(); // viewers formatted
    expect(screen.getByText('25,000')).toBeInTheDocument(); // likes formatted

    // Check chat messages rendered
    expect(screen.getByText('Alice :')).toBeInTheDocument();
    expect(screen.getByText('Hello!')).toBeInTheDocument();
    expect(screen.getByText('Bob :')).toBeInTheDocument();
    expect(screen.getByText('Cool stream')).toBeInTheDocument();

    // Check archives loaded
    await waitFor(() => {
      expect(screen.getByTestId('archives-grid')).toBeInTheDocument();
      expect(screen.getByText('2023-10-25')).toBeInTheDocument();
      expect(screen.getByText('2023-10-26')).toBeInTheDocument();
      // Check values mapped correctly from fallback properties
      expect(screen.getByText('500')).toBeInTheDocument();
      expect(screen.getByText('1000')).toBeInTheDocument();
    });
  });
});
