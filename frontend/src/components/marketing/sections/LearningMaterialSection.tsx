import React from 'react';
import { Button } from '@/components/marketing/ui/button';
import { motion } from 'framer-motion';

interface LearningMaterialSectionProps {
  baseUrl: string;
}

export const LearningMaterialSection: React.FC<LearningMaterialSectionProps> = ({
  baseUrl
}) => {
  const backgroundImagePath = `${baseUrl}assets/marketing/images/footer-background.webp`;

  return (
    <section
      className="bg-ethos-navy relative overflow-hidden"
      style={{ backgroundColor: '#030823' }}
      aria-labelledby="learning-material-heading"
    >
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-ethos-navy to-ethos-navy/80 mix-blend-multiply" aria-hidden="true" />
        <img
          src={backgroundImagePath}
          alt=""
          className="w-full h-full object-cover object-center sm:object-right opacity-20 transition-all duration-500 ease-in-out transform hover:scale-105"
          loading="lazy"
          decoding="async"
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24 lg:py-28 xl:py-32">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            className="mb-4 sm:mb-6"
          >
            <h4 className="text-white text-sm sm:text-base md:text-lg lg:text-xl font-light tracking-wide uppercase">
              Learning Resources
            </h4>
          </motion.div>

          <motion.h2
            id="learning-material-heading"
            className="text-4xl sm:text-5xl lg:text-6xl font-medium leading-tight mb-6 sm:mb-8 md:mb-10 lg:mb-12 font-poppins bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          >
            Download the free learning material
          </motion.h2>

          <motion.p
            className="text-gray-200 text-body-large font-light leading-relaxed mb-10 sm:mb-12 md:mb-14 lg:mb-16 max-w-4xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          >
            This learning material is for beginners who are keen to learn more, with examples of what we have discussed.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="ethos"
              size="lg"
              aria-label="Download free learning material"
            >
              Download Now
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
