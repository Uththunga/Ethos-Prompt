import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React, { Suspense, lazy } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserProfileProvider } from './contexts/UserProfileContext';
import { MarketingChatProvider } from './contexts/MarketingChatContext';

import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { ToastProvider } from './components/common/Toast';
import { HelpProvider } from './components/help/HelpSystem';
import { backgroundSync, queryClient } from './lib/queryClient';
// Lazy load development components to reduce main bundle size
const PerformanceMonitor = lazy(() =>
  import('./components/dev/PerformanceMonitor').then((m) => ({ default: m.PerformanceMonitor }))
);
const PerformanceWarning = lazy(() =>
  import('./components/dev/PerformanceMonitor').then((m) => ({ default: m.PerformanceWarning }))
);
const APIPerformanceMonitor = lazy(() =>
  import('./components/dev/APIPerformanceMonitor').then((m) => ({
    default: m.APIPerformanceMonitor,
  }))
);
const APIPerformanceAlerts = lazy(() =>
  import('./components/dev/APIPerformanceMonitor').then((m) => ({
    default: m.APIPerformanceAlerts,
  }))
);
const WebVitalsDashboard = lazy(() =>
  import('./components/dev/WebVitalsDashboard').then((m) => ({ default: m.WebVitalsDashboard }))
);
const PerformanceDashboard = lazy(() =>
  import('./components/dev/PerformanceDashboard').then((m) => ({ default: m.PerformanceDashboard }))
);

// Import debug tools for development
import './utils/debugTools';
import { ScrollToTop } from '@/components/marketing/ui/ScrollToTop';

// Import chunk error handler for safe lazy loading
// Lazy load marketing components
const FloatingMoleiconChat = lazy(() =>
  import('@/components/marketing/FloatingMoleiconChat').then((m) => ({
    default: m.FloatingMoleiconChat,
  }))
);
const ShinyTextTest = lazy(() => import('@/components/marketing/ui/ShinyTextTest'));

// Marketing-only pages retained
const BetaSignup = lazy(() =>
  import('./pages/BetaSignup').then((m) => ({ default: m.BetaSignup }))
);

// Marketing pages from zen-home migration (using correct export patterns)
const MarketingHome = lazy(() => import('./pages/marketing/Index')); // default export
const Contact = lazy(() => import('./pages/marketing/Contact')); // has default export
const PromptingGuide = lazy(() =>
  import('./pages/marketing/PromptingGuide').then((m) => ({ default: m.PromptingGuide }))
); // named export
const Basics = lazy(() => import('./pages/marketing/Basics').then((m) => ({ default: m.Basics }))); // named export
const Techniques = lazy(() =>
  import('./pages/marketing/Techniques').then((m) => ({ default: m.Techniques }))
); // named export
const Faq = lazy(() => import('./pages/marketing/FAQ')); // has default export
const MarketingHelpCenter = lazy(() => import('./pages/marketing/HelpCenter')); // has default export for marketing
const ContactsPage = lazy(() => import('./pages/admin/ContactsPage'));
const MyContactsPage = lazy(() => import('./pages/admin/MyContactsPage'));
const ContactDetailPage = lazy(() => import('./pages/admin/ContactDetailPage'));
const EmailTemplatesPage = lazy(() => import('./pages/admin/EmailTemplatesPage'));
const EmailSequencesPage = lazy(() => import('./pages/admin/EmailSequencesPage'));
const EmailJobsPage = lazy(() => import('./pages/admin/EmailJobsPage'));
const QuotationsPage = lazy(() => import('./pages/admin/QuotationsPage'));
const QuotationDetailPage = lazy(() => import('./pages/admin/QuotationDetailPage'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));

