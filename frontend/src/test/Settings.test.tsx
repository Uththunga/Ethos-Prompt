 

import { render, screen, waitFor, fireEvent } from './test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../contexts/AuthContext';
import { Settings } from '../pages/Settings';
import { settingsService } from '../services/settingsService';

// Mock the auth context
vi.mock('../contexts/AuthContext');
const mockUseAuth = vi.mocked(useAuth);

// Mock the settings service
vi.mock('../services/settingsService');
const mockSettingsService = vi.mocked(settingsService);

// Mock the HelpSystem hook to avoid requiring a real HelpProvider/router
vi.mock('../components/help/HelpSystem', () => ({
  useHelp: () => ({ startTour: () => {} }),
}));

// Also mock onboardingService used by HelpSystem/GuidedOnboarding to avoid Firestore calls
vi.mock('@/services/onboardingService', () => ({
  default: {
    getOnboardingState: vi
      .fn()
      .mockResolvedValue({ hasSeenWelcome: true, currentTourId: null, currentStep: 0 }),
    updateOnboardingState: vi.fn().mockResolvedValue(undefined),
    recordEvent: vi.fn().mockResolvedValue(undefined),
    markTourStart: vi.fn().mockResolvedValue(undefined),
    markTourComplete: vi.fn().mockResolvedValue(undefined),
    markStepView: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock the LoadingSpinner component
vi.mock('../components/common/LoadingSpinner', () => ({
  LoadingSpinner: ({ 'data-testid': dataTestId }: { 'data-testid'?: string }) => (
    <div data-testid={dataTestId || 'loading-spinner'}>Loading...</div>
  ),
}));

// Mock the ApiKeyModal component
vi.mock('../components/settings/ApiKeyModal', () => ({
  ApiKeyModal: ({ isOpen, onClose, onSave }: any) =>
    isOpen ? (
      <div data-testid="api-key-modal">
        <button onClick={onClose} data-testid="modal-close">
          Close
        </button>
        <button
          onClick={() => onSave({ name: 'Test Key', provider: 'OpenAI', key: 'sk-test123' })}
          data-testid="modal-save"
        >
          Save
        </button>
      </div>
    ) : null,
}));

const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
};

const mockSettings = {
  profile: {
    displayName: 'Test User',
    email: 'test@example.com',
    timezone: 'America/New_York',
    language: 'en',
  },
  apiKeys: [
    {
      id: 'key-1',
      name: 'Test OpenAI Key',
      provider: 'OpenAI',
      masked: 'sk-****123',
      lastUsed: '2024-01-01T00:00:00.000Z',
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  ],
  notifications: {
    emailNotifications: true,
    promptSharing: true,
    systemUpdates: false,
    weeklyDigest: true,
    marketingEmails: false,
    securityAlerts: true,
  },
  privacy: {
    profileVisibility: 'public' as const,
    allowAnalytics: true,
    shareUsageData: false,
    showOnlineStatus: true,
    allowDirectMessages: true,
  },
  billing: {
    plan: 'free' as const,
    status: 'active' as const,
    currentPeriodEnd: '2024-02-01T00:00:00.000Z',
    paymentMethod: null,
  },
};

describe('Settings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      currentUser: mockUser,
      loading: false,
      signup: vi.fn(),
      login: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    mockSettingsService.getOrCreateUserSettings.mockResolvedValue(mockSettings);
    mockSettingsService.validateSettings.mockReturnValue({ isValid: true, errors: [] });
    mockSettingsService.updateUserSettings.mockResolvedValue();
    mockSettingsService.maskApiKey.mockReturnValue('sk-****123');
  });

  it('renders loading state initially', async () => {
    render(<Settings />);

    expect(screen.getByTestId('settings-loading')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders settings after loading', async () => {
    render(<Settings />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
      expect(
        screen.getByText('Manage your account preferences and configuration')
      ).toBeInTheDocument();
    });
  });

  it('renders all sections', async () => {
    render(<Settings />);

    await waitFor(() => {
      expect(screen.getByText('API Keys')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Privacy')).toBeInTheDocument();
      expect(screen.getByText('Billing')).toBeInTheDocument();
      expect(screen.getByText('Onboarding')).toBeInTheDocument();
    });
  });

  it('displays section content', async () => {
    render(<Settings />);

    await waitFor(() => {
      expect(
        screen.getByText(/Manage your AI provider API keys for prompt execution/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Choose what notifications you want to receive/i)
      ).toBeInTheDocument();
    });
  });

  it('enables save button after a change', async () => {
    render(<Settings />);

    const saveButton = await screen.findByRole('button', { name: /save changes/i });
    expect(saveButton).toBeDisabled();

    // Toggle one notification switch (first toggle-like button)
    const toggle = screen
      .getAllByRole('button')
      .find((btn) => btn.className.includes('w-11') && btn.className.includes('rounded-full')) as
      | HTMLButtonElement
      | undefined;
    expect(toggle).toBeTruthy();
    if (toggle) {
      fireEvent.click(toggle);
    }

    await waitFor(() => {
      expect(saveButton).not.toBeDisabled();
    });
  });

  it('saves settings successfully', async () => {
    render(<Settings />);

    const saveButton = await screen.findByRole('button', { name: /save changes/i });

    // Make a change to enable saving
    const toggle = screen
      .getAllByRole('button')
      .find((btn) => btn.className.includes('w-11') && btn.className.includes('rounded-full')) as
      | HTMLButtonElement
      | undefined;
    if (toggle) {
      fireEvent.click(toggle);
    }

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSettingsService.updateUserSettings).toHaveBeenCalledWith(
        mockUser.uid,
        expect.objectContaining({
          notifications: expect.any(Object),
        })
      );
    });
  });

  it('displays validation errors', async () => {
    mockSettingsService.validateSettings.mockReturnValue({
      isValid: false,
      errors: ['Display name is required', 'Invalid timezone'],
    });

    render(<Settings />);

    const saveButton = await screen.findByRole('button', { name: /save changes/i });

    // Make a change so Save becomes enabled
    const toggle = screen
      .getAllByRole('button')
      .find((btn) => btn.className.includes('w-11') && btn.className.includes('rounded-full')) as
      | HTMLButtonElement
      | undefined;
    if (toggle) {
      fireEvent.click(toggle);
    }

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Display name is required')).toBeInTheDocument();
      expect(screen.getByText('Invalid timezone')).toBeInTheDocument();
    });
  });

  it('opens API key modal', async () => {
    render(<Settings />);

    const addButton = await screen.findByText('Add API Key');
    fireEvent.click(addButton);

    expect(screen.getByTestId('api-key-modal')).toBeInTheDocument();
  });

  it('adds new API key', async () => {
    mockSettingsService.addApiKey.mockResolvedValue('new-key-id');

    render(<Settings />);

    const addButton = await screen.findByText('Add API Key');
    fireEvent.click(addButton);
    fireEvent.click(screen.getByTestId('modal-save'));

    await waitFor(() => {
      expect(mockSettingsService.addApiKey).toHaveBeenCalledWith(mockUser.uid, {
        name: 'Test Key',
        provider: 'OpenAI',
        key: 'sk-test123',
      });
    });
  });

  it('removes API key', async () => {
    mockSettingsService.removeApiKey.mockResolvedValue();

    render(<Settings />);

    const deleteButton = await screen.findByText('Delete');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockSettingsService.removeApiKey).toHaveBeenCalledWith(mockUser.uid, 'key-1');
    });
  });

  it('toggles notification settings', async () => {
    render(<Settings />);

    // Wait for the page to finish loading
    await screen.findByRole('button', { name: /save changes/i });

    // Find toggle switches and click one
    const toggles = screen
      .getAllByRole('button')
      .filter((btn) => btn.className.includes('w-11') && btn.className.includes('rounded-full'));
    expect(toggles.length).toBeGreaterThan(0);

    fireEvent.click(toggles[0]);
  });

  it('handles loading error', async () => {
    mockSettingsService.getOrCreateUserSettings.mockRejectedValue(new Error('Failed to load'));

    render(<Settings />);

    await waitFor(() => {
      // Check for the error message parts separately since they're in different elements
      expect(screen.getByText('Failed to load settings')).toBeInTheDocument();
      expect(screen.getByText('Please try refreshing the page.')).toBeInTheDocument();
    });
  });

  it('handles save error', async () => {
    mockSettingsService.updateUserSettings.mockRejectedValue(new Error('Save failed'));

    render(<Settings />);

    const saveButton = await screen.findByRole('button', { name: /save changes/i });

    // Make a change so Save becomes enabled
    const toggle = screen
      .getAllByRole('button')
      .find((btn) => btn.className.includes('w-11') && btn.className.includes('rounded-full')) as
      | HTMLButtonElement
      | undefined;
    if (toggle) {
      fireEvent.click(toggle);
    }

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to save settings. Please try again.')).toBeInTheDocument();
    });
  });
});
