import React from 'react';
import { ServiceCTA } from '@/components/marketing/services/ServiceCTA';

export const FAQCTA = () => {
  return (
    <div className="w-full">
      <ServiceCTA
        titlePart1="Still Have"
        titlePart2="Questions?"
        description="Our expert support team is ready to help you find the perfect AI solution for your business. Get personalized answers and guidance tailored to your specific needs."
        buttonText="Contact Support"
        buttonLink="/contact?source=faq"
      />
    </div>
  );
};

export default FAQCTA;