// Core service pages
const SmartBusinessAssistant = lazy(() => import('./pages/marketing/SmartBusinessAssistant')); // default export
const SystemIntegration = lazy(() => import('./pages/marketing/SystemIntegration')); // default export
const IntelligentApplications = lazy(() => import('./pages/marketing/IntelligentApplications')); // default export
const PrivacyPolicy = lazy(() => import('./pages/marketing/PrivacyPolicy')); // has default export
const TermsOfService = lazy(() => import('./pages/marketing/TermsOfService')); // has default export
const CookiePolicy = lazy(() => import('./pages/marketing/CookiePolicy')); // has default export
const AboutUs = lazy(() => import('./pages/marketing/AboutUs')); // default export
const PromptLibraryLanding = lazy(() =>
  import('./pages/marketing/PromptLibraryLanding').then((m) => ({
    default: m.PromptLibraryLanding,
  }))
); // named export
const AuthPage = lazy(() => import('./pages/marketing/AuthPage'));
// Note: MarketingNotFound component available if needed for 404 handling

// Protected Route component
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const isBuildE2E = import.meta.env.VITE_E2E_MODE === 'true';
  // Runtime E2E/auth override (opt-in only)
  const isRuntimeE2E = (() => {
    try {
      return localStorage.getItem('e2eAuth') === 'true';
    } catch {
      return false;
    }
  })();

  if (loading && !(isBuildE2E || isRuntimeE2E)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return currentUser || isBuildE2E || isRuntimeE2E ? <>{children}</> : <Navigate to="/auth" />;
};



