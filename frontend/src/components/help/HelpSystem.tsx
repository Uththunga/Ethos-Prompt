/* eslint-disable react-refresh/only-export-components */

/**
 * Comprehensive In-App Help System
 * Provides contextual help, tooltips, guided tours, and onboarding
 */

import {
    ChevronLeftIcon,
    ChevronRightIcon,
    QuestionMarkCircleIcon,
    XMarkIcon,
} from '@/components/icons';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../marketing/ui/button';
import OnboardingService from '@/services/onboardingService';

// Help Context for managing help state
interface HelpContextType {
  isHelpMode: boolean;
  toggleHelpMode: () => void;
  showTooltip: (id: string, content: string, position?: TooltipPosition) => void;
  hideTooltip: () => void;
  startTour: (tourId: string) => void;
  currentTour: string | null;
  tourStep: number;
  nextTourStep: () => void;
  previousTourStep: () => void;
  endTour: () => void;
}

const HelpContext = createContext<HelpContextType | null>(null);

export const useHelp = () => {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error('useHelp must be used within a HelpProvider');
  }
  return context;
};

// Tooltip types and interfaces
type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipData {
  id: string;
  content: string;
  position: TooltipPosition;
  element?: HTMLElement;
}

interface TourStep {
  id: string;
  title: string;
  content: string;
  target: string;
  position: TooltipPosition;
  action?: () => void;
}

interface Tour {
  id: string;
  title: string;
  description: string;
  steps: TourStep[];
}

// Predefined tours
const TOURS: Record<string, Tour> = {
  'first-time-user': {
    id: 'first-time-user',
    title: 'Welcome to RAG Prompt Library!',
    description: "Let's take a quick tour to get you started",
    steps: [
      {
        id: 'welcome',
        title: 'Welcome!',
        content:
          'Welcome to RAG Prompt Library! This tour will show you the key features to get you started quickly.',
        target: 'body',
        position: 'bottom',
      },
      {
        id: 'navigation',
        title: 'Navigation',
        content:
          'Use this sidebar to navigate between different sections: Prompts, Documents, Analytics, and Settings.',
        target: '[data-help="main-navigation"]',
        position: 'right',
      },
      {
        id: 'create-prompt',
        title: 'Create Your First Prompt',
        content:
          'Click here to create your first prompt. Prompts are reusable templates that can generate dynamic content.',
        target: '[data-help="create-prompt-button"]',
        position: 'bottom',
      },
      {
        id: 'upload-documents',
        title: 'Upload Documents',
        content:
          'Upload documents here to enable RAG (Retrieval Augmented Generation) for context-aware AI responses.',
        target: '[data-help="upload-documents"]',
        position: 'bottom',
      },
      {
        id: 'help-center',
        title: 'Need Help?',
        content:
          'Click the help icon anytime to access tutorials, documentation, and support. You can also press "?" to toggle help mode.',
        target: '[data-help="help-button"]',
        position: 'left',
      },
    ],
  },
  'prompt-creation': {
    id: 'prompt-creation',
    title: 'Creating Your First Prompt',
    description: 'Learn how to create effective prompts',
    steps: [
      {
        id: 'prompt-title',
        title: 'Prompt Title',
        content: 'Give your prompt a descriptive title that explains what it does.',
        target: '[data-help="prompt-title"]',
        position: 'bottom',
      },
      {
        id: 'prompt-content',
        title: 'Prompt Content',
        content:
          'Write your prompt here. Use {{variable_name}} syntax to create dynamic variables.',
        target: '[data-help="prompt-content"]',
        position: 'right',
      },
      {
        id: 'prompt-variables',
        title: 'Variables',
        content:
          'Define variables that users can fill in when executing the prompt. This makes prompts reusable.',
        target: '[data-help="prompt-variables"]',
        position: 'left',
      },
      {
        id: 'prompt-settings',
        title: 'Model Settings',
        content:
          'Configure which AI model to use and adjust parameters like temperature and max tokens.',
        target: '[data-help="prompt-settings"]',
        position: 'top',
      },
    ],
  },
  'document-upload': {
    id: 'document-upload',
    title: 'Document Upload and RAG',
    description: 'Learn how to upload documents for RAG capabilities',
    steps: [
      {
        id: 'upload-area',
        title: 'Upload Documents',
        content:
          'Drag and drop files here or click to browse. Supported formats: PDF, TXT, DOCX, MD.',
        target: '[data-help="upload-area"]',
        position: 'bottom',
      },
      {
        id: 'processing-status',
        title: 'Processing Status',
        content:
          'Monitor document processing status here. Documents are automatically chunked and indexed for search.',
        target: '[data-help="processing-status"]',
        position: 'right',
      },
      {
        id: 'document-search',
        title: 'Document Search',
        content: 'Search through your uploaded documents to find relevant information quickly.',
        target: '[data-help="document-search"]',
        position: 'bottom',
      },
    ],
  },
};

