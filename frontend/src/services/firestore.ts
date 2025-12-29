import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { Prompt, PromptExecution, RAGDocument, Workspace } from '../types';

// Retry utility with exponential backoff
class RetryManager {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    operationName: string = 'operation'
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: unknown) {
        lastError = error;

        // Don't retry on certain errors
        if (this.isNonRetryableError(error)) {
          console.error(`❌ Non-retryable error in ${operationName}:`, error);
          throw error;
        }

        if (attempt === maxRetries) {
          console.error(`❌ ${operationName} failed after ${maxRetries} attempts:`, error);
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.warn(
          `⚠️ ${operationName} attempt ${attempt} failed, retrying in ${delay}ms:`,
          error.message
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  private static isNonRetryableError(error: unknown): boolean {
    const nonRetryableCodes = [
      'permission-denied',
      'invalid-argument',
      'not-found',
      'already-exists',
      'failed-precondition',
      'out-of-range',
      'unauthenticated',
    ];

    return nonRetryableCodes.includes(error.code);
  }
}

// Validation utility
class PromptValidator {
  static validatePromptData(promptData: Record<string, unknown>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!promptData.title || typeof promptData.title !== 'string') {
      errors.push('Title is required and must be a string');
    } else if (promptData.title.length > 200) {
      errors.push('Title must be 200 characters or less');
    }

    if (!promptData.content || typeof promptData.content !== 'string') {
      errors.push('Content is required and must be a string');
    } else if (promptData.content.length > 50000) {
      errors.push('Content must be 50,000 characters or less');
    }

    if (promptData.description && typeof promptData.description !== 'string') {
      errors.push('Description must be a string');
    } else if (promptData.description && promptData.description.length > 1000) {
      errors.push('Description must be 1,000 characters or less');
    }

    if (promptData.category && typeof promptData.category !== 'string') {
      errors.push('Category must be a string');
    }

    if (promptData.tags && !Array.isArray(promptData.tags)) {
      errors.push('Tags must be an array');
    } else if (promptData.tags && promptData.tags.length > 20) {
      errors.push('Maximum 20 tags allowed');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static sanitizePromptData(promptData: Record<string, unknown>): Record<string, unknown> {
    return {
      ...promptData,
      title: promptData.title?.trim() || '',
      content: promptData.content?.trim() || '',
      description: promptData.description?.trim() || '',
      category: promptData.category?.trim() || 'General',
      tags: Array.isArray(promptData.tags)
        ? promptData.tags.filter((tag) => tag && typeof tag === 'string').map((tag) => tag.trim())
        : [],
      isPublic: Boolean(promptData.isPublic),
      variables: Array.isArray(promptData.variables) ? promptData.variables : [],
    };
  }
}

// Prompt operations
export const promptService = {
  // Create a new prompt with validation and retry logic
  async createPrompt(
    userId: string,
    promptData: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'version'>
  ) {
    const startTime = Date.now();
    const operationId = Math.random().toString(36).substr(2, 9);

    console.log(`🔍 [${operationId}] Starting prompt creation for user:`, userId);
    console.log(`📝 [${operationId}] Prompt data:`, {
      title: promptData.title,
      contentLength: promptData.content?.length || 0,
      category: promptData.category,
      tagsCount: promptData.tags?.length || 0,
      isPublic: promptData.isPublic,
    });

    // Validate and sanitize prompt data
    const validation = PromptValidator.validatePromptData(promptData);
    if (!validation.isValid) {
      const errorMessage = `Validation failed: ${validation.errors.join(', ')}`;
      console.error(`❌ [${operationId}] ${errorMessage}`);
      throw new Error(errorMessage);
    }

    const sanitizedData = PromptValidator.sanitizePromptData(promptData);
    console.log(`✅ [${operationId}] Data validation and sanitization complete`);

    // Enhanced auth validation
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error(`❌ [${operationId}] No authenticated user found`);
      throw new Error('Authentication required. Please sign in to save prompts.');
    }

    if (currentUser.uid !== userId) {
      console.error(`❌ [${operationId}] User ID mismatch: ${currentUser.uid} !== ${userId}`);
      throw new Error('User authentication mismatch. Please sign out and sign in again.');
    }

    console.log(`🔐 [${operationId}] Authentication validated for user: ${userId}`);

    try {
      return await RetryManager.withRetry(
        async () => {
          // Use root 'prompts' collection for consistency across reads and writes
          const promptsRef = collection(db, 'prompts');
          console.log(`📁 [${operationId}] Collection reference: ${promptsRef.path}`);

          const newPrompt = {
            ...sanitizedData,
            userId,
            createdBy: userId,
            isDeleted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            version: 1,
            _metadata: {
              operationId,
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString(),
              retryCount: 0,
            },
          };

          console.log(`💾 [${operationId}] Attempting to save prompt to Firestore...`);
          const docRef = await addDoc(promptsRef, newPrompt);
          console.log(`✅ [${operationId}] Prompt saved successfully with ID: ${docRef.id}`);

          // Verify the document was saved correctly
          const savedDoc = await getDoc(doc(db, 'prompts', docRef.id));
          if (!savedDoc.exists()) {
            throw new Error('Prompt was saved but verification failed - document not found');
          }

          const savedData = savedDoc.data();
          console.log(`🔍 [${operationId}] Verification successful:`, {
            id: docRef.id,
            title: savedData.title,
            createdAt: savedData.createdAt,
            createdBy: savedData.createdBy,
          });

          const duration = Date.now() - startTime;
          console.log(`⏱️ [${operationId}] Total operation time: ${duration}ms`);

          return docRef.id;
        },
        3,
        1000,
        `createPrompt-${operationId}`
      );
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      console.error(`❌ [${operationId}] Error creating prompt (${duration}ms):`, error);
      console.error(`🔍 [${operationId}] Error details:`, {
        code: error.code,
        message: error.message,
        userId,
        promptTitle: promptData.title,
        authState: auth.currentUser ? 'authenticated' : 'not authenticated',
        authUid: auth.currentUser?.uid,
        stack: error.stack,
      });

      // Enhanced error handling with specific solutions
      if (error.code === 'permission-denied') {
        throw new Error(
          'Permission denied. Please check your authentication and try signing out and back in.'
        );
      } else if (error.code === 'unauthenticated') {
        throw new Error('Authentication required. Please sign in and try again.');
      } else if (error.code === 'network-request-failed') {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (error.code === 'unavailable') {
        throw new Error(
          'Firestore service is temporarily unavailable. Please try again in a moment.'
        );
      } else if (error.code === 'deadline-exceeded') {
        throw new Error('Request timed out. Please try again.');
      } else if (error.code === 'resource-exhausted') {
        throw new Error('Service quota exceeded. Please try again later.');
      } else {
        // Re-throw the original error with additional context
        throw new Error(`Failed to save prompt: ${error.message}`);
      }
    }
  },

  // Subscribe to real-time prompt updates
  subscribeToPrompts(
    userId: string,
    callback: (prompts: Prompt[]) => void,
    limitCount = 50
  ): () => void {
    // Updated to use root prompts collection instead of users/{userId}/prompts subcollection
    const promptsRef = collection(db, 'prompts');
    const q = query(
      promptsRef,
      where('userId', '==', userId),
      where('isDeleted', '==', false),
      orderBy('updatedAt', 'desc'),
      limit(limitCount)
    );

    console.log(`🔄 Setting up real-time subscription for user: ${userId}`);

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        console.log(`📡 Real-time update received: ${querySnapshot.docs.length} prompts`);
        const prompts = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Prompt[];

        callback(prompts);
      },
      (error) => {
        console.error('❌ Real-time subscription error:', error);
        // Don't throw here, just log the error
      }
    );

    return unsubscribe;
  },

  // Get a specific prompt
  async getPrompt(userId: string, promptId: string): Promise<Prompt | null> {
    // Updated to use root prompts collection
    const promptRef = doc(db, 'prompts', promptId);
    const promptSnap = await getDoc(promptRef);

    if (promptSnap.exists()) {
      const data = promptSnap.data();

      // Verify ownership (skip in E2E mode to allow seeded data access)
      const isE2E = import.meta.env.VITE_E2E_MODE === 'true';
      if (!isE2E && data.userId !== userId) {
        console.warn(
          `User ${userId} attempted to access prompt ${promptId} owned by ${data.userId}`
        );
        return null;
      }

      return {
        id: promptSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Prompt;
    }

    return null;
  },

  // Get all prompts for a user
  async getUserPrompts(userId: string, limitCount = 50): Promise<Prompt[]> {
    const promptsRef = collection(db, 'prompts');
    const q = query(
      promptsRef,
      where('userId', '==', userId),
      where('isDeleted', '==', false),
      orderBy('updatedAt', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Prompt[];
  },

  // Update a prompt
  async updatePrompt(_userId: string, promptId: string, updates: Partial<Prompt>) {
    const promptRef = doc(db, 'prompts', promptId);
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
      version: (updates.version || 1) + 1,
    };

    await updateDoc(promptRef, updateData);
  },

  // Delete a prompt (use root collection for consistency with subscriptions)
  async deletePrompt(_userId: string, promptId: string) {
    const promptRef = doc(db, 'prompts', promptId);
    await deleteDoc(promptRef);
  },

  // Search prompts
  async searchPrompts(
    userId: string,
    searchParams: {
      category?: string;
      tags?: string[];
      isPublic?: boolean;
      limitCount?: number;
    }
  ): Promise<Prompt[]> {
    const promptsRef = collection(db, 'users', userId, 'prompts');
    let q = query(promptsRef, orderBy('updatedAt', 'desc'));

    if (searchParams.category) {
      q = query(q, where('category', '==', searchParams.category));
    }

    if (searchParams.isPublic !== undefined) {
      q = query(q, where('isPublic', '==', searchParams.isPublic));
    }

    if (searchParams.tags && searchParams.tags.length > 0) {
      q = query(q, where('tags', 'array-contains-any', searchParams.tags));
    }

    if (searchParams.limitCount) {
      q = query(q, limit(searchParams.limitCount));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Prompt[];
  },
};

// Execution operations
export const executionService = {
  // Create a new execution
  async createExecution(
    userId: string,
    promptId: string,
    executionData: Omit<PromptExecution, 'id' | 'timestamp'>
  ) {
    const executionsRef = collection(db, 'users', userId, 'prompts', promptId, 'executions');
    const newExecution = {
      ...executionData,
      timestamp: serverTimestamp(),
    };

    const docRef = await addDoc(executionsRef, newExecution);
    return docRef.id;
  },

  // Get executions for a prompt
  async getPromptExecutions(
    userId: string,
    promptId: string,
    limitCount = 20
  ): Promise<PromptExecution[]> {
    // Updated to use root prompts collection
    const executionsRef = collection(db, 'prompts', promptId, 'executions');
    const q = query(executionsRef, orderBy('timestamp', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    })) as PromptExecution[];
  },

  // Get all executions for a user
  async getUserExecutions(userId: string, limitCount = 50): Promise<PromptExecution[]> {
    // Note: This would require a collection group query in a real implementation
    // For now, we'll implement a simplified version
    const executions: PromptExecution[] = [];

    // Get all prompts first
    const prompts = await promptService.getUserPrompts(userId);

    // Get executions for each prompt (limited approach)
    for (const prompt of prompts.slice(0, 10)) {
      // Limit to first 10 prompts to avoid too many queries
      const promptExecutions = await this.getPromptExecutions(userId, prompt.id, 5);
      executions.push(...promptExecutions);
    }

    // Sort by timestamp and limit
    return executions
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limitCount);
  },
};

// RAG Document operations
export const documentService = {
  // Create a new document record
  async createDocument(userId: string, documentData: Omit<RAGDocument, 'id' | 'uploadedAt'>) {
    const documentsRef = collection(db, 'rag_documents');
    const newDocument = {
      ...documentData,
      uploadedBy: userId,
      uploadedAt: serverTimestamp(),
    };

    const docRef = await addDoc(documentsRef, newDocument);
    return docRef.id;
  },

  // Get user's documents
  async getUserDocuments(userId: string): Promise<RAGDocument[]> {
    const documentsRef = collection(db, 'rag_documents');
    const q = query(documentsRef, where('uploadedBy', '==', userId), orderBy('uploadedAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      uploadedAt: doc.data().uploadedAt?.toDate() || new Date(),
      processedAt: doc.data().processedAt?.toDate(),
    })) as RAGDocument[];
  },

  // Update document status
  async updateDocumentStatus(documentId: string, status: RAGDocument['status'], error?: string) {
    const documentRef = doc(db, 'rag_documents', documentId);
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (status === 'completed') {
      updateData.processedAt = serverTimestamp();
    }

    if (error) {
      updateData.error = error;
    }

    await updateDoc(documentRef, updateData);
  },
};

// Workspace operations
export const workspaceService = {
  // Create a new workspace
  async createWorkspace(
    _userId: string,
    workspaceData: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>
  ) {
    const workspacesRef = collection(db, 'workspaces');
    const newWorkspace = {
      ...workspaceData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(workspacesRef, newWorkspace);
    return docRef.id;
  },

  // Get user's workspaces
  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    const workspacesRef = collection(db, 'workspaces');
    const q = query(workspacesRef, where('members', 'array-contains', userId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Workspace[];
  },
};
