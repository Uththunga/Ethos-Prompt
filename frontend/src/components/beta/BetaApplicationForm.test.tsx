import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BetaApplicationForm } from './BetaApplicationForm';

// Mock fetch
beforeEach(() => {
  vi.spyOn(window, 'fetch').mockResolvedValue({ ok: true } as Response);
});

describe('BetaApplicationForm', () => {
  it('renders and validates required fields', async () => {
    render(<BetaApplicationForm />);

    // Submit without filling in
    fireEvent.click(screen.getByRole('button', { name: /submit beta application/i }));

    // Validation errors
    expect(await screen.findByText(/Email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Role is required/i)).toBeInTheDocument();
    expect(screen.getByText(/use case description is required/i)).toBeInTheDocument();
    expect(screen.getByText(/please tell us how you heard/i)).toBeInTheDocument();
    expect(screen.getByText(/you must agree to the terms/i)).toBeInTheDocument();
  });

  it('submits successfully when valid', async () => {
    render(<BetaApplicationForm />);

    fireEvent.change(screen.getByPlaceholderText(/your.email@company.com/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/john doe/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText(/content manager, developer/i), { target: { value: 'Developer' } });
    fireEvent.change(screen.getByPlaceholderText(/describe your specific use case/i), { target: { value: 'Testing the app' } });

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'Intermediate' } });
    fireEvent.change(selects[1], { target: { value: 'newsletter' } });

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /submit beta application/i }));

    // Should show success UI
    expect(await screen.findByText(/Application Submitted Successfully/i)).toBeInTheDocument();
  });
});

