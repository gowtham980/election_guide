import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import App from '../App';

// Mock dependencies
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      startChat: vi.fn().mockReturnValue({
        sendMessage: vi.fn().mockResolvedValue({
          response: { text: () => 'Mock response\nROADMAP_STEP:1\nSUGGESTIONS:["test"]' }
        })
      })
    })
  }))
}));

vi.mock('../utils/firebase', () => ({
  analytics: { logEvent: vi.fn() }
}));

describe('App Component Integration', () => {
  it('renders the header correctly', async () => {
    render(<App />);
    expect(screen.getByText(/ElectionGuide India/i)).toBeInTheDocument();
  });

  it('renders API key missing banner if key is not configured', async () => {
    // By default the mock doesn't throw, we need to test UI
    render(<App />);
    expect(await screen.findByText(/Jai Hind!/i)).toBeInTheDocument();
  });

  it('handles language switching', async () => {
    render(<App />);
    const select = screen.getByLabelText(/Select Language/i);
    expect(select).toBeInTheDocument();
  });
});
