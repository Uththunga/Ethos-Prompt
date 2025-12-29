import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { Navigation } from "@/components/marketing/layout/Navigation";
import { Hero } from "@/components/marketing/sections/Hero";
import { ServiceFailuresSection } from "@/components/marketing/sections/ServiceFailuresSection";
import { WaysWeCanHelp } from "@/components/marketing/sections/WaysWeCanHelp";
import { PromptManagementBanner } from "@/components/marketing/sections/PromptManagementBanner";
import { Testimonials } from "@/components/marketing/sections/Testimonials";
import { HeaderCTA } from "@/components/marketing/sections/HeaderCTA";
import { Footer } from "@/components/marketing/layout/Footer";

export default function Index() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Handle scroll restoration when navigating back to sections
  useScrollRestoration();

  const handleGetStarted = () => {
    if (currentUser) {
      navigate('/admin');
    } else {
      // Auth modal will be handled by the auth context or navigation
      navigate('/login');
    }
  };
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Navigation />

      <main id="main-content" role="main" className="bg-white">
        {/* Hero Section */}
        <Hero />

        {/* Service Failures Prevention */}
        <ServiceFailuresSection />

        {/* Ways We Can Help */}
        <WaysWeCanHelp />

        {/* Prompt Management Banner */}
        <PromptManagementBanner onGetStarted={handleGetStarted} />

        {/* Testimonials */}
        <Testimonials />

        {/* Call to Action */}
        <HeaderCTA />
      </main>

      {/* Footer - No gap */}
      <Footer />
    </div>
  );
}
