/**
 * Floating Molē Icon Chat Component
 * Displays a floating chat icon that opens the marketing chat modal
 *
 * Performance: Uses lazy loading for MarketingChatModal (~433KB) and Moleicon (~50KB)
 * to reduce initial bundle size. Components load on demand.
 */
import React, { Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { detectAgentMode, getPageContext } from '@/utils/agentContext';
import { useMarketingChat } from '@/contexts/MarketingChatContext';

// Lazy load heavy components to reduce initial bundle size
const MarketingChatModal = React.lazy(() =>
  import('./MarketingChatModal').then(m => ({ default: m.MarketingChatModal }))
);
const Moleicon = React.lazy(() => import('@/components/marketing/ui/Moleicon'));

// Simple loading placeholder for the Moleicon
const MoleiconPlaceholder = () => (
  <div className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 animate-pulse" />
);


export const FloatingMoleiconChat = React.memo(function FloatingMoleiconChat() {
  const { isOpen, openChat, closeChat } = useMarketingChat();
  const location = useLocation();

  // Detect if we're on a marketing page (not dashboard)
  const agentMode = detectAgentMode(location.pathname);
  const pageContext = getPageContext(location.pathname);

  // Force body class sync on every location change - use layoutEffect for immediate application
  React.useLayoutEffect(() => {
    if (agentMode === 'marketing') {
      const hasClass = document.body.classList.contains('marketing-chat-open');
      if (isOpen && !hasClass) {
        console.log('[FloatingMoleiconChat] Adding marketing-chat-open class on', location.pathname);
        document.body.classList.add('marketing-chat-open');
      } else if (!isOpen && hasClass) {
        console.log('[FloatingMoleiconChat] Removing marketing-chat-open class on', location.pathname);
        document.body.classList.remove('marketing-chat-open');
      }
    }
  }, [location.pathname, isOpen, agentMode]);

  // Debug logging for staging
  if (import.meta.env.VITE_APP_ENVIRONMENT === 'staging') {
    console.log('[FloatingMoleiconChat] Pathname:', location.pathname);
    console.log('[FloatingMoleiconChat] Agent Mode:', agentMode);
    console.log('[FloatingMoleiconChat] Page Context:', pageContext);
  }

  // Only show on marketing pages
  if (agentMode !== 'marketing') {
    console.log('[FloatingMoleiconChat] Not showing - agentMode is:', agentMode);
    return null;
  }

  return (
    <>
      {/* Floating Chat Button with Custom Molē Icon - Hidden when chat is open */}
      {!isOpen && (
        <button
          onClick={openChat}
          className="group fixed bottom-4 right-4 md:bottom-6 md:right-6 transition-all duration-300 ease-out z-50 focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center hover:scale-110"
          aria-label="Open chat with molē"
          title="Chat with molē"
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            // Add safe area padding for mobile devices
            bottom: 'max(1rem, calc(env(safe-area-inset-bottom) + 1rem))',
          }}
        >
          <div className="h-14 w-14 md:h-16 md:w-16 transition-transform duration-300">
            <Suspense fallback={<MoleiconPlaceholder />}>
              <Moleicon hue={0} hoverIntensity={0.2} rotateOnHover={false} />
            </Suspense>
          </div>
        </button>
      )}

      {/* Chat Modal - Lazy loaded for performance */}
      <Suspense fallback={null}>
        <MarketingChatModal
          isOpen={isOpen}
          onClose={closeChat}
          pageContext={pageContext}
        />
      </Suspense>
    </>
  );
});
