import React, { useMemo } from 'react';

// Integration logo data - using Devicon CDN (more reliable)
interface Integration {
  name: string;
  icon: string; // Devicon name or direct URL
  color: string; // Brand color for hover effect
}

// Base path for local integration icons
const ICONS_PATH = '/assets/marketing/icons/integrations';

// Row 1 integrations (moving left) - Business & Productivity Apps for Australia
const row1Integrations: Integration[] = [
  // Accounting & Finance (Critical for Australia)
  { name: 'Xero', icon: `${ICONS_PATH}/xero.svg`, color: '#13B5EA' },
  { name: 'MYOB', icon: `${ICONS_PATH}/myob.svg`, color: '#6100A5' },
  { name: 'QuickBooks', icon: `${ICONS_PATH}/quickbooks.svg`, color: '#2CA01C' },
  // CRM
  { name: 'Salesforce', icon: `${ICONS_PATH}/salesforce.svg`, color: '#00A1E0' },
  { name: 'HubSpot', icon: `${ICONS_PATH}/hubspot.svg`, color: '#FF7A59' },
  { name: 'Zoho', icon: `${ICONS_PATH}/zoho.svg`, color: '#C8202B' },
  // E-commerce & Payments
  { name: 'Shopify', icon: `${ICONS_PATH}/shopify.svg`, color: '#7AB55C' },
  { name: 'Stripe', icon: `${ICONS_PATH}/stripe.svg`, color: '#635BFF' },
  { name: 'Square', icon: `${ICONS_PATH}/square.svg`, color: '#006AFF' },
  { name: 'PayPal', icon: `${ICONS_PATH}/paypal.svg`, color: '#003087' },
  // Communication & Collaboration
  { name: 'Slack', icon: `${ICONS_PATH}/slack.svg`, color: '#4A154B' },
  { name: 'Microsoft Teams', icon: `${ICONS_PATH}/microsoft-teams.svg`, color: '#6264A7' },
  { name: 'Zoom', icon: `${ICONS_PATH}/zoom.svg`, color: '#0B5CFF' },
  { name: 'Google', icon: `${ICONS_PATH}/google.svg`, color: '#4285F4' },
  // Project Management
  { name: 'Asana', icon: `${ICONS_PATH}/asana.svg`, color: '#F06A6A' },
  { name: 'Monday.com', icon: `${ICONS_PATH}/monday.svg`, color: '#FFCC00' },
];

// Row 2 integrations (moving right) - Additional Business Tools
const row2Integrations: Integration[] = [
  // Project Management & Collaboration
  { name: 'Jira', icon: `${ICONS_PATH}/jira.svg`, color: '#0052CC' },
  { name: 'Trello', icon: `${ICONS_PATH}/trello.svg`, color: '#0052CC' },
  { name: 'Notion', icon: `${ICONS_PATH}/notion.svg`, color: '#000000' },
  { name: 'ClickUp', icon: `${ICONS_PATH}/clickup.svg`, color: '#7B68EE' },
  // Marketing & Email
  { name: 'Mailchimp', icon: `${ICONS_PATH}/mailchimp.svg`, color: '#FFE01B' },
  { name: 'ActiveCampaign', icon: `${ICONS_PATH}/activecampaign.svg`, color: '#356AE6' },
  // Customer Support
  { name: 'Zendesk', icon: `${ICONS_PATH}/zendesk.svg`, color: '#03363D' },
  { name: 'Freshdesk', icon: `${ICONS_PATH}/freshdesk.svg`, color: '#2AB846' },
  // Documents & E-Signature
  { name: 'DocuSign', icon: `${ICONS_PATH}/docusign.svg`, color: '#FFCC22' },
  { name: 'Dropbox', icon: `${ICONS_PATH}/dropbox.svg`, color: '#0061FF' },
  // Design
  { name: 'Figma', icon: `${ICONS_PATH}/figma.svg`, color: '#F24E1E' },
  { name: 'Canva', icon: `${ICONS_PATH}/canva.svg`, color: '#00C4CC' },
  // LinkedIn & Social
  { name: 'LinkedIn', icon: `${ICONS_PATH}/linkedin.svg`, color: '#0A66C2' },
  // Cloud Infrastructure
  { name: 'AWS', icon: `${ICONS_PATH}/aws.svg`, color: '#FF9900' },
  { name: 'Azure', icon: `${ICONS_PATH}/azure.svg`, color: '#0078D4' },
  { name: 'Google Cloud', icon: `${ICONS_PATH}/googlecloud.svg`, color: '#4285F4' },
];

