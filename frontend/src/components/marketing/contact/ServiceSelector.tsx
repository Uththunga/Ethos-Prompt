import React from 'react';
import { Brain, Cable, Smartphone } from 'lucide-react';

export type ServiceOption = 'smart-assistant' | 'system-integration' | 'web-mobile-applications';

interface ServiceSelectorProps {
  value?: ServiceOption | '';
  onChange: (value: ServiceOption) => void;
}

const options: Array<{ key: ServiceOption; label: string; Icon: React.ComponentType<any>; desc: string }> = [
  { key: 'smart-assistant', label: 'Smart Business Assistant', Icon: Brain, desc: 'AI-driven automation' },
  { key: 'system-integration', label: 'System Integration', Icon: Cable, desc: 'Connect your systems' },
  { key: 'web-mobile-applications', label: 'Web & Mobile Applications', Icon: Smartphone, desc: 'Custom development' },
];

const ServiceSelector: React.FC<ServiceSelectorProps> = ({ value, onChange }) => {
  return (
    <div
      role="radiogroup"
      aria-label="Select a service"
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3"
    >
      {options.map(({ key, label, Icon, desc }) => {
        const selected = value === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(key)}
            className={
              `group w-full text-left rounded-2xl border ${selected ? 'border-ethos-purple ring-2 ring-ethos-purple/30' : 'border-gray-200'} ` +
              'bg-white hover:border-ethos-purple/60 transition-colors p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-ethos-purple overflow-hidden min-h-[72px]'
            }
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${selected ? 'bg-ethos-purple/10' : 'bg-gray-50'}`}>
                <Icon className={`w-5 h-5 ${selected ? 'text-ethos-purple' : 'text-gray-600'}`} />
              </div>
              <div className="min-w-0 max-w-full">
                <div className="font-medium text-ethos-navy leading-snug break-words text-sm md:text-[15px]">{label}</div>
                <div className="text-xs sm:text-sm text-ethos-gray leading-snug break-words">{desc}</div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ServiceSelector;
