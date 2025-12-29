/**
 * Document Processing Debugger Utility
 * Helps diagnose issues with document upload and processing
 */

export interface DocumentProcessingDebugInfo {
  jobId: string;
  status: string;
  attempts: number;
  startTime: Date;
  lastPollTime: Date;
  errors: string[];
  apiResponses: Array<{ timestamp: Date; response: unknown }>;
}

class DocumentProcessingDebugger {
  private debugSessions: Map<string, DocumentProcessingDebugInfo> = new Map();

  /**
   * Start debugging a document processing job
   */
  startDebugging(jobId: string): void {
    this.debugSessions.set(jobId, {
      jobId,
      status: 'unknown',
      attempts: 0,
      startTime: new Date(),
      lastPollTime: new Date(),
      errors: [],
      apiResponses: []
    });

    console.log(`🔍 Started debugging document processing for job: ${jobId}`);
  }

  /**
   * Log a polling attempt
   */
  logPollAttempt(jobId: string, response: unknown): void {
    const session = this.debugSessions.get(jobId);
    if (!session) return;

    session.attempts++;
    session.lastPollTime = new Date();
    session.apiResponses.push({
      timestamp: new Date(),
      response: JSON.parse(JSON.stringify(response))
    });

    const respObj = (typeof response === 'object' && response !== null) ? (response as Record<string, unknown>) : undefined;
    const status = respObj && 'status' in respObj ? String(respObj.status) : undefined;
    const success = respObj && 'success' in respObj ? Boolean(respObj.success) : undefined;

    if (status !== undefined) {
      session.status = status;
    }

    console.log(`📊 Poll attempt ${session.attempts} for job ${jobId}:`, {
      status,
      success,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log an error
   */
  logError(jobId: string, error: string): void {
    const session = this.debugSessions.get(jobId);
    if (!session) return;

    session.errors.push(`[${new Date().toISOString()}] ${error}`);
    console.error(`❌ Error in job ${jobId}:`, error);
  }

  /**
   * Get debug information for a job
   */
  getDebugInfo(jobId: string): DocumentProcessingDebugInfo | null {
    return this.debugSessions.get(jobId) || null;
  }

  /**
   * Generate a debug report
   */
  generateDebugReport(jobId: string): string {
    const session = this.debugSessions.get(jobId);
    if (!session) {
      return `No debug session found for job: ${jobId}`;
    }

    const duration = Date.now() - session.startTime.getTime();
    const lastPollDuration = Date.now() - session.lastPollTime.getTime();

    return `
🔍 Document Processing Debug Report
=====================================
Job ID: ${session.jobId}
Current Status: ${session.status}
Total Attempts: ${session.attempts}
Duration: ${Math.round(duration / 1000)}s
Last Poll: ${Math.round(lastPollDuration / 1000)}s ago

📊 API Responses (last 5):
${session.apiResponses.slice(-5).map((resp, i) =>
  `  ${i + 1}. [${resp.timestamp.toLocaleTimeString()}] ${JSON.stringify(resp.response)}`
).join('\n')}

❌ Errors (${session.errors.length}):
${session.errors.slice(-5).map((error, i) => `  ${i + 1}. ${error}`).join('\n')}

🔧 Potential Issues:
${this.analyzePotentialIssues(session).map(issue => `  • ${issue}`).join('\n')}
    `.trim();
  }

  /**
   * Analyze potential issues based on debug data
   */
  private analyzePotentialIssues(session: DocumentProcessingDebugInfo): string[] {
    const issues: string[] = [];
    const duration = Date.now() - session.startTime.getTime();
    const lastPollDuration = Date.now() - session.lastPollTime.getTime();

    // Check for long duration
    if (duration > 300000) { // 5 minutes
      issues.push('Processing taking longer than expected (>5 minutes)');
    }

    // Check for stuck status
    if (session.attempts > 10 && session.status === session.apiResponses[0]?.response?.status) {
      issues.push('Status has not changed after multiple attempts');
    }

    // Check for API errors
    const hasApiErrors = session.apiResponses.some(r => {
      const obj = (typeof r.response === 'object' && r.response !== null) ? (r.response as Record<string, unknown>) : undefined;
      return obj && 'success' in obj && obj.success === false;
    });
    if (hasApiErrors) {
      issues.push('API calls returning errors');
    }

    // Check for network issues
    if (session.errors.some(error => error.includes('fetch') || error.includes('network'))) {
      issues.push('Network connectivity issues detected');
    }

    // Check for timeout
    if (session.attempts >= 60) {
      issues.push('Reached maximum polling attempts (60)');
    }

    // Check for stale polling
    if (lastPollDuration > 10000) { // 10 seconds
      issues.push('Polling appears to have stopped');
    }

    return issues;
  }

  /**
   * Stop debugging a job
   */
  stopDebugging(jobId: string): void {
    const session = this.debugSessions.get(jobId);
    if (session) {
      console.log(`🏁 Stopped debugging job ${jobId}. Final report:`);
      console.log(this.generateDebugReport(jobId));
      this.debugSessions.delete(jobId);
    }
  }

  /**
   * List all active debug sessions
   */
  listActiveSessions(): string[] {
    return Array.from(this.debugSessions.keys());
  }

  /**
   * Clear all debug sessions
   */
  clearAll(): void {
    console.log(`🧹 Cleared ${this.debugSessions.size} debug sessions`);
    this.debugSessions.clear();
  }
}

// Export singleton instance
export const documentDebugger = new DocumentProcessingDebugger();

// Helper function to check if a job might be stuck
export function isJobLikelyStuck(jobId: string): boolean {
  const debugInfo = documentDebugger.getDebugInfo(jobId);
  if (!debugInfo) return false;

  const duration = Date.now() - debugInfo.startTime.getTime();
  const firstResp = debugInfo.apiResponses[0]?.response;
  const firstStatus = (typeof firstResp === 'object' && firstResp !== null && 'status' in (firstResp as Record<string, unknown>))
    ? String((firstResp as Record<string, unknown>).status)
    : undefined;
  const hasStatusChanged = debugInfo.apiResponses.length > 1 && firstStatus !== debugInfo.status;

  return duration > 300000 && !hasStatusChanged && debugInfo.attempts > 10;
}

// Helper function to get stuck jobs
export function getStuckJobs(): string[] {
  return documentDebugger.listActiveSessions().filter(isJobLikelyStuck);
}
