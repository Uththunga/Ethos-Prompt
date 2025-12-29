import React from 'react';
import { Navigation } from '@/components/marketing/layout/Navigation';
import { Footer } from '@/components/marketing/layout/Footer';
import { Button } from '@/components/marketing/ui/button';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export const PlaceholderPage = ({ title, description }: PlaceholderPageProps) => {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main
        className="min-h-[70vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8"
        role="main"
        id="main-content"
      >
        <section className="text-center max-w-4xl mx-auto" aria-labelledby="page-heading">
          <h1 id="page-heading" className="heading-hero font-bold text-ethos-navy mb-4 lg:mb-6">
            {title}
          </h1>
          <p className="text-body-large text-ethos-gray mb-6 lg:mb-8 leading-relaxed">
            {description}
          </p>
          <div>
            <p className="text-body-default text-ethos-gray-light mb-4 lg:mb-6">
              This page is coming soon! Continue prompting to help us build out this section.
            </p>
            <Button
              onClick={() => window.history.back()}
              variant="ethos"
              size="lg"
              aria-label="Go back to previous page"
            >
              Go Back
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