// Logo card component
const LogoCard: React.FC<{ integration: Integration }> = ({ integration }) => {
  const [hasError, setHasError] = React.useState(false);

  return (
    <div
      className="group relative flex-shrink-0 w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] md:w-[88px] md:h-[88px]
                 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200/60
                 shadow-sm hover:shadow-lg hover:shadow-purple-500/10
                 flex items-center justify-center
                 transition-all duration-300 ease-out
                 hover:scale-110 hover:border-purple-300 hover:bg-white
                 cursor-pointer"
      title={integration.name}
    >
      {/* Icon */}
      {!hasError ? (
        <img
          src={integration.icon}
          alt={`${integration.name} logo`}
          className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 object-contain
                     opacity-80 group-hover:opacity-100 transition-opacity duration-300"
          loading="lazy"
          onError={() => setHasError(true)}
        />
      ) : (
        // Fallback: colored initial
        <div
          className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center font-bold text-white text-lg"
          style={{ backgroundColor: integration.color }}
        >
          {integration.name.charAt(0)}
        </div>
      )}

      {/* Hover glow effect */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${integration.color}15 0%, transparent 70%)`,
        }}
      />

      {/* Tooltip */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2
                      opacity-0 group-hover:opacity-100
                      transition-opacity duration-200 delay-150
                      whitespace-nowrap bg-gray-900 text-white text-xs px-2 py-1 rounded
                      pointer-events-none z-10">
        {integration.name}
      </div>
    </div>
  );
};

// Marquee row component
const MarqueeRow: React.FC<{
  integrations: Integration[];
  direction: 'left' | 'right';
  speed?: number;
}> = ({ integrations, direction, speed = 30 }) => {
  // Duplicate for seamless loop
  const duplicatedIntegrations = useMemo(
    () => [...integrations, ...integrations],
    [integrations]
  );

  return (
    <div className="relative overflow-hidden py-3">
      {/* Fade edges */}
      <div
        className="absolute left-0 top-0 bottom-0 w-24 sm:w-32 md:w-40 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, rgba(255,255,255,1) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%)' }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-24 sm:w-32 md:w-40 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, rgba(255,255,255,1) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%)' }}
      />

      {/* Scrolling content */}
      <div
        className={`flex gap-4 sm:gap-5 md:gap-6 ${
          direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right'
        }`}
        style={{
          animationDuration: `${speed}s`,
          width: 'max-content',
        }}
      >
        {duplicatedIntegrations.map((integration, index) => (
          <LogoCard key={`${integration.name}-${index}`} integration={integration} />
        ))}
      </div>
    </div>
  );
};

// Main component
export const IntegrationLogosMarquee: React.FC<{
  title?: string;
  subtitle?: string;
  showCTA?: boolean;
}> = ({
  title = 'Connected to 500+ Business Applications',
  subtitle = 'Seamlessly integrate with the tools your team already uses',
  showCTA = true,
}) => {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <h2 className="heading-section font-medium leading-tight tracking-[-0.02em] mb-4">
            <span className="text-ethos-navy">{title.split(' ').slice(0, 2).join(' ')} </span>
            <span className="text-gradient-purple-navy">{title.split(' ').slice(2).join(' ')}</span>
          </h2>
          <p className="text-body-large text-ethos-gray max-w-2xl mx-auto">{subtitle}</p>
        </div>

        {/* Marquee rows */}
        <div className="space-y-5 sm:space-y-6">
          <MarqueeRow integrations={row1Integrations} direction="left" speed={50} />
          <MarqueeRow integrations={row2Integrations} direction="right" speed={45} />
        </div>

        {/* CTA */}
        {showCTA && (
          <div className="text-center mt-8 sm:mt-10 md:mt-12">
            <p className="text-sm text-gray-500 mb-4">
              Plus hundreds more including custom API integrations
            </p>
            <a
              href="/contact?source=integrations"
              className="inline-flex items-center gap-2 text-ethos-purple hover:text-ethos-purple-dark
                         font-medium transition-colors duration-200"
            >
              <span>Discuss Your Integration Needs</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </section>
  );
};

export default IntegrationLogosMarquee;