// Help Provider Component
export const HelpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isHelpMode, setIsHelpMode] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [currentTour, setCurrentTour] = useState<string | null>(null);
  const [tourStep, setTourStep] = useState(0);

  // Resume in-progress tour on mount based on persisted state
  const hasResumedRef = React.useRef(false);
  useEffect(() => {
    if (!currentUser || hasResumedRef.current) return;
    (async () => {
      try {
        const state = await OnboardingService.getOnboardingState(currentUser.uid);
        if (state.currentTourId) {
          hasResumedRef.current = true;
          // Navigate and start tour, then set saved step
          startTour(state.currentTourId);
          setTimeout(() => {
            setTourStep(state.currentStep ?? 0);
          }, 800);
        }
      } catch (e) {
        console.warn('Failed to resume onboarding tour', e);
      }
    })();
  }, [currentUser]);

  // Keyboard shortcut for help mode
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Check if user is typing in an input field, textarea, or contenteditable element
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Only trigger help mode with "?" if user is NOT typing in an input field
      if (event.key === '?' && !event.ctrlKey && !event.metaKey && !isTyping) {
        event.preventDefault();
        setIsHelpMode((prev) => !prev);
      }
      if (event.key === 'Escape') {
        setIsHelpMode(false);
        setTooltip(null);
        setCurrentTour(null);
        setTourStep(0);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  // REMOVED: Automatic tour initialization - now handled by GuidedOnboarding component
  // This prevents the tour from starting before authentication

  // Contextual suggestions based on route
  const location = useLocation();
  useEffect(() => {
    if (!currentUser) return;
    const path = location.pathname;
    let message: string | null = null;
    let suggestionId = '';
    let targetHelpId: string | null = null;
    const position: TooltipPosition = 'top';

    if (path.startsWith('/dashboard/prompts')) {
      suggestionId = 'prompt-creation-suggestion';
      message =
        'Tip: Want a quick tour of Prompt Creation? Click the Help button (?) then Start Guided Tour.';
      targetHelpId = 'help-button';
    } else if (path.startsWith('/dashboard/documents')) {
      suggestionId = 'document-upload-suggestion';
      message =
        'Tip: Need help with document upload? Open Help (?), then start the Document Upload tour.';
      targetHelpId = 'help-button';
    } else if (path === '/dashboard') {
      suggestionId = 'first-time-suggestion';
      message = 'Welcome! Open Help (?) for a guided tour of the dashboard.';
      targetHelpId = 'help-button';
    }

    if (message && targetHelpId) {
      const seenKey = `onboarding_suggestion_seen_${currentUser.uid}_${suggestionId}`;
      if (!localStorage.getItem(seenKey)) {
        showTooltip(targetHelpId, message, position);
        localStorage.setItem(seenKey, 'true');

        try {
          OnboardingService.recordEvent({
            userId: currentUser.uid,
            type: 'suggestion_shown',
            ts: Date.now(),
            metadata: { path, suggestionId },
          });
        } catch (e) {
          console.warn('Failed to record suggestion_shown', e);
        }

        const id = setTimeout(() => {
          hideTooltip();
          try {
            OnboardingService.recordEvent({
              userId: currentUser.uid,
              type: 'suggestion_dismissed',
              ts: Date.now(),
              metadata: { path, suggestionId },
            });
          } catch (e) {
            console.warn('Failed to record suggestion_dismissed', e);
          }
        }, 7000);
        return () => clearTimeout(id);
      }
    }
  }, [location.pathname, currentUser]);

  const toggleHelpMode = () => {
    setIsHelpMode((prev) => !prev);
    setTooltip(null);
  };

  const showTooltip = (id: string, content: string, position: TooltipPosition = 'top') => {
    setTooltip({ id, content, position });
  };

  const hideTooltip = () => {
    setTooltip(null);
  };

  const startTour = (tourId: string) => {
    // Navigate to the correct page based on tour type
    if (tourId === 'prompt-creation') {
      navigate('/dashboard/prompts');
    } else if (tourId === 'document-upload') {
      navigate('/dashboard/documents');
    } else if (tourId === 'first-time-user') {
      navigate('/dashboard');
    }

    // Wait for navigation and DOM to update before starting tour
    setTimeout(async () => {
      setCurrentTour(tourId);
      setTourStep(0);
      setIsHelpMode(false);
      if (currentUser) {
        try {
          await OnboardingService.markTourStart(currentUser.uid, tourId);
        } catch (e) {
          console.warn('Onboarding markTourStart failed', e);
        }
      }
    }, 500);
  };

  const nextTourStep = () => {
    if (currentTour) {
      const tour = TOURS[currentTour];
      if (tourStep < tour.steps.length - 1) {
        const next = tourStep + 1;
        setTourStep(next);
        if (currentUser) {
          try {
            OnboardingService.markStepView(currentUser.uid, currentTour, next);
          } catch (e) {
            console.warn('Onboarding markStepView failed', e);
          }
        }
      } else {
        endTour();
      }
    }
  };

  const previousTourStep = () => {
    if (tourStep > 0) {
      setTourStep((prev) => prev - 1);
    }
  };

  const endTour = () => {
    const finishedTourId = currentTour;
    setCurrentTour(null);
    setTourStep(0);
    if (finishedTourId === 'first-time-user' && currentUser) {
      // Use user-specific key to track onboarding completion
      localStorage.setItem(`hasSeenOnboarding_${currentUser.uid}`, 'true');
    }
    if (finishedTourId && currentUser) {
      try {
        OnboardingService.markTourComplete(currentUser.uid, finishedTourId);
      } catch (e) {
        console.warn('Onboarding markTourComplete failed', e);
      }
    }
  };

  const contextValue: HelpContextType = {
    isHelpMode,
    toggleHelpMode,
    showTooltip,
    hideTooltip,
    startTour,
    currentTour,
    tourStep,
    nextTourStep,
    previousTourStep,
    endTour,
  };

  return (
    <HelpContext.Provider value={contextValue}>
      {children}
      {/* Onboarding entry point (welcome modal, path selection, contextual suggestions) */}
      <HelpOverlay />
      <TooltipRenderer tooltip={tooltip} />
      <TourRenderer />
    </HelpContext.Provider>
  );
};

