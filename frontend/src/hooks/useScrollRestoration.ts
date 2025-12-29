import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const useScrollRestoration = () => {
  const location = useLocation();
  const hasScrolled = useRef(false);

  useEffect(() => {
    // Check if we're navigating back to the homepage with a hash
    if (location.pathname === '/' && location.hash && !hasScrolled.current) {
      const sectionId = location.hash.substring(1);

      // Function to scroll to element
      const scrollToElement = () => {
        const element = document.getElementById(sectionId);
        if (element) {
          // Calculate the position with offset for fixed header
          const headerOffset = 100; // Adjust this value based on your header height
          const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });

          // Mark that we've scrolled to prevent re-triggering
          hasScrolled.current = true;

          // Clear the hash from URL after scrolling completes to prevent it from affecting browser history
          // Use native history API to avoid triggering React Router navigation
          setTimeout(() => {
            window.history.replaceState(null, '', '/');
          }, 1000);

          return true;
        }
        return false;
      };

      // Wait for the page to fully render before scrolling
      const timer = setTimeout(() => {
        if (!scrollToElement()) {
          // If element not found, try again with a longer delay
          setTimeout(scrollToElement, 300);
        }
      }, 150);

      return () => clearTimeout(timer);
    } else if (!location.hash) {
      // Reset the flag when there's no hash
      hasScrolled.current = false;
    }
  }, [location]);
};
