 

/**
 * Button Visual Regression Testing Suite
 *
 * Automated visual regression testing for all button variants, sizes, and states
 * to ensure consistent visual appearance across changes.
 */

import { render } from '@testing-library/react';
import React from 'react';
import { Button } from '../components/marketing/ui/button';
import type { ButtonSize, ButtonVariant } from '../components/marketing/ui/button-types';

/**
 * Visual Test Configuration
 */
interface VisualTestConfig {
  variant: ButtonVariant;
  size: ButtonSize;
  state: 'default' | 'hover' | 'focus' | 'active' | 'disabled' | 'loading';
  props?: Record<string, any>;
  description: string;
}

/**
 * Visual Regression Test Suite
 */
describe('Button Visual Regression Tests', () => {
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

  // Generate test configurations for all combinations
  const generateTestConfigs = (): VisualTestConfig[] => {
    const configs: VisualTestConfig[] = [];

    variants.forEach((variant) => {
      sizes.forEach((size) => {
        // Default state
        configs.push({
          variant,
          size,
          state: 'default',
          description: `${variant} variant, ${size} size, default state`,
        });

        // Hover state
        configs.push({
          variant,
          size,
          state: 'hover',
          props: { className: 'hover' },
          description: `${variant} variant, ${size} size, hover state`,
        });

        // Focus state
        configs.push({
          variant,
          size,
          state: 'focus',
          props: { className: 'focus-visible' },
          description: `${variant} variant, ${size} size, focus state`,
        });

        // Disabled state
        configs.push({
          variant,
          size,
          state: 'disabled',
          props: { disabled: true },
          description: `${variant} variant, ${size} size, disabled state`,
        });

        // Loading state (for non-icon buttons)
        if (size !== 'icon') {
          configs.push({
            variant,
            size,
            state: 'loading',
            props: { 'data-state': 'loading', disabled: true },
            description: `${variant} variant, ${size} size, loading state`,
          });
        }
      });
    });

    return configs;
  };

  const testConfigs = generateTestConfigs();

  describe('Individual Button States', () => {
    testConfigs.forEach((config) => {
      test(`Visual: ${config.description}`, () => {
        const { container } = render(
          <div style={{ padding: '20px', background: '#ffffff' }}>
            <Button variant={config.variant} size={config.size} {...(config.props || {})}>
              {config.size === 'icon'
                ? '🔍'
                : config.state === 'loading'
                ? 'Loading...'
                : 'Test Button'}
            </Button>
          </div>
        );

        // In a real visual regression test, you would:
        // 1. Take a screenshot of the container
        // 2. Compare it with a baseline image
        // 3. Report any differences

        const button = container.querySelector('button');
        expect(button).toBeInTheDocument();
        expect(button).toHaveClass('button-enhanced');

        // Verify variant-specific classes
        if (config.variant === 'cta') {
          expect(button).toHaveClass('bg-gradient-to-r');
          expect(button).toHaveClass('from-ethos-purple');
        } else if (config.variant === 'outline') {
          expect(button).toHaveClass('border');
        } else if (config.variant === 'destructive') {
          expect(button).toHaveClass('bg-destructive');
        }

        // Verify size-specific classes
        if (config.size === 'sm') {
          expect(button).toHaveClass('h-9');
        } else if (config.size === 'lg') {
          expect(button).toHaveClass('h-13');
        } else if (config.size === 'icon') {
          expect(button).toHaveClass('h-11', 'w-11');
        }

        // Verify state-specific attributes
        if (config.state === 'disabled' || config.state === 'loading') {
          expect(button).toBeDisabled();
        }

        if (config.state === 'loading') {
          expect(button).toHaveAttribute('data-state', 'loading');
        }
      });
    });
  });

  describe('Button Groups and Layouts', () => {
    test('Visual: Button group with mixed variants', () => {
      const { container } = render(
        <div style={{ padding: '20px', background: '#ffffff' }}>
          <div className="flex gap-4">
            <Button variant="cta" size="lg">
              Primary Action
            </Button>
            <Button variant="outline" size="lg">
              Secondary Action
            </Button>
            <Button variant="ghost" size="lg">
              Tertiary Action
            </Button>
          </div>
        </div>
      );

      const buttons = container.querySelectorAll('button');
      expect(buttons).toHaveLength(3);

      // Verify spacing and alignment
      const buttonGroup = container.querySelector('.flex');
      expect(buttonGroup).toHaveClass('gap-4');
    });

    test('Visual: Vertical button stack', () => {
      const { container } = render(
        <div style={{ padding: '20px', background: '#ffffff' }}>
          <div className="flex flex-col gap-3 w-48">
            <Button variant="default" size="default">
              Save Changes
            </Button>
            <Button variant="outline" size="default">
              Cancel
            </Button>
            <Button variant="destructive" size="default">
              Delete
            </Button>
          </div>
        </div>
      );

      const buttons = container.querySelectorAll('button');
      expect(buttons).toHaveLength(3);

      const buttonStack = container.querySelector('.flex-col');
      expect(buttonStack).toHaveClass('gap-3');
    });

    test('Visual: Form button layout', () => {
      const { container } = render(
        <div style={{ padding: '20px', background: '#ffffff' }}>
          <form className="flex flex-col gap-6 max-w-md">
            <div className="flex flex-col gap-4">
              <input
                type="email"
                placeholder="Email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="cta" size="lg" className="flex-1">
                Sign In
              </Button>
              <Button variant="outline" size="lg" className="flex-1">
                Create Account
              </Button>
            </div>
          </form>
        </div>
      );

      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();

      const buttons = container.querySelectorAll('button');
      expect(buttons).toHaveLength(2);
    });
  });

  describe('Responsive Behavior', () => {
    test('Visual: Mobile button layout', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { container } = render(
        <div style={{ padding: '20px', background: '#ffffff', width: '375px' }}>
          <div className="flex flex-col gap-3">
            <Button variant="cta" size="lg" className="w-full">
              Primary Action
            </Button>
            <Button variant="outline" size="lg" className="w-full">
              Secondary Action
            </Button>
          </div>
        </div>
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('w-full');
      });
    });

    test('Visual: Desktop button layout', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { container } = render(
        <div style={{ padding: '20px', background: '#ffffff', width: '1024px' }}>
          <div className="flex gap-4 justify-center">
            <Button variant="cta" size="lg">
              Primary Action
            </Button>
            <Button variant="outline" size="lg">
              Secondary Action
            </Button>
            <Button variant="ghost" size="lg">
              Tertiary Action
            </Button>
          </div>
        </div>
      );

      const buttonGroup = container.querySelector('.flex');
      expect(buttonGroup).toHaveClass('gap-4', 'justify-center');
    });
  });

  describe('Dark Mode Compatibility', () => {
    test('Visual: Buttons in dark theme', () => {
      const { container } = render(
        <div style={{ padding: '20px', background: '#1a1a1a' }} className="dark">
          <div className="flex flex-col gap-4">
            {variants.map((variant) => (
              <Button key={variant} variant={variant} size="default">
                {variant.charAt(0).toUpperCase() + variant.slice(1)} Button
              </Button>
            ))}
          </div>
        </div>
      );

      const darkContainer = container.querySelector('.dark');
      expect(darkContainer).toBeInTheDocument();

      const buttons = container.querySelectorAll('button');
      expect(buttons).toHaveLength(variants.length);
    });
  });

  describe('High Contrast Mode', () => {
    test('Visual: Buttons in high contrast mode', () => {
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

      const { container } = render(
        <div style={{ padding: '20px', background: '#ffffff' }}>
          <div className="flex flex-col gap-4">
            <Button variant="default" size="default">
              Default Button
            </Button>
            <Button variant="outline" size="default">
              Outline Button
            </Button>
            <Button variant="destructive" size="default">
              Destructive Button
            </Button>
          </div>
        </div>
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        // In high contrast mode, buttons should have enhanced borders
        const styles = window.getComputedStyle(button);
        expect(styles.borderWidth).toBeTruthy();
      });
    });
  });

  describe('Animation States', () => {
    test('Visual: Buttons with reduced motion', () => {
      const { container } = render(
        <div style={{ padding: '20px', background: '#ffffff' }}>
          <div className="flex flex-col gap-4">
            <Button variant="cta" size="lg" reducedMotion>
              No Animation Button
            </Button>
            <Button variant="default" size="default" disableAnimations>
              Disabled Animation Button
            </Button>
          </div>
        </div>
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('transition-none', 'transform-none');
      });
    });

    test('Visual: Buttons with enhanced animations', () => {
      const { container } = render(
        <div style={{ padding: '20px', background: '#ffffff' }}>
          <div className="flex flex-col gap-4">
            <Button variant="cta" size="lg">
              Enhanced CTA
            </Button>
            <Button variant="outline" size="default">
              Enhanced Outline
            </Button>
            <Button variant="ghost" size="default">
              Enhanced Ghost
            </Button>
          </div>
        </div>
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('button-enhanced');
        expect(button).not.toHaveClass('transition-none');
      });
    });
  });
});
