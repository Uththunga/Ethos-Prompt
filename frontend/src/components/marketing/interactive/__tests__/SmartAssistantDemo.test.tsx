import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { SmartAssistantDemo } from '../SmartAssistantDemo';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

describe('SmartAssistantDemo', () => {
  it('renders the demo component with scenarios', () => {
    render(<SmartAssistantDemo />);

    // Check if the main title is present (allow styled/split text)
    expect(
      screen.getByRole('heading', { name: /Smart Business Assistant in Action/i })
    ).toBeInTheDocument();

    // Check if scenario buttons are present
    expect(screen.getByText('Customer Support')).toBeInTheDocument();
    expect(screen.getByText('Lead Qualification')).toBeInTheDocument();
    expect(screen.getByText('Appointment Booking')).toBeInTheDocument();
  });

  it('allows switching between scenarios', () => {
    render(<SmartAssistantDemo />);

    // Click on Lead Qualification scenario
    const leadQualificationButton = screen.getByText('Lead Qualification');
    fireEvent.click(leadQualificationButton);

    // Check if the button becomes active (has different styling)
    expect(leadQualificationButton.closest('button')).toHaveClass('border-ethos-purple');
  });

  it('starts demo when Start Demo button is clicked', async () => {
    render(<SmartAssistantDemo />);

    const startButton = screen.getByText('Start Demo');
    fireEvent.click(startButton);

    // Check if button text changes to indicate demo is running
    await waitFor(
      () => {
        expect(screen.getByText('Playing...')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('displays demo statistics', () => {
    render(<SmartAssistantDemo />);

    // Check if statistics are displayed
    expect(screen.getByText('87%')).toBeInTheDocument();
    expect(screen.getByText('Faster Response Times')).toBeInTheDocument();
    expect(screen.getByText('12x')).toBeInTheDocument();
    expect(screen.getByText('Cost Reduction')).toBeInTheDocument();
    expect(screen.getByText('35%')).toBeInTheDocument();
    expect(screen.getByText('More Conversions')).toBeInTheDocument();
    expect(screen.getByText('24/7')).toBeInTheDocument();
    expect(screen.getByText('Always Available')).toBeInTheDocument();
  });

  it('resets demo when reset button is clicked', async () => {
    render(<SmartAssistantDemo />);

    // First start the demo
    const startButton = screen.getByText('Start Demo');
    fireEvent.click(startButton);

    // Wait for demo to start
    await waitFor(
      () => {
        expect(screen.getByText('Playing...')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Find and click reset button (it's an icon button, not text)
    const resetButton = screen.getByRole('button', { name: /reset/i });
    fireEvent.click(resetButton);

    // Check if Start Demo button is available again
    await waitFor(() => {
      expect(screen.getByText('Start Demo')).toBeInTheDocument();
    });
  });
});
