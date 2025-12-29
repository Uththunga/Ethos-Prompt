import React from 'react';
import { Button } from '@/components/marketing/ui/button';
import { motion } from 'framer-motion';
import ShinyText from '@/components/marketing/ui/ShinyText';
import { Link } from 'react-router-dom';

export const HeaderCTA = () => {
  // For assets in the public directory, we should use the Vite base URL
  const baseUrl = import.meta.env.BASE_URL || '/';
  const footerBackgroundPath = `${baseUrl}assets/marketing/images/footer-background.jpg`;

  return (
    <section
      className="bg-ethos-navy relative overflow-hidden"
      style={{ backgroundColor: '#030823' }}
      aria-labelledby="cta-heading"
    >
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-gradient-to-r from-ethos-navy to-ethos-navy/80 mix-blend-multiply"
          aria-hidden="true"
        />
        <img
          src={footerBackgroundPath}
          alt=""
          className="w-full h-full object-cover object-center sm:object-right opacity-20 transition-all duration-500 ease-in-out transform hover:scale-105"
          loading="lazy"
          decoding="async"
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 xl:py-28">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h2
            id="cta-heading"
            className="heading-hero font-medium leading-tight mb-6 sm:mb-8 lg:mb-10"
          >
            <motion.div className="block">
              <motion.span
                className="text-white block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
              >
                Ready to accelerate your
              </motion.span>
              <motion.span
                className="block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              >
                <ShinyText
                  className="from-[#6D28D9] via-[#8B5CF6] to-[#6D28D9] dark:from-[#8B5CF6] dark:via-[#C4B5FD] dark:to-[#8B5CF6]"
                  speedInMs={10000}
                >
                  business growth?
                </ShinyText>
              </motion.span>
            </motion.div>
          </h2>

          <motion.p
            className="text-gray-200 text-body-large font-light leading-relaxed mb-8 sm:mb-10 lg:mb-12 max-w-4xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          >
            Join forward-thinking organizations leveraging our enterprise AI solutions to drive
            operational excellence, reduce costs, and achieve measurable business outcomes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              asChild
              variant="ethos"
              size="lg"
              aria-label="Get started with AI workflow transformation"
            >
              <Link to="/contact">
                Begin Your Transformation
              </Link>
            </Button>
          </motion.div>

          <motion.p
            className="text-white/70 text-body-small mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
          ></motion.p>
        </motion.div>
      </div>
    </section>
  );
};
