/**
 * Guided Onboarding Component
 * Provides step-by-step onboarding for new users after authentication
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../marketing/ui/button';
import { useHelp } from './HelpSystem';
import OnboardingService, { type OnboardingPathId } from '@/services/onboardingService';

import { PlayCircleIcon, DocumentTextIcon, CogIcon } from '@/components/icons';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: string;
  completed: boolean;
  optional?: boolean;
}

interface OnboardingData {
  currentStep: number;
  completedSteps: string[];
  skippedOnboarding: boolean;
  userId?: string; // Track which user this onboarding data belongs to
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to RAG Prompt Library',
    description: 'Take a quick tour to learn the basics',
    icon: PlayCircleIcon,
    action: 'Start Tour',
    completed: false,
  },
  {
    id: 'create-prompt',
    title: 'Create Your First Prompt',
    description: 'Learn how to create reusable AI prompts',
    icon: DocumentTextIcon,
    action: 'Create Prompt',
    completed: false,
  },
  {
    id: 'upload-document',
    title: 'Upload a Document',
    description: 'Enable RAG by uploading your first document',
    icon: DocumentTextIcon,
    action: 'Upload Document',
    completed: false,
    optional: true,
  },
  {
    id: 'configure-settings',
    title: 'Configure Your Settings',
    description: 'Set up your API keys and preferences',
    icon: CogIcon,

    action: 'Open Settings',
    completed: false,
    optional: true,
  },
];

// Role-based onboarding paths
const ONBOARDING_PATHS: Array<{
  id: OnboardingPathId;
  title: string;
  description: string;
  route: string;
  tourId: string;
}> = [
  {
    id: 'quick-start',
    title: 'Quick Start',
    description: '3-minute overview of the dashboard and key actions',
    route: '/dashboard',
    tourId: 'first-time-user',
  },
  {
    id: 'prompt-creator',
    title: 'Prompt Creator',
    description: 'Focus on building and managing reusable prompts',
    route: '/dashboard/prompts',
    tourId: 'prompt-creation',
  },
  {
    id: 'rag-expert',
    title: 'RAG Expert',
    description: 'Upload and manage documents for retrieval-augmented generation',
    route: '/dashboard/documents',
    tourId: 'document-upload',
  },
  {
    id: 'api-developer',
    title: 'API Developer',
    description: 'Integrate EthosPrompt into your stack using API workflows',
    route: '/dashboard',
    tourId: 'first-time-user',
  },
];

interface GuidedOnboardingProps {
  isFirstTimeUser?: boolean;
  onComplete?: () => void;
}

export const GuidedOnboarding: React.FC<GuidedOnboardingProps> = ({
  isFirstTimeUser = false,
  onComplete,
}) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const { startTour } = useHelp();
  const [selectedPath, setSelectedPath] = useState<OnboardingPathId | null>(null);

  const handleSelectPath = async (pathId: OnboardingPathId) => {
    try {
      setSelectedPath(pathId);
      if (currentUser) {
        await OnboardingService.updateOnboardingState(currentUser.uid, {
          hasSeenWelcome: true,
          selectedPath: pathId,
        });
        await OnboardingService.recordEvent({
          userId: currentUser.uid,
          type: 'path_selected',
          pathId,
          ts: Date.now(),
        });
      }
      const path = ONBOARDING_PATHS.find((p) => p.id === pathId);
      if (path) {
        navigate(path.route);
        if (currentUser)
          await OnboardingService.markTourStart(currentUser.uid, path.tourId, pathId);
        startTour(path.tourId);
      }
      setIsVisible(false);
      onComplete?.();
    } catch (e) {
      console.error('Failed to start selected onboarding path', e);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!currentUser) return;
      try {
        const state = await OnboardingService.getOnboardingState(currentUser.uid);
        if (!cancelled) {
          // Show welcome modal if user hasn't seen it yet
          setIsVisible(!state.hasSeenWelcome);
        }
      } catch (e) {
        console.warn('Failed to load onboarding state', e);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  const skipOnboarding = async () => {
    if (currentUser) {
      try {
        await OnboardingService.updateOnboardingState(currentUser.uid, { hasSeenWelcome: true });
      } catch (e) {
        console.warn('Failed to persist onboarding skip', e);
      }
    }
    setIsVisible(false);
    onComplete?.();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ethos-offwhite/80 backdrop-blur-sm">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Welcome to EthosPrompt</h2>
              <p className="text-gray-600 mt-1">
                Choose a path below to start an interactive guided tour tailored to your goals.
              </p>
            </div>
          </div>
        </div>

        {/* Choose your path */}
        <div className="p-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ONBOARDING_PATHS.map((p) => (
              <div
                key={p.id}
                className={`border rounded-lg p-4 bg-white flex items-start justify-between ${
                  selectedPath === p.id ? 'ring-2 ring-ethos-purple' : ''
                }`}
              >
                <div>
                  <div className="font-semibold text-gray-900">{p.title}</div>
                  <div className="text-sm text-gray-600">{p.description}</div>
                </div>
                <Button size="sm" onClick={() => handleSelectPath(p.id)}>
                  Start
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={skipOnboarding}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              Skip for now
            </button>

            <button
              onClick={() => setIsVisible(false)}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidedOnboarding;
