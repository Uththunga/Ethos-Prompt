import React from 'react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { NAV_ITEMS } from '@/constants/marketing-nav';
// import { NavItem } from '@/types/marketing-navigation';

// Constants
const MOBILE_BREAKPOINT = 768; // md breakpoint - matches useIsMobile hook

/**
 * Main Navigation component with responsive design and international accessibility standards
 * Follows WCAG 2.1 AA guidelines and mobile-first responsive design
 */
export const Navigation = ({
  className = '',
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [menuDirection, setMenuDirection] = useState<'from-right' | 'from-left'>('from-right');

  // For assets in the public directory, we should use the Vite base URL
  const baseUrl = import.meta.env.BASE_URL || '/';
  const ethosBrainPath = `${baseUrl}assets/marketing/images/brainicon.webp`;

  // Refs
  const navRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const navItemsRef = useRef<(HTMLAnchorElement | null)[]>([]);

  // Check if current route matches nav item
  const isActive = useCallback(
    (path: string, exact: boolean = false) => {
      return exact ? location.pathname === path : location.pathname.startsWith(path);
    },
    [location.pathname]
  );

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
      if (!isMobile) {
        setIsMobileMenuOpen(false);
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMenuDirection('from-left');
    setIsMobileMenuOpen(false);
    onNavigate?.();
  }, [location, onNavigate]);

  // Handle click outside to close mobile menu
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        navRef.current &&
        !navRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setMenuDirection('from-left');
        setIsMobileMenuOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuDirection('from-left');
        setIsMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileMenuOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (!isMobileMenuOpen) return;

      const lastIndex = NAV_ITEMS.length - 1;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          setMenuDirection('from-left');
          setIsMobileMenuOpen(false);
          menuButtonRef.current?.focus();
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (index < lastIndex) {
            navItemsRef.current[index + 1]?.focus();
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (index > 0) {
            navItemsRef.current[index - 1]?.focus();
          } else {
            menuButtonRef.current?.focus();
          }
          break;
        case 'Home':
          e.preventDefault();
          navItemsRef.current[0]?.focus();
          break;
        case 'End':
          e.preventDefault();
          navItemsRef.current[lastIndex]?.focus();
          break;
        default:
          break;
      }
    },
    [isMobileMenuOpen]
  );

  // Handle navigation with proper focus management
  const handleNavigation = useCallback(
    (e: React.MouseEvent, path: string) => {
      if (e.ctrlKey || e.metaKey) return; // Allow default behavior for cmd/ctrl+click

      e.preventDefault();
      navigate(path);
      onNavigate?.();
    },
    [navigate, onNavigate]
  );

  // Memoize the navigation items to prevent unnecessary re-renders
  const navItems = useMemo(
    () =>
      NAV_ITEMS.map((item, index) => ({
        ...item,
        isActive: isActive(item.path, item.exact),
        key: `nav-item-${index}`,
      })),
    [isActive]
  );

  return (
    <header className={`relative ${className}`} role="banner">
      {/* Skip to main content link - Only visible when focused */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:bg-white focus:px-4 focus:py-2 focus:z-50 focus:rounded focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ethos-purple transition-all duration-200"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        Skip to main content
      </a>

      <div className="w-full bg-white/95 backdrop-blur-sm flex justify-between items-center py-3 sm:py-4 lg:py-5 sticky top-0 z-40">
        <div className="container-standard flex items-center justify-between w-full">
          {/* Logo - Always in left corner */}
          <div className="flex-shrink-0 z-10">
            <Link
              to="/"
              className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ethos-purple focus-visible:ring-offset-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
              aria-label="EthosPrompt Home"
              onClick={(e) => handleNavigation(e, '/')}
            >
              <div className="flex items-center" aria-hidden="true">
                <img
                  src={ethosBrainPath}
                  alt=""
                  className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 transition-all duration-200 filter brightness-0"
                />
              </div>
              <h1 className="text-ethos-navy font-bold font-poppins whitespace-nowrap leading-none" style={{ fontSize: '20px', lineHeight: '20px' }}>
                <span className="sm:hidden">EthosPrompt</span>
                <span className="hidden sm:inline lg:hidden" style={{ fontSize: '24px', lineHeight: '24px' }}>EthosPrompt</span>
                <span className="hidden lg:inline" style={{ fontSize: '28px', lineHeight: '28px' }}>EthosPrompt</span>
              </h1>
            </Link>
          </div>

          {/* Desktop/Tablet Navigation - Centered between logo and mobile menu */}
          <nav
            className="hidden lg:flex items-center justify-center flex-1 mx-6 xl:mx-12"
            aria-label="Main navigation"
            role="navigation"
          >
            <ul className="flex items-center justify-center gap-4 xl:gap-6 2xl:gap-8">
              {navItems.map((item, index) => (
                <li key={item.key} className="relative">
                  <Link
                    to={item.path}
                    className="text-base font-semibold px-4 py-2.5 rounded-lg transition-all duration-200 text-ethos-navy hover:text-ethos-purple hover:bg-ethos-purple/5 active:scale-95 whitespace-nowrap min-h-[44px] flex items-center"
                    aria-current={item.isActive ? 'page' : undefined}
                    aria-label={item.ariaLabel || `Navigate to ${item.label}`}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    tabIndex={0}
                    id={item.key}
                    ref={(el) => (navItemsRef.current[index] = el)}
                    onClick={(e) => handleNavigation(e, item.path)}
                  >
                    {item.label}
                    <span
                      className={`absolute -bottom-0.5 left-1/2 w-4/5 h-0.5 bg-ethos-purple rounded-full transform -translate-x-1/2 transition-all duration-200 ${
                        item.isActive ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                      }`}
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Mobile/Tablet Menu Button */}
          <div className="flex-shrink-0 z-20 lg:hidden">
            <button
              ref={menuButtonRef}
              className="p-2.5 sm:p-3 rounded-lg text-ethos-navy hover:bg-ethos-purple/10 active:bg-ethos-purple/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-ethos-purple focus-visible:ring-offset-2 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick={() => {
                if (!isMobileMenuOpen) {
                  setMenuDirection('from-right');
                  setIsMobileMenuOpen(true);
                } else {
                  setMenuDirection('from-left');
                  setIsMobileMenuOpen(false);
                  menuButtonRef.current?.focus();
                }
              }}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <span className="sr-only">{isMobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
              <div className="w-6 h-5 flex flex-col justify-between items-center relative">
                <span
                  className={`block w-6 h-0.5 bg-current rounded-full transform transition-all duration-300 ease-out ${
                    isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={`block w-6 h-0.5 bg-current rounded-full transform transition-all duration-300 ease-out ${
                    isMobileMenuOpen ? 'opacity-0 -translate-x-4' : 'opacity-100'
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={`block w-6 h-0.5 bg-current rounded-full transform transition-all duration-300 ease-out ${
                    isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
                  }`}
                  aria-hidden="true"
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Menu Overlay - Respects reduced motion preferences */}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
          isMobileMenuOpen
            ? 'opacity-100 visible bg-black/40 backdrop-blur-sm'
            : 'opacity-0 invisible pointer-events-none'
        }`}
        aria-hidden={!isMobileMenuOpen}
        onClick={() => {
          setMenuDirection('from-left');
          setIsMobileMenuOpen(false);
        }}
      >
        {/* Mobile/Tablet Menu Panel - Respects reduced motion preferences */}
        <div
          ref={navRef}
          id="mobile-menu"
          className={`absolute inset-0 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen
              ? 'translate-x-0'
              : menuDirection === 'from-right'
              ? 'translate-x-full'
              : '-translate-x-full'
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="h-full flex flex-col overflow-y-auto">
            {/* Menu Header */}
            <div className="w-full bg-gradient-to-r from-ethos-purple/5 to-white border-b border-gray-200 px-5 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ethos-navy">Menu</h2>
                <button
                  onClick={() => {
                    setMenuDirection('from-left');
                    setIsMobileMenuOpen(false);
                  }}
                  className="p-2 rounded-lg hover:bg-white/80 transition-colors"
                  aria-label="Close menu"
                >
                  <svg
                    className="w-5 h-5 text-ethos-navy"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 py-6" aria-label="Mobile navigation">
              <ul className="flex flex-col gap-2">
                {navItems.map((item, index) => (
                  <li key={item.key}>
                    <Link
                      to={item.path}
                      className={`block px-5 py-4 rounded-lg transition-all duration-200 text-base text-ethos-navy min-h-[48px] flex items-center ${
                        item.isActive
                          ? 'bg-ethos-purple/10 font-semibold shadow-sm border border-ethos-purple/20'
                          : 'hover:bg-gray-50 active:bg-gray-100 font-medium'
                      } focus:outline-none focus-visible:ring-2 focus-visible:ring-ethos-purple focus-visible:ring-offset-2`}
                      aria-current={item.isActive ? 'page' : undefined}
                      aria-label={item.ariaLabel || item.label}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      tabIndex={isMobileMenuOpen ? 0 : -1}
                      id={`mobile-${item.key}`}
                      ref={(el) => (navItemsRef.current[index] = el)}
                      onClick={(e) => {
                        handleNavigation(e, item.path);
                        setMenuDirection('from-left');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <div className="flex items-center w-full">
                        <span className="flex-1">{item.label}</span>
                        {item.isActive ? (
                          <span
                            className="ml-auto w-2 h-2 rounded-full bg-ethos-purple animate-pulse"
                            aria-hidden="true"
                          />
                        ) : (
                          <svg
                            className="ml-auto w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 mt-auto bg-gray-50">
              <div className="text-center text-sm text-gray-600">
                © {new Date().getFullYear()} EthosPrompt · All rights reserved
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// Add display name for better debugging
Navigation.displayName = 'Navigation';

export default Navigation;
