import React from 'react';
import { useMemo } from 'react';

export const ApplicationGrid = () => {
  // For assets in the public directory, we should use the Vite base URL
  const baseUrl = import.meta.env.BASE_URL || '/';
  
  // Memoize applications with proper base URL paths
  const applications = useMemo(() => [
    {
      name: "Gmail",
      icon: `${baseUrl}assets/images/apps/a01056c5417589299aa0d89ebf0bc5a348f52314.png`,
      size: "large"
    },
    {
      name: "Sheets",
      icon: `${baseUrl}assets/images/apps/52292894569e7f37c0b69946ab8c5429e1f96307.png`,
      size: "medium"
    },
    {
      name: "Slack",
      icon: `${baseUrl}assets/images/apps/4a6d122bf151006540d72aed54a840ca14f97db0.png`,
      size: "large"
    },
    {
      name: "Trello",
      icon: `${baseUrl}assets/images/apps/9668aff77519f235c9c3134d731202f1fabcf0c1.png`,
      size: "small"
    },
    {
      name: "HubSpot",
      icon: `${baseUrl}assets/images/apps/08e3fbd29ab7e16993b5eb35905fed2571c7a237.png`,
      size: "medium"
    },
    {
      name: "Salesforce",
      icon: `${baseUrl}assets/images/apps/b91990337f3bd453ed083836bac9de6778e4cdbc.png`,
      size: "large"
    },
    {
      name: "Stripe",
      icon: `${baseUrl}assets/images/apps/d37d441044f443f2ccda3f7116857ce26606aba2.png`,
      size: "medium"
    },
    {
      name: "Facebook",
      icon: `${baseUrl}assets/images/apps/7d110ffe984cbef349fa3bb197ef8a85f9156fad.png`,
      size: "medium"
    },
    {
      name: "Outlook",
      icon: `${baseUrl}assets/images/apps/39762a7e8f84d977bb6f8ae5e2c9fccd7d71efca.png`,
      size: "medium"
    },
    {
      name: "Twitter",
      icon: `${baseUrl}assets/images/apps/aa3d554956506885c89ca86cc2dfca1f10ff997c.png`,
      size: "medium"
    },
    {
      name: "Jira",
      icon: `${baseUrl}assets/images/apps/a75890ae5a96c2fde7b38cebc7c810fb6f395201.png`,
      size: "small"
    },
    {
      name: "Microsoft Teams",
      icon: `${baseUrl}assets/images/apps/19221c3058ddd5f299c09e2f5da69fe75c8840d7.png`,
      size: "small"
    }
  ], [baseUrl]);

  const getSizeClasses = (size: string) => {
    switch (size) {
      case "large":
        return "w-12 h-12 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 xl:w-24 xl:h-24";
      case "medium":
        return "w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-20 xl:h-20";
      case "small":
        return "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16";
      default:
        return "w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-20 xl:h-20";
    }
  };

  return (
    <section className="relative max-w-7xl mx-auto" aria-labelledby="applications-heading">
      <h2 id="applications-heading" className="sr-only">Integrated Applications</h2>
      
      {/* Floating Application Icons in a Creative Layout */}
      <div 
        className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-8 items-center justify-items-center min-h-[250px] sm:min-h-[300px] md:min-h-[350px] lg:min-h-[400px] p-4 sm:p-6 lg:p-8"
        role="list"
        aria-label="Application integrations available"
      >
        {applications.map((app, index) => (
          <div
            key={app.name}
            className={`${getSizeClasses(app.size)} bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center p-1.5 sm:p-2 hover:scale-110 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:ring-offset-2 touch-manipulation`}
            style={{
              transform: `translateY(${Math.min((index % 3) * 15, 30) - 15}px) rotate(${Math.min((index % 5) * 2, 6) - 3}deg)`,
              zIndex: applications.length - index
            }}
            role="listitem"
            aria-label={`${app.name} application integration`}
            tabIndex={0}
          >
            <img
              src={app.icon}
              alt={`${app.name} logo`}
              className="w-full h-full object-contain rounded-full"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {/* Floating Animation Effect */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-ethos-purple/10 to-ethos-purple-light/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-gradient-to-r from-ethos-purple-light/10 to-ethos-purple/10 rounded-full blur-xl animate-pulse delay-300"></div>
      </div>
    </section>
  );
};
