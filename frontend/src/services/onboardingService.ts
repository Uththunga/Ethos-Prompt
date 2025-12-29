import { db } from '@/config/firebase';
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

export type OnboardingPathId = 'quick-start' | 'prompt-creator' | 'rag-expert' | 'api-developer';

export interface OnboardingState {
  userId: string;
  hasSeenWelcome: boolean;
  selectedPath?: OnboardingPathId;
  currentTourId?: string | null;
  currentStep?: number;
  completedTours: string[];
  dismissedSuggestions: string[];
  analytics: {
    startedAt?: number;
    completedAt?: number;
    totalTimeSpentMs?: number;
    dropOff?: { tourId: string; stepIndex: number } | null;
  };
  updatedAt: number;
}

export type OnboardingEventType =
  | 'path_selected'
  | 'tour_started'
  | 'step_viewed'
  | 'tour_completed'
  | 'tour_skipped'
  | 'suggestion_shown'
  | 'suggestion_accepted'
  | 'suggestion_dismissed';

export interface OnboardingEvent {
  userId: string;
  type: OnboardingEventType;
  pathId?: OnboardingPathId;
  tourId?: string;
  stepIndex?: number;
  metadata?: Record<string, unknown>;
  ts: number;
}

const onboardingDocRef = (userId: string) => doc(db, 'onboarding', userId);
const eventsColRef = () => collection(db, 'onboardingEvents');

const cleanOnboardingPartial = (partial: Partial<OnboardingState>): Partial<OnboardingState> => {
  const cleaned: Partial<OnboardingState> = {};
  Object.entries(partial).forEach(([key, value]) => {
    if (value !== undefined) {
      (cleaned as Record<string, unknown>)[key] = value;
    }
  });
  return cleaned;
};

export const OnboardingService = {
  async getOnboardingState(userId: string): Promise<OnboardingState> {
    const snap = await getDoc(onboardingDocRef(userId));
    if (snap.exists()) {
      const data = snap.data() as Partial<OnboardingState>;
      // Fill defaults
      return {
        userId,
        hasSeenWelcome: data.hasSeenWelcome ?? false,
        selectedPath: data.selectedPath,
        currentTourId: data.currentTourId ?? null,
        currentStep: data.currentStep ?? 0,
        completedTours: data.completedTours ?? [],
        dismissedSuggestions: data.dismissedSuggestions ?? [],
        analytics: data.analytics ?? {},
        updatedAt: data.updatedAt ?? Date.now(),
      };
    }
    const init: OnboardingState = {
      userId,
      hasSeenWelcome: false,
      currentTourId: null,
      currentStep: 0,
      completedTours: [],
      dismissedSuggestions: [],
      analytics: {},
      updatedAt: Date.now(),
    };
    await setDoc(
      onboardingDocRef(userId),
      { ...cleanOnboardingPartial(init), createdAt: serverTimestamp() },
      { merge: true }
    );
    return init;
  },

  async updateOnboardingState(userId: string, partial: Partial<OnboardingState>): Promise<void> {
    await setDoc(
      onboardingDocRef(userId),
      { ...cleanOnboardingPartial(partial), updatedAt: Date.now() },
      { merge: true }
    );
  },

  async recordEvent(event: OnboardingEvent): Promise<void> {
    const payload = { ...event, serverTs: serverTimestamp() };
    await addDoc(eventsColRef(), payload);
  },

  async markTourStart(userId: string, tourId: string, pathId?: OnboardingPathId): Promise<void> {
    await this.updateOnboardingState(userId, {
      currentTourId: tourId,
      currentStep: 0,
      analytics: { startedAt: Date.now() },
    });
    await this.recordEvent({ userId, type: 'tour_started', tourId, pathId, ts: Date.now() });
  },

  async markStepView(userId: string, tourId: string, stepIndex: number): Promise<void> {
    await this.updateOnboardingState(userId, { currentTourId: tourId, currentStep: stepIndex });
    await this.recordEvent({ userId, type: 'step_viewed', tourId, stepIndex, ts: Date.now() });
  },

  async markTourComplete(userId: string, tourId: string): Promise<void> {
    const ref = onboardingDocRef(userId);
    const current = await this.getOnboardingState(userId);
    const merged = Array.from(new Set([...(current.completedTours ?? []), tourId]));
    await setDoc(
      ref,
      {
        completedTours: merged,
        currentTourId: null,
        currentStep: 0,
        updatedAt: Date.now(),
        analytics: { ...(current.analytics || {}), completedAt: Date.now() },
      },
      { merge: true }
    );
    await this.recordEvent({ userId, type: 'tour_completed', tourId, ts: Date.now() });
  },

  async markTourSkipped(userId: string, tourId: string): Promise<void> {
    await this.recordEvent({ userId, type: 'tour_skipped', tourId, ts: Date.now() });
  },
};

export default OnboardingService;