function App() {
  // Enable background sync for offline support
  React.useEffect(() => {
    backgroundSync.enable();
    return () => backgroundSync.disable();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
              <UserProfileProvider>
                <MarketingChatProvider>
                  <HelpProvider>
                      <div className="App">
                        <ScrollToTop />
                        <Routes>
                        {/* Marketing home page - root path */}
                        <Route
                          path="/"
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <MarketingHome />
                            </Suspense>
                          }
                        />

                        {/* Marketing pages */}
                        <Route
                          path="/solutions"
                          element={<Navigate to="/intelligent-applications" replace />}
                        />
                        <Route
                          path="/prompt-library"
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <PromptLibraryLanding />
                            </Suspense>
                          }
                        />

                        {/* Dedicated Auth routes (modal). Include /login alias for E2E/backward-compat */}
                        <Route
                          path="/auth"
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <AuthPage />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/login"
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <AuthPage />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/contact"
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <Contact />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/guides"
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <PromptingGuide />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/guides/basics"
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <Basics />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/guides/techniques"
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <Techniques />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/faq"
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <Faq />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/help"
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <MarketingHelpCenter />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/about"
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <AboutUs />
                            </Suspense>
                          }
                        />

                        {/* Core Services - Root level routes */}
                        <Route
                          path="/smart-business-assistant"
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <SmartBusinessAssistant />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/system-integration"
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <SystemIntegration />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/intelligent-applications"
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <IntelligentApplications />
                            </Suspense>
                          }
                        />

                        {/* Redirects for archived pages */}
                        <Route
                          path="/digital-transformation"
                          element={<Navigate to="/intelligent-applications" replace />}
                        />
                        <Route
                          path="/digital-solutions"
                          element={<Navigate to="/intelligent-applications" replace />}
                        />

                        {/* Legacy /services/ routes - Keep for backward compatibility */}
                        <Route
                          path="/services/smart-assistant"
                          element={<Navigate to="/smart-business-assistant" replace />}
                        />
                        <Route
                          path="/services/system-integration"
                          element={<Navigate to="/system-integration" replace />}
                        />
                        <Route
                          path="/services/digital-solutions"
                          element={<Navigate to="/intelligent-applications" replace />}
                        />
                        <Route
                          path="/services/digital-transformation"
                          element={<Navigate to="/intelligent-applications" replace />}
                        />
                        <Route
                          path="/services/intelligent-applications"
                          element={<Navigate to="/intelligent-applications" replace />}
                        />
                        <Route
                          path="/privacy"
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <PrivacyPolicy />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/terms"
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <TermsOfService />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/cookies"
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <CookiePolicy />
                            </Suspense>
                          }
                        />

                        {/* Test route for ShinyText component */}
                        <Route
                          path="/test/shiny-text"
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <ShinyTextTest />
                            </Suspense>
                          }
                        />

                        {/* Ensure all assets are loaded */}
                        <Route
                          path="/assets/:filename"
                          element={<Navigate to="/static/assets/:filename" />}
                        />

                        {/* Beta signup route */}
                        <Route
                          path="/beta-signup"
                          element={
                            <Suspense fallback={<LoadingSpinner />}>
                              <BetaSignup />
                            </Suspense>
                          }
                        />


                        {/* E2E test routes (enabled for staging validation) */}
                        <>
                          <Route
                            path="/e2e-auth"
                            element={
                              <Suspense fallback={<LoadingSpinner />}>
                                {React.createElement(
                                  React.lazy(() => import('./pages/test/E2EAuth'))
                                )}
                              </Suspense>
                            }
                          />

                        </>


                        {/* Admin routes - KEEPING FOR MARKETING MANAGEMENT */}
                        <Route
                          path="/admin"
                          element={
                            <ProtectedRoute>
                              <Suspense fallback={<LoadingSpinner />}>
                                <AdminLayout />
                              </Suspense>
                            </ProtectedRoute>
                          }
                        >
                          <Route index element={<Navigate to="/admin/quotations" replace />} />
                          <Route
                            path="quotations"
                            element={
                              <Suspense fallback={<LoadingSpinner />}>
                                <QuotationsPage />
                              </Suspense>
                            }
                          />
                          <Route
                            path="quotations/:id"
                            element={
                              <Suspense fallback={<LoadingSpinner />}>
                                <QuotationDetailPage />
                              </Suspense>
                            }
                          />
                          <Route
                            path="contacts"
                            element={
                              <Suspense fallback={<LoadingSpinner />}>
                                <ContactsPage />
                              </Suspense>
                            }
                          />
                          <Route
                            path="contacts/:id"
                            element={
                              <Suspense fallback={<LoadingSpinner />}>
                                <ContactDetailPage />
                              </Suspense>
                            }
                          />
                          <Route
                            path="my-contacts"
                            element={
                              <Suspense fallback={<LoadingSpinner />}>
                                <MyContactsPage />
                              </Suspense>
                            }
                          />
                          <Route
                            path="email-templates"
                            element={
                              <Suspense fallback={<LoadingSpinner />}>
                                <EmailTemplatesPage />
                              </Suspense>
                            }
                          />
                          <Route
                            path="email-sequences"
                            element={
                              <Suspense fallback={<LoadingSpinner />}>
                                <EmailSequencesPage />
                              </Suspense>
                            }
                          />
                          <Route
                            path="email-jobs"
                            element={
                              <Suspense fallback={<LoadingSpinner />}>
                                <EmailJobsPage />
                              </Suspense>
                            }
                          />
                        </Route>

                        {/* Catch all route */}
                        <Route path="*" element={<Navigate to="/" />} />
                      </Routes>

                      {/* Floating Molē Chat - AI assistant for marketing pages */}
                      <Suspense fallback={null}>
                        <FloatingMoleiconChat />
                      </Suspense>
                    </div>
                  </HelpProvider>
                </MarketingChatProvider>
            </UserProfileProvider>
          </AuthProvider>
        </Router>

          {/* Development Performance Monitoring - Only in development (disabled in E2E mode) */}
          {import.meta.env.DEV &&
            import.meta.env.VITE_SHOW_DEV_OVERLAYS !== 'false' &&
            import.meta.env.VITE_E2E_MODE !== 'true' && (
              <Suspense fallback={null}>
                <PerformanceMonitor />
                <PerformanceWarning />
                <APIPerformanceMonitor />
                <APIPerformanceAlerts />
                <WebVitalsDashboard />
                <PerformanceDashboard />
              </Suspense>
            )}
        </ToastProvider>

        {/* React Query DevTools - only in development (disabled in E2E mode) */}
        {import.meta.env.VITE_E2E_MODE !== 'true' && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
