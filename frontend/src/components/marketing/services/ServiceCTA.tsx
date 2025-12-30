import { Button } from '@/components/marketing/ui/button';
import ShinyText from '@/components/marketing/ui/ShinyText';
import { motion } from 'framer-motion';
import React from 'react';
import { Link } from 'react-router-dom';

interface ServiceCTAProps {
  titlePart1: string;
  titlePart2: string;
  description: string;
  buttonText?: string;
  buttonLink?: string;
}

export const ServiceCTA: React.FC<ServiceCTAProps> = ({
  titlePart1,
  titlePart2,
  description,
  buttonText = 'Schedule a Free Consultation',
  buttonLink = '/contact?source=general',
}) => {
  // For assets in the public directory, we should use the Vite base URL
  const baseUrl = import.meta.env.BASE_URL || '/';
  const footerBackgroundPath = `${baseUrl}assets/marketing/images/footer-background.webp`;

  return (
    <section
      className="bg-ethos-navy relative overflow-hidden"
      style={{ backgroundColor: '#030823' }}
      aria-labelledby="service-cta-heading"
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

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 lg:py-16 xl:py-20">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h2
            id="service-cta-heading"
            className="heading-hero font-medium leading-tight mb-6 sm:mb-8 md:mb-10 lg:mb-12 px-4"
          >
            <motion.div className="block">
              <motion.span
                className="text-white block break-words"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
              >
                {titlePart1}
              </motion.span>
              <motion.span
                className="block break-words"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              >
                <ShinyText
                  className="from-[#6D28D9] via-[#8B5CF6] to-[#6D28D9] dark:from-[#8B5CF6] dark:via-[#C4B5FD] dark:to-[#8B5CF6]"
                  speedInMs={10000}
                >
                  {titlePart2}
                </ShinyText>
              </motion.span>
            </motion.div>
          </h2>

          <motion.p
            className="text-ethos-gray-light text-body-large font-light leading-relaxed mb-10 sm:mb-12 md:mb-14 lg:mb-16 max-w-4xl mx-auto px-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          >
            {description}
          </motion.p>

          <div className="w-full flex justify-center px-4">
            <Link to={buttonLink} className="inline-block">
              <Button
                variant="ethos"
                size="lg"
                aria-label={buttonText}
                className="px-6 py-4 sm:px-8 sm:py-6 whitespace-normal sm:whitespace-nowrap"
              >
                {buttonText}
              </Button>
            </Link>
          </div>

          <motion.p
            className="text-white/70 text-body-small mt-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
          ></motion.p>
        </motion.div>
      </div>
    </section>
  );
};
