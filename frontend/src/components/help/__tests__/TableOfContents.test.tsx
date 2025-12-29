/**
 * TableOfContents Component Tests
 * 
 * Tests for heading parsing, anchor generation, and navigation.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TableOfContents, { parseHeadings } from '../TableOfContents';

describe('parseHeadings', () => {
  it('parses markdown headings correctly', () => {
    const markdown = `
# Main Title
## Section 1
### Subsection 1.1
## Section 2
### Subsection 2.1
#### Deep Section
    `;

    const headings = parseHeadings(markdown, 3);

    expect(headings).toHaveLength(5); // Excludes h4 (level 4)
    expect(headings[0]).toEqual({
      id: 'main-title',
      text: 'Main Title',
      level: 1,
    });
    expect(headings[1]).toEqual({
      id: 'section-1',
      text: 'Section 1',
      level: 2,
    });
  });

  it('generates valid IDs from heading text', () => {
    const markdown = `
## Getting Started!
## API & Integration
## What's New?
    `;

    const headings = parseHeadings(markdown);

    expect(headings[0].id).toBe('getting-started');
    expect(headings[1].id).toBe('api-integration');
    expect(headings[2].id).toBe('whats-new');
  });

  it('respects maxLevel parameter', () => {
    const markdown = `
# Level 1
## Level 2
### Level 3
#### Level 4
##### Level 5
    `;

    const headings = parseHeadings(markdown, 2);

    expect(headings).toHaveLength(2);
    expect(headings.every((h) => h.level <= 2)).toBe(true);
  });

  it('handles empty content', () => {
    const headings = parseHeadings('');
    expect(headings).toHaveLength(0);
  });

  it('handles content without headings', () => {
    const markdown = 'Just some regular text without any headings.';
    const headings = parseHeadings(markdown);
    expect(headings).toHaveLength(0);
  });

  it('handles duplicate heading text', () => {
    const markdown = `
## Introduction
## Introduction
## Introduction
    `;

    const headings = parseHeadings(markdown);

    // All should have the same ID (browser will handle duplicates)
    expect(headings).toHaveLength(3);
    expect(headings.every((h) => h.id === 'introduction')).toBe(true);
  });
});

describe('TableOfContents', () => {
  const sampleContent = `
# Main Title
## Section 1
### Subsection 1.1
## Section 2
### Subsection 2.1
  `;

  it('renders table of contents', () => {
    render(<TableOfContents content={sampleContent} />);

    expect(screen.getByText('On This Page')).toBeInTheDocument();
    expect(screen.getByText('Main Title')).toBeInTheDocument();
    expect(screen.getByText('Section 1')).toBeInTheDocument();
  });

  it('does not render when no headings', () => {
    const { container } = render(<TableOfContents content="No headings here" />);
    expect(container.firstChild).toBeNull();
  });

  it('generates anchor links for headings', () => {
    render(<TableOfContents content={sampleContent} />);

    const link = screen.getByText('Section 1').closest('a');
    expect(link).toHaveAttribute('href', '#section-1');
  });

  it('applies sticky positioning when enabled', () => {
    const { container } = render(<TableOfContents content={sampleContent} sticky />);

    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('sticky');
  });

  it('has proper ARIA labels', () => {
    render(<TableOfContents content={sampleContent} />);

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Table of contents');
  });

  it('indents nested headings', () => {
    const { container } = render(<TableOfContents content={sampleContent} />);

    const subsection = screen.getByText('Subsection 1.1').closest('li');
    expect(subsection).toHaveStyle({ paddingLeft: '24px' }); // (3-1) * 12px
  });
});

