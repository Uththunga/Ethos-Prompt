import React from 'react';
import { Button } from '@/components/marketing/ui/button';

/**
 * CTA Button Examples and Documentation
 *
 * This component demonstrates how to use the standardized CTA (Call-to-Action) button
 * that follows the "Get Started Now" button design pattern used throughout the application.
 *
 * Design Features:
 * - Purple gradient background (ethos-purple-light -> ethos-purple on hover)
 * - White text with responsive sizing
 * - Full rounded corners (rounded-full)
 * - Responsive padding and text sizes
 * - Smooth transition effects
 * - Consistent accessibility features
 */

export const CTAButtonExamples = () => {
  return (
    <main className="p-8 bg-gray-50" role="main" id="main-content">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">CTA Button Component Examples</h1>
        </header>

        {/* Basic CTA Button */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Basic CTA Button</h2>
          <p className="text-gray-600 mb-4">
            The standard CTA button using the predefined variant and size:
          </p>
          <div className="p-6 bg-white rounded-lg border mb-4">
            <Button variant="cta" size="lg">
              Get Started Now
            </Button>
          </div>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
            <code>{`<Button variant="cta" size="lg">
  Get Started Now
</Button>`}</code>
          </pre>
        </section>

        {/* Common CTA Text Variations */}
        <section className="mb-8" aria-labelledby="variations-heading">
          <h2 id="variations-heading" className="text-2xl font-semibold text-gray-800 mb-3">
            Common CTA Text Variations
          </h2>
          <p className="text-gray-600 mb-4">
            Examples of different CTA text content using the same styling:
          </p>
          <div className="p-6 bg-white rounded-lg border">
            <div className="flex flex-wrap gap-4">
              <Button variant="cta" size="lg">
                Get Started Now
              </Button>
              <Button variant="cta" size="lg">
                Schedule Demo
              </Button>
              <Button variant="cta" size="lg">
                Download Now
              </Button>
              <Button variant="cta" size="lg">
                Contact Us
              </Button>
              <Button variant="cta" size="lg">
                Learn More
              </Button>
            </div>
          </div>
        </section>

        {/* Custom Sizing */}
        <section className="mb-8" aria-labelledby="sizing-heading">
          <h2 id="sizing-heading" className="text-2xl font-semibold text-gray-800 mb-3">
            Custom Sizing (Advanced)
          </h2>
          <p className="text-gray-600 mb-4">
            For special cases, you can override the default CTA sizing:
          </p>
          <div className="p-6 bg-white rounded-lg border mb-4">
            <div className="flex flex-col gap-6">
              {/* Smaller CTA */}
              <div>
                <p className="text-sm text-gray-500 mb-2">Compact CTA:</p>
                <Button variant="cta" className="px-6 py-2 text-sm">
                  Get Started
                </Button>
              </div>

              {/* Larger CTA */}
              <div>
                <p className="text-sm text-gray-500 mb-2">Large CTA:</p>
                <Button variant="cta" className="px-16 py-5 text-xl lg:text-2xl">
                  Get Started Now
                </Button>
              </div>

              {/* Full Width CTA */}
              <div>
                <p className="text-sm text-gray-500 mb-2">Full Width CTA:</p>
                <Button variant="cta" size="lg" className="w-full">
                  Get Started Now
                </Button>
              </div>
            </div>
          </div>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
            <code>{`{/* Compact */}
<Button variant="cta" className="px-6 py-2 text-sm">
  Get Started
</Button>

{/* Large */}
<Button variant="cta" className="px-16 py-5 text-xl lg:text-2xl">
  Get Started Now
</Button>

{/* Full Width */}
<Button variant="cta" size="lg" className="w-full">
  Get Started Now
</Button>`}</code>
          </pre>
        </section>

        {/* Usage Guidelines */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Usage Guidelines</h2>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">✅ Do:</h3>
              <ul className="list-disc list-inside text-blue-700 mb-4">
                <li>Use the CTA variant for primary call-to-action buttons</li>
                <li>Use consistent text like "Get Started Now", "Schedule Demo", etc.</li>
                <li>Apply the button in hero sections, landing pages, and conversion points</li>
                <li>Maintain the purple brand color scheme</li>
                <li>Use appropriate aria-labels for accessibility</li>
              </ul>

              <h3 className="font-semibold text-red-800 mb-2">❌ Don't:</h3>
              <ul className="list-disc list-inside text-red-700">
                <li>Override the purple color scheme with custom colors</li>
                <li>Use for secondary actions (use other button variants instead)</li>
                <li>Add complex hover effects that conflict with the built-in transitions</li>
                <li>Use multiple CTA buttons in the same section (maintain hierarchy)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Migration Guide */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Migration Guide</h2>
          <p className="text-gray-600 mb-4">
            Replace existing custom "Get Started Now" buttons with the standardized component:
          </p>
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-semibold text-gray-800 mb-2">Before:</h4>
            <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto mb-4">
              <code>{`<button className="bg-ethos-purple-light hover:bg-ethos-purple transition-colors duration-300 text-white px-8 lg:px-12 py-3 lg:py-4 rounded-full text-base sm:text-lg lg:text-xl font-medium">
  Get Started Now
</button>`}</code>
            </pre>

            <h4 className="font-semibold text-gray-800 mb-2">After:</h4>
            <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
              <code>{`<Button variant="cta" size="lg">
  Get Started Now
</Button>`}</code>
            </pre>
          </div>
        </section>
      </div>
    </main>
  );
};

export default CTAButtonExamples;
