import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Skip dashboard routes (do not alter scroll for app workspace pages)
    if (pathname.startsWith('/dashboard')) return;

    // Scroll to hash if it exists (marketing pages with anchor links)
    if (hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Scroll to top on path change when no hash is present
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
};
