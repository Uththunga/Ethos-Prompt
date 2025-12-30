import React from 'react';
import {
    FaLinkedin,
    FaTwitter
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

export const Footer = () => {
  // For assets in the public directory, we should use the Vite base URL
  const baseUrl = import.meta.env.BASE_URL || '/';
  const footerBackgroundPath = `${baseUrl}assets/marketing/images/footer-background.webp`;
  const ethosBrainPath = `${baseUrl}assets/marketing/images/brainicon.webp`;

  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="w-full relative overflow-hidden bg-ethos-navy"
      style={{ backgroundColor: '#030823' }}
      role="contentinfo"
      aria-labelledby="footer-heading"
    >
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-gradient-to-br from-ethos-navy via-ethos-navy/90 to-ethos-navy/80 mix-blend-multiply"
          aria-hidden="true"
        />
        <img
          src={footerBackgroundPath}
          alt=""
          className="w-full h-full object-cover object-center sm:object-right opacity-10"
          loading="lazy"
          decoding="async"
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 lg:py-20">
        {/* Main Footer Content */}
        <section
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-6"
          aria-labelledby="footer-heading"
        >
          <h2 id="footer-heading" className="sr-only">
            Footer Navigation and Information
          </h2>

          {/* Company Info - 4/12 columns on large screens */}
          <div className="flex flex-col gap-3 sm:gap-4 col-span-2 lg:col-span-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <img
                src={ethosBrainPath}
                alt=""
                className="w-6 h-6 sm:w-7 sm:h-7 self-center brightness-0 invert"
                aria-hidden="true"
              />
              <h3 className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                EthosPrompt
              </h3>
            </div>
            <p className="text-white/70 text-[15px] sm:text-[17px] leading-relaxed max-w-full sm:max-w-md lg:max-w-xs">
              Intelligent AI solutions for modern businesses. We build smart assistants, connect your systems, and create custom applications responsibly.
            </p>
            <div className="flex gap-3 sm:gap-4">
              <a
                href="https://twitter.com/ethosprompt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors duration-200"
                aria-label="Follow us on Twitter"
              >
                <FaTwitter className="w-5 h-5 sm:w-6 sm:h-6" />
              </a>
              <a
                href="https://linkedin.com/company/ethosprompt"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors duration-200"
                aria-label="Connect on LinkedIn"
              >
                <FaLinkedin className="w-5 h-5 sm:w-6 sm:h-6" />
              </a>
            </div>
          </div>

          {/* Services - 2/12 columns on large screens */}
          <nav className="flex flex-col gap-2.5 sm:gap-3 lg:col-span-2">
            <h4 className="text-white/90 font-semibold text-xs sm:text-sm tracking-wide uppercase">
              Services
            </h4>
            <ul className="flex flex-col gap-1 sm:gap-1.5">
              <li>
                <Link
                  to="/smart-business-assistant"
                  className="block text-white/60 hover:text-white transition-colors duration-200 text-sm sm:text-base"
                >
                  AI Assistant
                </Link>
              </li>
              <li>
                <Link
                  to="/system-integration"
                  className="block text-white/60 hover:text-white transition-colors duration-200 text-sm sm:text-base"
                >
                  System Integration
                </Link>
              </li>
              <li>
                <Link
                  to="/intelligent-applications"
                  className="block text-white/60 hover:text-white transition-colors duration-200 text-sm sm:text-base"
                >
                  Applications
                </Link>
              </li>
            </ul>
          </nav>

          {/* Resources - 2/12 columns on large screens */}
          <nav className="flex flex-col gap-2.5 sm:gap-3 lg:col-span-2 text-right sm:text-right lg:text-left">
            <h4 className="text-white/90 font-semibold text-xs sm:text-sm tracking-wide uppercase">
              Resources
            </h4>
            <ul className="flex flex-col gap-1 sm:gap-1.5">
              <li>
                <Link
                  to="/prompt-library"
                  className="block text-white/60 hover:text-white transition-colors duration-200 text-sm sm:text-base"
                >
                  Prompt Engine
                </Link>
              </li>
              <li>
                <Link
                  to="/guides"
                  className="block text-white/60 hover:text-white transition-colors duration-200 text-sm sm:text-base"
                >
                  Prompting Guide
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="block text-white/60 hover:text-white transition-colors duration-200 text-sm sm:text-base"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  to="/help"
                  className="block text-white/60 hover:text-white transition-colors duration-200 text-sm sm:text-base"
                >
                  Help Center
                </Link>
              </li>
            </ul>
          </nav>

          {/* Company & Contact - 4/12 columns on large screens */}
          <div className="flex flex-col gap-4 col-span-2 lg:col-span-4">
            {/* Company Links */}
            <nav className="flex flex-col gap-2.5 sm:gap-3">
              <h4 className="text-white/90 font-semibold text-xs sm:text-sm tracking-wide uppercase">
                Company
              </h4>
              <ul className="flex flex-col gap-1 sm:gap-1.5">
                <li>
                  <Link
                    to="/about"
                    className="block text-white/60 hover:text-white transition-colors duration-200 text-sm sm:text-base"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="block text-white/60 hover:text-white transition-colors duration-200 text-sm sm:text-base"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </nav>

            {/* Contact Info */}
            <address className="not-italic">
              <a
                href="mailto:info@ethosprompt.com"
                className="text-white/60 hover:text-ethos-purple text-sm sm:text-base transition-colors duration-200"
              >
                info@ethosprompt.com
              </a>
            </address>
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-white/10 mt-6 sm:mt-8 md:mt-12 pt-4 sm:pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-0">
            <p className="text-white/50 text-xs sm:text-sm text-center md:text-left">
              &copy; {currentYear} EthosPrompt. All rights reserved.
            </p>
            <div className="flex items-center flex-wrap justify-center md:justify-end gap-2 sm:gap-3">
              <Link
                to="/privacy"
                className="text-white/50 hover:text-white transition-colors duration-200 text-xs sm:text-sm"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="text-white/50 hover:text-white transition-colors duration-200 text-xs sm:text-sm"
              >
                Terms of Service
              </Link>
              <Link
                to="/cookies"
                className="text-white/50 hover:text-white transition-colors duration-200 text-xs sm:text-sm"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
