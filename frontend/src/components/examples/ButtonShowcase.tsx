/**
 * Enhanced Button System Showcase
 *
 * Comprehensive examples demonstrating all enhanced button features,
 * variants, states, and use cases for the design system.
 */

import React, { useState } from 'react';
import { Button } from '../marketing/ui/button';
import type { ButtonVariant, ButtonSize } from '../marketing/ui/button-types';

/**
 * Button Variants Showcase
 */
export const ButtonVariantsShowcase: React.FC = () => {
  const variants: ButtonVariant[] = [
    'default',
    'destructive',
    'outline',
    'secondary',
    'ghost',
    'link',
    'cta',
  ];

  return (
    <div className="p-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Button Variants</h2>
        <p className="text-gray-600 mb-6">
          Each variant has unique hover effects and visual characteristics designed for specific use
          cases.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {variants.map((variant) => (
          <div key={variant}>
            <h3 className="font-semibold capitalize mb-2">{variant} Variant</h3>
            <div>
              <Button variant={variant} size="default" className="mb-2">
                {variant === 'cta'
                  ? 'Get Started'
                  : variant === 'destructive'
                  ? 'Delete'
                  : variant === 'link'
                  ? 'Learn More'
                  : `${variant.charAt(0).toUpperCase() + variant.slice(1)} Button`}
              </Button>
              <div className="text-sm text-gray-500">
                {variant === 'default' && 'Confident lift with purple shadow'}
                {variant === 'cta' && 'Premium magnetism with gradient'}
                {variant === 'destructive' && 'Warning intensity with red tint'}
                {variant === 'outline' && 'Elegant fill animation'}
                {variant === 'secondary' && 'Gentle emphasis with subtle lift'}
                {variant === 'ghost' && 'Whisper presence with backdrop blur'}
                {variant === 'link' && 'Elegant underline expansion'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Button Sizes Showcase
 */
export const ButtonSizesShowcase: React.FC = () => {
  const sizes: ButtonSize[] = ['sm', 'default', 'lg', 'icon'];

  return (
    <div className="p-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Button Sizes</h2>
        <p className="text-gray-600 mb-6">
          All sizes meet WCAG 2.1 AA touch target requirements with consistent hover effects.
        </p>
      </div>

      <div>
        {sizes.map((size, index) => (
          <div
            key={size}
            className={`flex items-center gap-4 ${index < sizes.length - 1 ? 'mb-4' : ''}`}
          >
            <div className="w-20 text-sm font-medium">
              {size === 'sm' && 'Small (36px)'}
              {size === 'default' && 'Default (44px)'}
              {size === 'lg' && 'Large (52px)'}
              {size === 'icon' && 'Icon (44x44px)'}
            </div>
            <Button variant="default" size={size}>
              {size === 'icon' ? '🔍' : `${size.charAt(0).toUpperCase() + size.slice(1)} Button`}
            </Button>
            <Button variant="cta" size={size}>
              {size === 'icon' ? '✨' : 'CTA Button'}
            </Button>
            <Button variant="outline" size={size}>
              {size === 'icon' ? '⚙️' : 'Outline Button'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Button States Showcase
 */
export const ButtonStatesShowcase: React.FC = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [successStates, setSuccessStates] = useState<Record<string, boolean>>({});

  const handleAsyncAction = async (buttonId: string) => {
    setLoadingStates((prev) => ({ ...prev, [buttonId]: true }));

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setLoadingStates((prev) => ({ ...prev, [buttonId]: false }));
    setSuccessStates((prev) => ({ ...prev, [buttonId]: true }));

    // Reset success state after 3 seconds
    setTimeout(() => {
      setSuccessStates((prev) => ({ ...prev, [buttonId]: false }));
    }, 3000);
  };

  return (
    <div className="p-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Button States</h2>
        <p className="text-gray-600 mb-6">
          Enhanced states with visual feedback and accessibility support.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Loading States */}
        <div>
          <h3 className="font-semibold mb-3">Loading States</h3>
          <div className="flex flex-col gap-3">
            <Button
              variant="default"
              data-state={loadingStates.save ? 'loading' : 'default'}
              disabled={loadingStates.save}
              onClick={() => handleAsyncAction('save')}
            >
              {loadingStates.save ? 'Saving...' : 'Save Document'}
            </Button>

            <Button
              variant="cta"
              data-state={loadingStates.submit ? 'loading' : 'default'}
              disabled={loadingStates.submit}
              onClick={() => handleAsyncAction('submit')}
            >
              {loadingStates.submit ? 'Processing...' : 'Submit Form'}
            </Button>
          </div>
        </div>

        {/* Success States */}
        <div>
          <h3 className="font-semibold mb-3">Success States</h3>
          <div className="flex flex-col gap-3">
            <Button variant="default" data-state={successStates.save ? 'success' : 'default'}>
              {successStates.save ? '✓ Saved!' : 'Save Document'}
            </Button>

            <Button variant="cta" data-state={successStates.submit ? 'success' : 'default'}>
              {successStates.submit ? '✓ Submitted!' : 'Submit Form'}
            </Button>
          </div>
        </div>

        {/* Disabled States */}
        <div>
          <h3 className="font-semibold mb-3">Disabled States</h3>
          <div className="flex flex-col gap-3">
            <Button variant="default" disabled>
              Disabled Button
            </Button>

            <Button variant="cta" disabled>
              Disabled CTA
            </Button>

            <Button variant="destructive" disabled>
              Disabled Delete
            </Button>
          </div>
        </div>

        {/* Error States */}
        <div>
          <h3 className="font-semibold mb-3">Error States</h3>
          <div className="flex flex-col gap-3">
            <Button variant="destructive" data-state="error">
              ⚠️ Error Occurred
            </Button>

            <Button variant="outline" data-state="error">
              ⚠️ Validation Failed
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Accessibility Features Showcase
 */
export const AccessibilityShowcase: React.FC = () => {
  const [reducedMotion, setReducedMotion] = useState(false);

  return (
    <div className="p-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Accessibility Features</h2>
        <p className="text-gray-600 mb-6">
          WCAG 2.1 AA compliant with enhanced accessibility features.
        </p>
      </div>

      <div>
        {/* Reduced Motion */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="font-semibold">Reduced Motion Support</h3>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Enable Reduced Motion</span>
            </label>
          </div>

          <div className="flex gap-4">
            <Button variant="default" reducedMotion={reducedMotion}>
              Default Button
            </Button>
            <Button variant="cta" reducedMotion={reducedMotion}>
              CTA Button
            </Button>
            <Button variant="outline" reducedMotion={reducedMotion}>
              Outline Button
            </Button>
          </div>
        </div>

        {/* ARIA Labels */}
        <div className="mb-8">
          <h3 className="font-semibold mb-3">ARIA Labels & Descriptions</h3>
          <div>
            <div className="mb-4">
              <Button
                variant="default"
                size="icon"
                aria-label="Search products"
                aria-describedby="search-help"
                className="mb-2"
              >
                🔍
              </Button>
              <div id="search-help" className="text-sm text-gray-500">
                Search through our product catalog
              </div>
            </div>

            <div>
              <Button
                variant="destructive"
                aria-label="Delete user account permanently"
                aria-describedby="delete-warning"
                className="mb-2"
              >
                Delete Account
              </Button>
              <div id="delete-warning" className="text-sm text-red-600">
                This action cannot be undone
              </div>
            </div>
          </div>
        </div>

        {/* Keyboard Navigation */}
        <div className="mb-8">
          <h3 className="font-semibold mb-2">Keyboard Navigation</h3>
          <p className="text-sm text-gray-600 mb-4">
            Try tabbing through these buttons and activating with Enter or Space
          </p>
          <div className="flex gap-4">
            <Button variant="default" tabIndex={0}>
              First Button
            </Button>
            <Button variant="outline" tabIndex={0}>
              Second Button
            </Button>
            <Button variant="cta" tabIndex={0}>
              Third Button
            </Button>
          </div>
        </div>

        {/* Focus Management */}
        <div>
          <h3 className="font-semibold mb-2">Enhanced Focus Indicators</h3>
          <p className="text-sm text-gray-600 mb-4">
            Focus these buttons to see enhanced focus rings
          </p>
          <div className="flex gap-4">
            <Button variant="default">Default Focus</Button>
            <Button variant="destructive">Destructive Focus</Button>
            <Button variant="secondary">Secondary Focus</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Real-world Use Cases Showcase
 */
export const UseCasesShowcase: React.FC = () => {
  return (
    <div className="p-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Real-world Use Cases</h2>
        <p className="text-gray-600 mb-6">
          Common button patterns and combinations used in production applications.
        </p>
      </div>

      <div>
        {/* Form Actions */}
        <div className="mb-8">
          <h3 className="font-semibold mb-3">Form Actions</h3>
          <div className="flex gap-3">
            <Button variant="cta" size="lg">
              Submit Application
            </Button>
            <Button variant="outline" size="lg">
              Save as Draft
            </Button>
            <Button variant="ghost" size="lg">
              Cancel
            </Button>
          </div>
        </div>

        {/* Card Actions */}
        <div className="mb-8">
          <h3 className="font-semibold mb-3">Card Actions</h3>
          <div className="bg-white border rounded-lg p-6">
            <h4 className="font-medium mb-2">Product Card</h4>
            <p className="text-gray-600 mb-4">Premium subscription plan with advanced features.</p>
            <div className="flex gap-3">
              <Button variant="cta" size="default">
                Upgrade Now
              </Button>
              <Button variant="outline" size="default">
                Learn More
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="mb-8">
          <h3 className="font-semibold mb-3">Navigation Actions</h3>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="default">
              ← Previous
            </Button>
            <span className="text-sm text-gray-500">Page 2 of 10</span>
            <Button variant="default" size="default">
              Next →
            </Button>
          </div>
        </div>

        {/* Toolbar Actions */}
        <div className="mb-8">
          <h3 className="font-semibold mb-3">Toolbar Actions</h3>
          <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
            <Button variant="ghost" size="icon" aria-label="Bold">
              <strong>B</strong>
            </Button>
            <Button variant="ghost" size="icon" aria-label="Italic">
              <em>I</em>
            </Button>
            <Button variant="ghost" size="icon" aria-label="Underline">
              <u>U</u>
            </Button>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <Button variant="ghost" size="icon" aria-label="Undo">
              ↶
            </Button>
            <Button variant="ghost" size="icon" aria-label="Redo">
              ↷
            </Button>
          </div>
        </div>

        {/* Destructive Actions */}
        <div>
          <h3 className="font-semibold mb-3">Destructive Actions</h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h4 className="font-medium text-red-800 mb-2">Danger Zone</h4>
            <p className="text-red-700 mb-4">These actions are permanent and cannot be undone.</p>
            <div className="flex gap-3">
              <Button variant="destructive" size="default">
                Delete Account
              </Button>
              <Button variant="outline" size="default">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Complete Button Showcase Component
 */
export const CompleteButtonShowcase: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">Enhanced Button System</h1>
        <p className="text-xl text-gray-600 mb-8">
          Modern, accessible, and performant button components with advanced hover effects
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <ButtonVariantsShowcase />
        <ButtonSizesShowcase />
        <ButtonStatesShowcase />
        <AccessibilityShowcase />
        <UseCasesShowcase />
      </div>

      <div className="text-center py-12 border-t">
        <p className="text-gray-600">
          For more information, see the{' '}
          <Button variant="link" size="default">
            Enhanced Button System Documentation
          </Button>
        </p>
      </div>
    </div>
  );
};

export default CompleteButtonShowcase;
