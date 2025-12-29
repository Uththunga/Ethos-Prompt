import React from 'react';
interface ServiceCardProps {
  title: string;
  description: string;
}

export const ServiceCard = ({ title, description }: ServiceCardProps) => {
  return (
    <article >
      <h4 className="text-ethos-gray heading-subsection font-semibold">
        {title}
      </h4>
      <p className="text-ethos-gray text-body-large font-normal leading-relaxed">
        {description}
      </p>
    </article>
  );
};