// Help Overlay Component
const HelpOverlay: React.FC = () => {
  const { isHelpMode, toggleHelpMode, startTour } = useHelp();

  if (!isHelpMode) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ethos-offwhite/80 backdrop-blur-sm">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Help Mode Active</h2>
          <button onClick={toggleHelpMode} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <p className="text-gray-600 mb-4">
          Click on any element to see helpful information about it. Press ESC or click outside to
          exit help mode.
        </p>
        <div>
          <button
            onClick={() => {
              toggleHelpMode();
              setTimeout(() => startTour('first-time-user'), 100);
            }}
            className="w-full text-left p-2 rounded hover:bg-gray-50"
          >
            🎯 Take the Getting Started Tour
          </button>
          <button
            onClick={() => {
              toggleHelpMode();
              setTimeout(() => startTour('prompt-creation'), 100);
            }}
            className="w-full text-left p-2 rounded hover:bg-gray-50"
          >
            ✏️ Learn About Creating Prompts
          </button>
          <button
            onClick={() => {
              toggleHelpMode();
              setTimeout(() => startTour('document-upload'), 100);
            }}
            className="w-full text-left p-2 rounded hover:bg-gray-50"
          >
            📄 Learn About Document Upload
          </button>
        </div>
      </div>
    </div>
  );
};

