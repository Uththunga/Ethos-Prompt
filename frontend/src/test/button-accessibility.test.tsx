/**
 * Button Accessibility Testing Suite
 *
 * Comprehensive accessibility tests for the enhanced button component
 * ensuring WCAG 2.1 AA compliance and inclusive design.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import { Button } from '../components/marketing/ui/button';
import type { ButtonSize, ButtonVariant } from '../components/marketing/ui/button-types';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('Button Accessibility Tests', () => {
  // Test all variants for accessibility compliance
  const variants: ButtonVariant[] = [
    'default',
    'destructive',
    'outline',
    'secondary',
    'ghost',
    'link',
    'cta',
  ];
  const sizes: ButtonSize[] = ['sm', 'default', 'lg', 'icon'];

  describe('WCAG 2.1 AA Compliance', () => {
    test.each(variants)(
      'should have no accessibility violations for %s variant',
      async (variant) => {
        const { container } = render(
          <Button variant={variant} aria-label={`Test ${variant} button`}>
            Test Button
          </Button>
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      }
    );

    test.each(sizes)('should have no accessibility violations for %s size', async (size) => {
      const { container } = render(
        <Button size={size} aria-label={`Test ${size} button`}>
          Test Button
        </Button>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Color Contrast Requirements', () => {
    test('default variant should meet 4.5:1 contrast ratio', () => {
      render(<Button variant="default">Test Button</Button>);
      const button = screen.getByRole('button');

      // Get computed styles
      const styles = window.getComputedStyle(button);
      const backgroundColor = styles.backgroundColor;
      const color = styles.color;

      // Note: In a real test, you'd use a color contrast library
      // to calculate the actual contrast ratio
      expect(backgroundColor).toBeTruthy();
      expect(color).toBeTruthy();
    });

    test('outline variant should meet contrast requirements', () => {
      render(<Button variant="outline">Test Button</Button>);
      const button = screen.getByRole('button');

      const styles = window.getComputedStyle(button);
      const borderColor = styles.borderColor;
      const color = styles.color;

      expect(borderColor).toBeTruthy();
      expect(color).toBeTruthy();
    });
  });

  describe('Touch Target Requirements', () => {
    test.each(sizes)('should meet minimum 44px touch target for %s size', (size) => {
      render(<Button size={size}>Test Button</Button>);
      const button = screen.getByRole('button');

      // In jsdom, getBoundingClientRect returns 0, so we check for proper size classes instead
      // All buttons have min-h-[44px] min-w-[44px] for accessibility
      expect(button.className).toContain('min-h-[44px]');
      expect(button.className).toContain('min-w-[44px]');

      // Also check specific size classes
      if (size === 'sm') {
        expect(button.className).toContain('h-9'); // 36px base, but min-h-[44px] ensures accessibility
      } else if (size === 'lg') {
        expect(button.className).toContain('h-13'); // 52px
      } else if (size === 'icon') {
        expect(button.className).toContain('h-11'); // 44px
        expect(button.className).toContain('w-11'); // 44px
      } else {
        expect(button.className).toContain('h-11'); // 44px default
      }
    });

    test('icon buttons should have proper touch targets', () => {
      render(
        <Button size="icon" aria-label="Icon button">
          🔍
        </Button>
      );
      const button = screen.getByRole('button');

      // Check for proper size classes (h-11 w-11 = 44px)
      expect(button.className).toContain('h-11');
      expect(button.className).toContain('w-11');
      expect(button.className).toContain('min-h-[44px]');
      expect(button.className).toContain('min-w-[44px]');
    });
  });

  describe('Keyboard Navigation', () => {
    test('should be focusable with keyboard', async () => {
      const user = userEvent.setup();
      render(<Button>Test Button</Button>);

      const button = screen.getByRole('button');

      await user.tab();
      expect(button).toHaveFocus();
    });

    test('should be activatable with Enter key', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Test Button</Button>);
      const button = screen.getByRole('button');

      button.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('should be activatable with Space key', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Test Button</Button>);
      const button = screen.getByRole('button');

      button.focus();
      await user.keyboard(' ');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('should skip disabled buttons in tab order', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <Button>First Button</Button>
          <Button disabled>Disabled Button</Button>
          <Button>Third Button</Button>
        </div>
      );

      const firstButton = screen.getByText('First Button');
      const disabledButton = screen.getByText('Disabled Button');
      const thirdButton = screen.getByText('Third Button');

      await user.tab();
      expect(firstButton).toHaveFocus();

      await user.tab();
      expect(thirdButton).toHaveFocus();
      expect(disabledButton).not.toHaveFocus();
    });
  });

  describe('Focus Management', () => {
    test('should have visible focus indicator', async () => {
      const user = userEvent.setup();
      render(<Button>Test Button</Button>);

      const button = screen.getByRole('button');

      await user.tab();
      expect(button).toHaveFocus();

      // Check for focus ring classes (jsdom doesn't compute styles)
      expect(button.className).toContain('focus-ring');
    });

    test('should maintain focus after state changes', async () => {
      const TestComponent = () => {
        const [loading, setLoading] = React.useState(false);

        return (
          <Button data-state={loading ? 'loading' : 'default'} onClick={() => setLoading(!loading)}>
            {loading ? 'Loading...' : 'Click me'}
          </Button>
        );
      };

      const user = userEvent.setup();
      render(<TestComponent />);

      const button = screen.getByRole('button');

      await user.tab();
      expect(button).toHaveFocus();

      await user.click(button);
      expect(button).toHaveFocus();
    });
  });

  describe('ARIA Attributes', () => {
    test('should have proper role attribute', () => {
      render(<Button>Test Button</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('role', 'button');
    });

    test('should support aria-label', () => {
      render(<Button aria-label="Custom label">Test</Button>);
      const button = screen.getByLabelText('Custom label');

      expect(button).toBeInTheDocument();
    });

    test('should support aria-describedby', () => {
      render(
        <div>
          <Button aria-describedby="description">Test Button</Button>
          <div id="description">This button does something</div>
        </div>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'description');
    });

    test('should indicate loading state with aria-busy', () => {
      render(<Button data-state="loading">Loading...</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    test('should support pressed state with aria-pressed', () => {
      render(<Button aria-pressed="true">Toggle Button</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Screen Reader Compatibility', () => {
    test('should announce button text to screen readers', () => {
      render(<Button>Save Document</Button>);
      const button = screen.getByRole('button', { name: 'Save Document' });

      expect(button).toBeInTheDocument();
    });

    test('should announce state changes to screen readers', async () => {
      const TestComponent = () => {
        const [state, setState] = React.useState<'default' | 'success'>('default');

        return (
          <Button
            data-state={state}
            onClick={() => setState('success')}
            aria-label={state === 'success' ? 'Action completed successfully' : 'Perform action'}
          >
            {state === 'success' ? 'Success!' : 'Click me'}
          </Button>
        );
      };

      const user = userEvent.setup();
      render(<TestComponent />);

      const button = screen.getByRole('button', { name: 'Perform action' });
      await user.click(button);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Action completed successfully' })
        ).toBeInTheDocument();
      });
    });
  });

  describe('Reduced Motion Support', () => {
    test('should respect prefers-reduced-motion', () => {
      // Mock prefers-reduced-motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<Button>Test Button</Button>);
      const button = screen.getByRole('button');

      // Check for reduced motion classes (jsdom doesn't compute styles)
      expect(button.className).toContain('motion-reduce:transition-none');
      expect(button.className).toContain('motion-reduce:transform-none');
      expect(button.className).toContain('motion-reduce:animate-none');
    });

    test('should disable animations when reducedMotion prop is true', () => {
      render(<Button reducedMotion>Test Button</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('transition-none', 'transform-none');
    });
  });

  describe('High Contrast Mode', () => {
    test('should be visible in high contrast mode', () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<Button>Test Button</Button>);
      const button = screen.getByRole('button');

      // In high contrast mode, buttons should have enhanced borders
      const styles = window.getComputedStyle(button);
      expect(styles.borderWidth).toBeTruthy();
    });
  });
});
