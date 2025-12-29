import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, cleanup } from '@testing-library/react';
import { ScrollToTop } from '@/components/marketing/ui/ScrollToTop';

// Basic unit tests to verify marketing navigation scroll behavior

describe('ScrollToTop (marketing navigation)', () => {
  beforeEach(() => {
    cleanup();
    // @ts-expect-error - jsdom provides a stubbed window but we override for spying
    window.scrollTo = vi.fn();
    document.body.innerHTML = '';
  });

  it('scrolls to top when navigating to a marketing route without hash', () => {
    render(
      <MemoryRouter initialEntries={['/solutions']}>
        <ScrollToTop />
      </MemoryRouter>
    );

    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('does not alter scroll behavior on dashboard routes', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/prompts']}>
        <ScrollToTop />
      </MemoryRouter>
    );

    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it('scrolls to element when URL contains a hash', () => {
    const el = document.createElement('div');
    el.id = 'hero';
    // @ts-expect-error - allow mocking scrollIntoView
    el.scrollIntoView = vi.fn();
    document.body.appendChild(el);

    render(
      <MemoryRouter initialEntries={['/guides#hero']}>
        <ScrollToTop />
      </MemoryRouter>
    );

    expect((el as any).scrollIntoView).toHaveBeenCalled();
  });
});

