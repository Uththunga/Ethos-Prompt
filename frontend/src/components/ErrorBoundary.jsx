/**
 * React Error Boundary
 * Catches and handles React component errors
 */

import React from 'react';
import ErrorTracker from '../utils/errorTracker';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // Track the error
    ErrorTracker.trackUIError(error, this.props.component || 'Unknown', 'component_error');

    // Report to Sentry if available
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '20px',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            margin: '10px 0',
          }}
        >
          <h3>Something went wrong</h3>
          <p>We're sorry, but something unexpected happened. Our team has been notified.</p>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '10px' }}>
              <summary>Error details (development only)</summary>
              <pre style={{ marginTop: '10px', fontSize: '12px' }}>
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#721c24',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
