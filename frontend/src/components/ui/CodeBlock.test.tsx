/**
 * Unit tests for CodeBlock component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

import CodeBlock from './CodeBlock';

describe('CodeBlock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Clean up clipboard mock between tests to avoid read-only assignment issues
    try {
      // @ts-expect-error test cleanup
      delete (navigator as any).clipboard;
    } catch {
      /* noop */
    }
  });

  describe('Rendering', () => {
    it('should render code content', () => {
      const code = 'const hello = "world";';
      render(<CodeBlock>{code}</CodeBlock>);

      expect(screen.getByText(code)).toBeInTheDocument();
    });

    it('should render with language label', () => {
      const code = 'const hello = "world";';
      render(<CodeBlock language="typescript">{code}</CodeBlock>);

      expect(screen.getByText(/typescript/i)).toBeInTheDocument();
    });

    it('should render with custom title', () => {
      const code = 'const hello = "world";';
      render(<CodeBlock title="Example Code">{code}</CodeBlock>);

      expect(screen.getByText('Example Code')).toBeInTheDocument();
    });

    it('should render copy button', () => {
      const code = 'const hello = "world";';
      render(<CodeBlock>{code}</CodeBlock>);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      expect(copyButton).toBeInTheDocument();
    });

    it('should render with line numbers when enabled', () => {
      const code = 'line 1\nline 2\nline 3';
      render(<CodeBlock showLineNumbers>{code}</CodeBlock>);

      const codeBlock = screen.getByTestId('code-block');
      expect(codeBlock).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const code = 'const hello = "world";';
      render(<CodeBlock className="custom-class">{code}</CodeBlock>);

      const codeBlock = screen.getByTestId('code-block');
      expect(codeBlock).toHaveClass('custom-class');
    });
  });

  describe('Copy Functionality', () => {
    it('should copy code to clipboard when copy button clicked', async () => {
      const code = 'const hello = "world";';

      // Mock clipboard API (navigator.clipboard is read-only in JSDOM)
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        configurable: true,
      });

      render(<CodeBlock>{code}</CodeBlock>);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalledWith(code);
      });
    });

    it('should show "Copied!" message after successful copy', async () => {
      const code = 'const hello = "world";';

      // Mock clipboard API (navigator.clipboard is read-only in JSDOM)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
        configurable: true,
      });

      render(<CodeBlock>{code}</CodeBlock>);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText(/copied/i)).toBeInTheDocument();
      });
    });

    it('should reset "Copied!" message after 2 seconds', async () => {
      vi.useFakeTimers();

      const code = 'const hello = "world";';

      // Mock clipboard API (navigator.clipboard is read-only in JSDOM)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
        configurable: true,
      });

      render(<CodeBlock>{code}</CodeBlock>);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      // Flush microtasks from the async onClick handler
      await act(async () => {
        await Promise.resolve();
      });
      expect(screen.getByText(/copied/i)).toBeInTheDocument();

      // Fast-forward 2 seconds
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.queryByText(/copied/i)).not.toBeInTheDocument();

      vi.useRealTimers();
    });

    it('should handle clipboard API errors gracefully', async () => {
      const code = 'const hello = "world";';
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock clipboard API to throw error (navigator.clipboard is read-only in JSDOM)
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockRejectedValue(new Error('Clipboard error')) },
        configurable: true,
      });

      render(<CodeBlock>{code}</CodeBlock>);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to copy code:', expect.any(Error));
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Language Detection', () => {
    it('should display language from language prop', () => {
      const code = 'const hello = "world";';
      render(<CodeBlock language="javascript">{code}</CodeBlock>);

      expect(screen.getByText(/javascript/i)).toBeInTheDocument();
    });

    it('should extract language from className', () => {
      const code = 'const hello = "world";';
      render(<CodeBlock className="language-python">{code}</CodeBlock>);

      expect(screen.getByText(/python/i)).toBeInTheDocument();
    });

    it('should prioritize language prop over className', () => {
      const code = 'const hello = "world";';
      render(
        <CodeBlock language="typescript" className="language-javascript">
          {code}
        </CodeBlock>
      );

      expect(screen.getByText(/typescript/i)).toBeInTheDocument();
      expect(screen.queryByText(/javascript/i)).not.toBeInTheDocument();
    });

    it('should not display language label when not provided', () => {
      const code = 'const hello = "world";';
      render(<CodeBlock>{code}</CodeBlock>);

      // Should only have copy button, no language label
      const header = screen
        .getByTestId('code-block')
        .querySelector('.flex.items-center.justify-between');
      expect(header?.textContent).not.toMatch(/^(javascript|typescript|python)$/i);
    });
  });

  describe('Multi-line Code', () => {
    it('should render multi-line code correctly', () => {
      const code = `function hello() {
  console.log("Hello, world!");
  return true;
}`;
      render(<CodeBlock>{code}</CodeBlock>);

      expect(screen.getByText(/function hello/)).toBeInTheDocument();
      expect(screen.getByText(/console.log/)).toBeInTheDocument();
      expect(screen.getByText(/return true/)).toBeInTheDocument();
    });

    it('should preserve whitespace and indentation', () => {
      const code = `  indented line
    more indented
  back to first level`;
      render(<CodeBlock>{code}</CodeBlock>);

      const pre = screen.getByTestId('code-block').querySelector('pre');
      expect(pre?.textContent).toContain('  indented line');
      expect(pre?.textContent).toContain('    more indented');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible copy button', () => {
      const code = 'const hello = "world";';
      render(<CodeBlock>{code}</CodeBlock>);

      const copyButton = screen.getByRole('button', { name: /copy/i });
      expect(copyButton).toHaveAccessibleName();
    });

    it('should use semantic HTML elements', () => {
      const code = 'const hello = "world";';
      render(<CodeBlock>{code}</CodeBlock>);

      const pre = screen.getByTestId('code-block').querySelector('pre');
      const codeElement = pre?.querySelector('code');

      expect(pre).toBeInTheDocument();
      expect(codeElement).toBeInTheDocument();
    });

    it('should have proper ARIA attributes', () => {
      const code = 'const hello = "world";';
      render(<CodeBlock data-testid="custom-code-block">{code}</CodeBlock>);

      const codeBlock = screen.getByTestId('custom-code-block');
      expect(codeBlock).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty code', () => {
      render(<CodeBlock>{''}</CodeBlock>);

      const codeBlock = screen.getByTestId('code-block');
      expect(codeBlock).toBeInTheDocument();
    });

    it('should handle very long code', () => {
      const longCode = 'a'.repeat(10000);
      render(<CodeBlock>{longCode}</CodeBlock>);

      const codeBlock = screen.getByTestId('code-block');
      expect(codeBlock).toBeInTheDocument();
    });

    it('should handle special characters', () => {
      const code = '<script>alert("XSS")</script>';
      render(<CodeBlock>{code}</CodeBlock>);

      // Should render as text, not execute
      expect(screen.getByText(/<script>/)).toBeInTheDocument();
    });

    it('should handle unicode characters', () => {
      const code = 'const emoji = "🚀";';
      render(<CodeBlock>{code}</CodeBlock>);

      expect(screen.getByText(/🚀/)).toBeInTheDocument();
    });
  });
});
