
/**
 * Performance Monitoring Utilities
 * Helper functions for tracking performance metrics
 */

import { startTrace } from '../lib/firebase';

export class PerformanceTracker {
  static traces = new Map();

  // Start performance trace
  static startTrace(traceName) {
    const trace = startTrace(traceName);
    if (trace) {
      trace.start();
      this.traces.set(traceName, trace);
    }
    return trace;
  }

  // Stop performance trace
  static stopTrace(traceName, customAttributes = {}) {
    const trace = this.traces.get(traceName);
    if (trace) {
      // Add custom attributes
      Object.entries(customAttributes).forEach(([key, value]) => {
        trace.putAttribute(key, String(value));
      });
      
      trace.stop();
      this.traces.delete(traceName);
    }
  }

  // Track API call performance
  static async trackApiCall(apiName, apiCall) {
    const traceName = `api_${apiName}`;
    this.startTrace(traceName);
    
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.stopTrace(traceName, {
        success: 'true',
        duration_ms: Math.round(duration)
      });
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.stopTrace(traceName, {
        success: 'false',
        error: error.message,
        duration_ms: Math.round(duration)
      });
      
      throw error;
    }
  }

  // Track page load performance
  static trackPageLoad(pageName) {
    const traceName = `page_load_${pageName}`;
    this.startTrace(traceName);
    
    // Stop trace when page is fully loaded
    window.addEventListener('load', () => {
      this.stopTrace(traceName, {
        page: pageName,
        load_time: performance.now()
      });
    });
  }

  // Track component render performance
  static trackComponentRender(componentName, renderFunction) {
    const traceName = `component_${componentName}`;
    this.startTrace(traceName);
    
    const startTime = performance.now();
    const result = renderFunction();
    const endTime = performance.now();
    
    this.stopTrace(traceName, {
      component: componentName,
      render_time: Math.round(endTime - startTime)
    });
    
    return result;
  }

  // Track user interaction performance
  static trackUserInteraction(interactionName, interactionFunction) {
    const traceName = `interaction_${interactionName}`;
    this.startTrace(traceName);
    
    const startTime = performance.now();
    
    return Promise.resolve(interactionFunction()).then(result => {
      const endTime = performance.now();
      this.stopTrace(traceName, {
        interaction: interactionName,
        response_time: Math.round(endTime - startTime)
      });
      return result;
    }).catch(error => {
      const endTime = performance.now();
      this.stopTrace(traceName, {
        interaction: interactionName,
        response_time: Math.round(endTime - startTime),
        error: error.message
      });
      throw error;
    });
  }
}

export default PerformanceTracker;
