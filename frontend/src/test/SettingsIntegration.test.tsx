import { describe, it, expect } from 'vitest';

// Simple smoke test to verify Settings component can be imported
describe('Settings Component Smoke Test', () => {
  it('can import Settings component without errors', async () => {
    const { Settings } = await import('../pages/Settings');
    expect(Settings).toBeDefined();
    expect(typeof Settings).toBe('function');
  });

  it('can import ApiKeyModal component without errors', async () => {
    const { ApiKeyModal } = await import('../components/settings/ApiKeyModal');
    expect(ApiKeyModal).toBeDefined();
    expect(typeof ApiKeyModal).toBe('function');
  });

  it('can import settingsService without errors', async () => {
    const { settingsService } = await import('../services/settingsService');
    expect(settingsService).toBeDefined();
    expect(typeof settingsService.getOrCreateUserSettings).toBe('function');
    expect(typeof settingsService.updateUserSettings).toBe('function');
    expect(typeof settingsService.validateSettings).toBe('function');
  });

});
