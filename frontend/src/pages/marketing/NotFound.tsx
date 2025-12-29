import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/marketing/ui/button';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <main
      className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50"
      role="main"
      id="main-content"
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <section aria-labelledby="error-heading">
          {/* 404 Number */}
          <div
            className="heading-display font-bold text-ethos-purple mb-6 lg:mb-8"
            aria-hidden="true"
          >
            404
          </div>

          {/* Error Message */}
          <h1
            id="error-heading"
            className="heading-hero font-semibold text-ethos-navy mb-4 lg:mb-6"
          >
            Oops! Page not found
          </h1>

          {/* Description */}
          <p className="text-body-large text-ethos-gray leading-relaxed mb-6 lg:mb-8">
            The page you're looking for doesn't exist. It might have been moved, deleted, or you
            entered the wrong URL.
          </p>

          {/* Action Button */}
          <Link to="/" aria-label="Return to home page">
            <Button variant="ethos" size="lg">
              Return to Home
            </Button>
          </Link>
        </section>
      </div>
    </main>
  );
};

export default NotFound;
