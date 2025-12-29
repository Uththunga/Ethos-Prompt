import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { promptService } from '../services/firestore';

interface TestResult {
  name: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  message: string;
  duration: number;
  details?: unknown;
}

interface DiagnosticReport {
  timestamp: string;
  userAgent: string;
  authState: { uid: string | null; email: string | null; emailVerified: boolean } | null;
  tests: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
}

class DebugTools {
  private results: TestResult[] = [];

  private async runTest(name: string, testFn: () => Promise<unknown>): Promise<TestResult> {
    const startTime = Date.now();
    console.log(`🧪 Running test: ${name}`);

    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      const testResult: TestResult = {
        name,
        status: 'PASSED',
        message: 'Test completed successfully',
        duration,
        details: result
      };

      console.log(`✅ ${name}: PASSED (${duration}ms)`);
      this.results.push(testResult);
      return testResult;
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const err = (error ?? {}) as { message?: string; stack?: string; toString?: () => string };
      const testResult: TestResult = {
        name,
        status: 'FAILED',
        message: err.message || 'Unknown error',
        duration,
        details: { error: err.toString ? err.toString() : String(error), stack: err.stack }
      };

      console.error(`❌ ${name}: FAILED (${duration}ms) - ${err.message ?? 'Unknown error'}`);
      this.results.push(testResult);
      return testResult;
    }
  }

  async testAuthentication(): Promise<TestResult> {
    return this.runTest('Authentication Check', async () => {
      // Wait for auth state to settle
      await new Promise(resolve => setTimeout(resolve, 1000));

      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user found. Please sign in first.');
      }

      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        isAnonymous: user.isAnonymous
      };
    });
  }

  async testFirestoreConnection(): Promise<TestResult> {
    return this.runTest('Firestore Connection', async () => {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Authentication required for Firestore test');
      }

      // Test basic read access
      const promptsRef = collection(db, 'users', user.uid, 'prompts');
      const q = query(promptsRef, orderBy('updatedAt', 'desc'), limit(1));
      const snapshot = await getDocs(q);

      return {
        connectionStatus: 'Connected',
        userCollection: `users/${user.uid}/prompts`,
        documentsFound: snapshot.docs.length,
        readPermissions: 'Granted'
      };
    });
  }

  async testPromptCreation(): Promise<TestResult> {
    return this.runTest('Prompt Creation', async () => {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Authentication required for prompt creation test');
      }

      const testPrompt = {
        title: `Debug Test Prompt ${Date.now()}`,
        content: 'This is a test prompt created by the debug tools to verify prompt saving functionality.',
        description: 'Debug test prompt - safe to delete',
        category: 'Debug',
        tags: ['debug', 'test'],
        isPublic: false,
        variables: []
      };

      const promptId = await promptService.createPrompt(user.uid, testPrompt);

      // Verify the prompt was created
      const savedPrompt = await promptService.getPrompt(user.uid, promptId);
      if (!savedPrompt) {
        throw new Error('Prompt creation verification failed - prompt not found after creation');
      }

      return {
        promptId,
        title: savedPrompt.title,
        createdAt: savedPrompt.createdAt,
        verification: 'Success'
      };
    });
  }

  async testPromptListing(): Promise<TestResult> {
    return this.runTest('Prompt Listing', async () => {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Authentication required for prompt listing test');
      }

      const startTime = Date.now();
      const prompts = await promptService.getUserPrompts(user.uid, 10);
      const fetchTime = Date.now() - startTime;

      return {
        promptCount: prompts.length,
        fetchTime: `${fetchTime}ms`,
        firstPrompt: prompts[0] ? {
          id: prompts[0].id,
          title: prompts[0].title,
          createdAt: prompts[0].createdAt
        } : null
      };
    });
  }

  async testRealTimeSync(): Promise<TestResult> {
    return this.runTest('Real-time Sync', async () => {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Authentication required for real-time sync test');
      }

      return new Promise((resolve, reject) => {
        let updateReceived = false;
        const timeout = setTimeout(() => {
          unsubscribe();
          if (!updateReceived) {
            reject(new Error('Real-time sync test timed out - no updates received within 5 seconds'));
          }
        }, 5000);

        const unsubscribe = promptService.subscribeToPrompts(user.uid, (prompts) => {
          if (!updateReceived) {
            updateReceived = true;
            clearTimeout(timeout);
            unsubscribe();
            resolve({
              subscriptionStatus: 'Active',
              promptCount: prompts.length,
              realTimeUpdates: 'Working'
            });
          }
        });
      });
    });
  }

  async runAllTests(): Promise<DiagnosticReport> {
    console.log('🚀 Starting comprehensive prompt saving diagnostics...');
    this.results = [];

    const startTime = Date.now();

    // Run tests in sequence
    await this.testAuthentication();
    await this.testFirestoreConnection();
    await this.testPromptCreation();
    await this.testPromptListing();
    await this.testRealTimeSync();

    const totalTime = Date.now() - startTime;

    const summary = {
      total: this.results.length,
      passed: this.results.filter(r => r.status === 'PASSED').length,
      failed: this.results.filter(r => r.status === 'FAILED').length,
      skipped: this.results.filter(r => r.status === 'SKIPPED').length
    };

    const report: DiagnosticReport = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      authState: auth.currentUser ? {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        emailVerified: auth.currentUser.emailVerified
      } : null,
      tests: this.results,
      summary
    };

    console.log(`🏁 Diagnostics complete in ${totalTime}ms`);
    console.log(`📊 Results: ${summary.passed}/${summary.total} tests passed`);

    if (summary.failed > 0) {
      console.error('❌ Some tests failed. Check the detailed results above.');
    } else {
      console.log('✅ All tests passed! Prompt saving functionality is working correctly.');
    }

    return report;
  }
}

// Create global instance
const debugTools = new DebugTools();

// Make available globally for browser console access
declare global {
  interface Window {
    debugPromptSaving: DebugTools;
    runPromptDiagnostics: () => Promise<DiagnosticReport>;
  }
}

window.debugPromptSaving = debugTools;
window.runPromptDiagnostics = () => debugTools.runAllTests();

console.log('🔧 Enhanced debug tools loaded. Use window.debugPromptSaving.runAllTests() or window.runPromptDiagnostics()');

export default debugTools;