// Tooltip Renderer Component
const TooltipRenderer: React.FC<{ tooltip: TooltipData | null }> = ({ tooltip }) => {
  const [style, setStyle] = useState<React.CSSProperties | null>(null);
  const [arrowSide, setArrowSide] = useState<TooltipPosition>('top');

  useEffect(() => {
    if (!tooltip) return;
    const el = document.querySelector(`[data-help="${tooltip.id}"]`) as HTMLElement | null;
    const gap = 8;

    if (!el) {
      // Fallback: pin near top-center if no target element is found
      setStyle({ top: 24, left: window.innerWidth / 2, transform: 'translateX(-50%)' });
      setArrowSide('top');
      return;
    }

    const rect = el.getBoundingClientRect();
    switch (tooltip.position) {
      case 'bottom':
        setStyle({
          top: rect.bottom + gap,
          left: rect.left + rect.width / 2,
          transform: 'translateX(-50%)',
        });
        setArrowSide('top');
        break;
      case 'left':
        setStyle({
          top: rect.top + rect.height / 2,
          left: rect.left - gap,
          transform: 'translate(-100%, -50%)',
        });
        setArrowSide('right');
        break;
      case 'right':
        setStyle({
          top: rect.top + rect.height / 2,
          left: rect.right + gap,
          transform: 'translateY(-50%)',
        });
        setArrowSide('left');
        break;
      case 'top':
      default:
        setStyle({
          top: rect.top - gap,
          left: rect.left + rect.width / 2,
          transform: 'translate(-50%, -100%)',
        });
        setArrowSide('bottom');
        break;
    }
  }, [tooltip]);

  if (!tooltip) return null;

  return (
    <div
      className="fixed z-50 bg-gray-900 text-white text-sm rounded-lg px-3 py-2 max-w-xs shadow-lg"
      style={style ?? { top: 24, left: window.innerWidth / 2, transform: 'translateX(-50%)' }}
    >
      {tooltip.content}
      <div
        className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
          arrowSide === 'top'
            ? '-top-1 left-1/2 -translate-x-1/2'
            : arrowSide === 'bottom'
            ? '-bottom-1 left-1/2 -translate-x-1/2'
            : arrowSide === 'left'
            ? '-left-1 top-1/2 -translate-y-1/2'
            : '-right-1 top-1/2 -translate-y-1/2'
        }`}
      />
    </div>
  );
};

// Tour Renderer Component
const TourRenderer: React.FC = () => {
  const { currentTour, tourStep, nextTourStep, previousTourStep, endTour } = useHelp();
  const [tooltipPosition, setTooltipPosition] = React.useState<{
    top: number;
    left: number;
    arrowPosition: 'top' | 'bottom' | 'left' | 'right';
  } | null>(null);
  const [targetElement, setTargetElement] = React.useState<HTMLElement | null>(null);

  const tour = currentTour ? TOURS[currentTour] : null;
  const step = tour ? tour.steps[tourStep] : null;

  // Calculate tooltip position based on target element
  React.useEffect(() => {
    if (!step) return;

    const element =
      step.target === 'body' ? null : (document.querySelector(step.target) as HTMLElement | null);

    if (!element) {
      console.warn(`Tour target not found: ${step.target}`);
      // Position in center of screen as fallback
      setTooltipPosition({
        top: window.innerHeight / 2 - 100,
        left: window.innerWidth / 2 - 200,
        arrowPosition: 'top',
      });
      setTargetElement(null);
      return;
    }

    setTargetElement(element);

    // Scroll element into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

    // Wait for scroll to complete
    setTimeout(() => {
      const rect = element.getBoundingClientRect();
      const tooltipWidth = 400;
      const tooltipHeight = 200;
      const padding = 20;

      let top = 0;
      let left = 0;
      let arrowPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';

      // Calculate position based on step.position
      switch (step.position) {
        case 'bottom':
          top = rect.bottom + padding;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          arrowPosition = 'top';
          break;
        case 'top':
          top = rect.top - tooltipHeight - padding;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          arrowPosition = 'bottom';
          break;
        case 'right':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.right + padding;
          arrowPosition = 'left';
          break;
        case 'left':
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.left - tooltipWidth - padding;
          arrowPosition = 'right';
          break;
      }

      // Ensure tooltip stays within viewport
      if (left < padding) left = padding;
      if (left + tooltipWidth > window.innerWidth - padding) {
        left = window.innerWidth - tooltipWidth - padding;
      }
      if (top < padding) top = padding;
      if (top + tooltipHeight > window.innerHeight - padding) {
        top = window.innerHeight - tooltipHeight - padding;
      }

      setTooltipPosition({ top, left, arrowPosition });
    }, 300);
  }, [step, tourStep]);

  if (!currentTour || !tour || !step) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop with spotlight cutout */}
      {targetElement ? (
        <>
          {/* Top overlay */}
          <div
            className="absolute left-0 right-0 bg-ethos-offwhite/80 backdrop-blur-sm"
            style={{
              top: 0,
              height: Math.max(targetElement.getBoundingClientRect().top - 12, 0),
            }}
            onClick={endTour}
            role="button"
            tabIndex={0}
            aria-label="Close tour"
            onKeyDown={(e) => {
              if (e.key === 'Escape') endTour();
            }}
          />

          {/* Bottom overlay */}
          <div
            className="absolute left-0 right-0 bottom-0 bg-ethos-offwhite/80 backdrop-blur-sm"
            style={{
              top: targetElement.getBoundingClientRect().bottom + 12,
            }}
            onClick={endTour}
            role="button"
            tabIndex={0}
            aria-label="Close tour"
            onKeyDown={(e) => {
              if (e.key === 'Escape') endTour();
            }}
          />

          {/* Left overlay */}
          <div
            className="absolute left-0 bg-ethos-offwhite/80 backdrop-blur-sm"
            style={{
              top: Math.max(targetElement.getBoundingClientRect().top - 12, 0),
              width: Math.max(targetElement.getBoundingClientRect().left - 12, 0),
              height: targetElement.getBoundingClientRect().height + 24,
            }}
            onClick={endTour}
            role="button"
            tabIndex={0}
            aria-label="Close tour"
            onKeyDown={(e) => {
              if (e.key === 'Escape') endTour();
            }}
          />

          {/* Right overlay */}
          <div
            className="absolute right-0 bg-ethos-offwhite/80 backdrop-blur-sm"
            style={{
              top: Math.max(targetElement.getBoundingClientRect().top - 12, 0),
              left: Math.min(targetElement.getBoundingClientRect().right + 12, window.innerWidth),
              height: targetElement.getBoundingClientRect().height + 24,
            }}
            onClick={endTour}
            role="button"
            tabIndex={0}
            aria-label="Close tour"
            onKeyDown={(e) => {
              if (e.key === 'Escape') endTour();
            }}
          />
        </>
      ) : (
        <div
          className="absolute inset-0 bg-ethos-offwhite/80 backdrop-blur-sm"
          onClick={endTour}
          role="button"
          tabIndex={0}
          aria-label="Close tour"
          onKeyDown={(e) => {
            if (e.key === 'Escape') endTour();
          }}
        />
      )}

      {/* Highlight target element */}
      {targetElement && (
        <div
          className="absolute border-4 border-ethos-purple rounded-lg pointer-events-none animate-pulse"
          style={{
            top: targetElement.getBoundingClientRect().top - 4,
            left: targetElement.getBoundingClientRect().left - 4,
            width: targetElement.getBoundingClientRect().width + 8,
            height: targetElement.getBoundingClientRect().height + 8,
            zIndex: 1,
          }}
        />
      )}

      {/* Tour Step Content */}
      {tooltipPosition && (
        <div
          className="absolute bg-white rounded-lg shadow-xl p-6 max-w-sm"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            width: '400px',
          }}
        >
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2 text-ethos-navy">{step.title}</h3>
            <p className="text-gray-600">{step.content}</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TourProgress currentStep={tourStep} totalSteps={tour.steps.length} />
              <div className="text-sm text-gray-500">
                Step {tourStep + 1} of {tour.steps.length}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={endTour}
                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Skip tour
              </button>

              {tourStep > 0 && (
                <button
                  onClick={previousTourStep}
                  className="flex items-center px-3 py-1 text-sm border rounded hover:bg-gray-50"
                >
                  <ChevronLeftIcon className="h-4 w-4 mr-1" />
                  Back
                </button>
              )}

              {tourStep < tour.steps.length - 1 ? (
                <Button onClick={nextTourStep} size="sm" className="flex items-center">
                  Next
                  <ChevronRightIcon className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <button
                  onClick={endTour}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Finish
                </button>
              )}
            </div>
          </div>

          <button
            onClick={endTour}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>

          {/* Arrow pointing to target */}
          <div
            className={`absolute w-4 h-4 bg-white transform rotate-45 ${
              tooltipPosition.arrowPosition === 'top'
                ? '-top-2 left-1/2 -translate-x-1/2'
                : tooltipPosition.arrowPosition === 'bottom'
                ? '-bottom-2 left-1/2 -translate-x-1/2'
                : tooltipPosition.arrowPosition === 'left'
                ? '-left-2 top-1/2 -translate-y-1/2'
                : '-right-2 top-1/2 -translate-y-1/2'
            }`}
          />
        </div>
      )}
    </div>
  );
};

// Help Button Component
export const HelpButton: React.FC = () => {
  const { toggleHelpMode } = useHelp();

  return (
    <button
      data-help="help-button"
      onClick={toggleHelpMode}
      className="fixed bottom-4 right-4 bg-ethos-purple text-white p-3 rounded-full shadow-lg hover:bg-ethos-purple/90 transition-colors z-40"
      title="Help"
    >
      <QuestionMarkCircleIcon className="h-6 w-6" />
    </button>
  );
};

// Help Trigger Component for specific elements
export const HelpTrigger: React.FC<{
  helpId: string;
  content: string;
  position?: TooltipPosition;
  children: React.ReactNode;
}> = ({ helpId, content, position = 'top', children }) => {
  const { isHelpMode, showTooltip } = useHelp();

  const handleClick = () => {
    if (isHelpMode) {
      showTooltip(helpId, content, position);
    }
  };

  return (
    <div
      data-help={helpId}
      onClick={handleClick}
      className={isHelpMode ? 'cursor-help ring-2 ring-blue-300 ring-opacity-50' : ''}
    >
      {children}
    </div>
  );
};

// Contextual Help Components
export const ContextualHelp: React.FC<{
  title: string;
  content: string;
  links?: Array<{ text: string; url: string }>;
}> = ({ title, content, links }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-gray-600 ml-1"
        title="Click for help"
      >
        <QuestionMarkCircleIcon className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 w-80 p-4 bg-white border border-gray-200 rounded-lg shadow-lg top-6 right-0">
            <h4 className="font-semibold mb-2">{title}</h4>
            <p className="text-sm text-gray-600 mb-3">{content}</p>
            {links && links.length > 0 && (
              <div>
                {links.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-ethos-purple hover:text-ethos-purple/80"
                  >
                    {link.text} →
                  </a>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Smart Tooltip Component
export const SmartTooltip: React.FC<{
  content: string;
  position?: TooltipPosition;
  delay?: number;
  children: React.ReactNode;
}> = ({ content, position = 'top', delay = 500, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  return (
    <div className="relative inline-block" onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap ${
            position === 'top'
              ? 'bottom-full mb-1 left-1/2 transform -translate-x-1/2'
              : position === 'bottom'
              ? 'top-full mt-1 left-1/2 transform -translate-x-1/2'
              : position === 'left'
              ? 'right-full mr-1 top-1/2 transform -translate-y-1/2'
              : 'left-full ml-1 top-1/2 transform -translate-y-1/2'
          }`}
        >
          {content}
          <div
            className={`absolute w-1 h-1 bg-gray-900 transform rotate-45 ${
              position === 'top'
                ? 'top-full left-1/2 -translate-x-1/2 -mt-0.5'
                : position === 'bottom'
                ? 'bottom-full left-1/2 -translate-x-1/2 -mb-0.5'
                : position === 'left'
                ? 'left-full top-1/2 -translate-y-1/2 -ml-0.5'
                : 'right-full top-1/2 -translate-y-1/2 -mr-0.5'
            }`}
          />
        </div>
      )}
    </div>
  );
};

// Progress Indicator for Tours
export const TourProgress: React.FC<{
  currentStep: number;
  totalSteps: number;
}> = ({ currentStep, totalSteps }) => {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: totalSteps }, (_, index) => (
        <div
          key={index}
          className={`w-2 h-2 rounded-full ${
            index <= currentStep ? 'bg-ethos-purple' : 'bg-gray-300'
          }`}
        />
      ))}
    </div>
  );
};

// Main HelpSystem Component
const HelpSystem: React.FC = () => {
  return (
    <>
      <HelpOverlay />
      <TooltipRenderer tooltip={null} />
      <TourRenderer />
    </>
  );
};

export default HelpSystem;
