import React from 'react';
import { Link } from 'react-router-dom';

interface ServiceCardProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  className?: string;
  href?: string;
  onClick?: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ icon, title, description, className = '', href, onClick }) => {
  const styles = {
    '@keyframes floatMole': {
      '0%': { transform: 'translateY(0)' },
      '50%': { transform: 'translateY(-1mm)' },
      '100%': { transform: 'translateY(0)' }
    },
    '.animate-float-mole': {
      animation: 'floatMole 4s ease-in-out infinite'
    },
    '@keyframes star-border': {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' }
    },
    '.animate-star-border': {
      position: 'relative',
      zIndex: 0,
      overflow: 'hidden'
    },
    '.animate-star-border::before': {
      content: '""',
      position: 'absolute',
      zIndex: -1,
      inset: '-12px',
      background: 'conic-gradient(from 0deg, transparent, rgba(116, 9, 197, 0.4), rgba(116, 9, 197, 0.6), rgba(116, 9, 197, 0.6), transparent 180deg, rgba(116, 9, 197, 0.4), rgba(116, 9, 197, 0.6), rgba(116, 9, 197, 0.6), transparent 360deg)',
      borderRadius: 'inherit',
      opacity: 0,
      transform: 'rotate(0deg)',
      transition: 'opacity 0.3s ease'
    },
    '.animate-star-border:hover::before': {
      opacity: 0.25,
      animation: 'star-border 12s linear infinite'
    },
    '.animate-star-border::after': {
      content: '""',
      position: 'absolute',
      zIndex: -1,
      inset: '1px',
      background: 'linear-gradient(to bottom, #f9fafb, #f3f4f6)',
      borderRadius: 'inherit'
    }
  } as const;

  // Convert styles to a style tag content
  const styleContent = Object.entries(styles).map(([selector, rules]) => {
    const ruleContent = Object.entries(rules)
      .map(([prop, value]) => `  ${prop.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}: ${value};`)
      .join('\n');
    return `${selector} {\n${ruleContent}\n}`;
  }).join('\n\n');

  const content = (
    <div className="relative group">
      <style dangerouslySetInnerHTML={{ __html: styleContent }} />

      <div className={`animate-star-border bg-white rounded-2xl p-6 md:p-7 lg:p-8 h-full flex flex-col items-center text-center ${className} ${href ? 'cursor-pointer' : ''}`} style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.25)' }}>
        {icon && (
          <div className="w-16 h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 mb-4 md:mb-5 lg:mb-6 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-100">
            {icon}
          </div>
        )}
        <h3 className="text-2xl sm:text-3xl font-bold text-center mb-4" style={{
          background: 'linear-gradient(to right, var(--ethos-purple-gradient-start), var(--ethos-purple-gradient-end))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>{title}</h3>
        <div className="text-sm text-gray-600 mb-6 flex-grow text-center">
          {description.split('\n').map((point, index) => (
            <p key={index} className="leading-relaxed">
              {point.replace('• ', '')}
            </p>
          ))}
        </div>
        {href && (
          <div className="flex items-center justify-center text-ethos-purple font-semibold mt-auto">
            <svg
              className="w-8 h-6 group-hover:scale-110 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 6"
              aria-label="More options"
            >
              <circle cx="3" cy="3" r="1.5" />
              <circle cx="12" cy="3" r="1.5" />
              <circle cx="21" cy="3" r="1.5"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link to={href} onClick={onClick} className="block h-full">
        {content}
      </Link>
    );
  }

  return content;
};

export default ServiceCard;
