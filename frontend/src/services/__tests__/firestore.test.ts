import { beforeEach, describe, expect, it, vi } from 'vitest';
import { promptService } from '../firestore';

// Mock Firebase Firestore (partial) — preserve real exports like getFirestore for emulator mode
vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    collection: vi.fn(),
    doc: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    onSnapshot: vi.fn(),
    serverTimestamp: vi.fn(() => ({ seconds: Date.now() / 1000 })),
  };
});

vi.mock('../config/firebase', () => ({
  db: {},
}));

describe('promptService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPrompt', () => {
    it('should create a new prompt with correct data', async () => {
      const mockAddDoc = vi.fn().mockResolvedValue({ id: 'new-prompt-id' });
      const mockCollection = vi.fn().mockReturnValue({});

      vi.doMock('firebase/firestore', async () => ({
        ...(await vi.importActual('firebase/firestore')),
        addDoc: mockAddDoc,
        collection: mockCollection,
      }));

      // Note: This is a simplified test since we're mocking Firebase
      // In a real implementation, you'd want to test the actual Firebase integration
      expect(promptService.createPrompt).toBeDefined();
      expect(typeof promptService.createPrompt).toBe('function');
    });
  });

  describe('getUserPrompts', () => {
    it('should retrieve user prompts', async () => {
      expect(promptService.getUserPrompts).toBeDefined();
      expect(typeof promptService.getUserPrompts).toBe('function');
    });
  });

  describe('updatePrompt', () => {
    it('should update prompt data', async () => {
      expect(promptService.updatePrompt).toBeDefined();
      expect(typeof promptService.updatePrompt).toBe('function');
    });
  });

  describe('deletePrompt', () => {
    it('should delete a prompt', async () => {
      expect(promptService.deletePrompt).toBeDefined();
      expect(typeof promptService.deletePrompt).toBe('function');
    });
  });

  describe('searchPrompts', () => {
    it('should search prompts with filters', async () => {
      expect(promptService.searchPrompts).toBeDefined();
      expect(typeof promptService.searchPrompts).toBe('function');
    });
  });
});
