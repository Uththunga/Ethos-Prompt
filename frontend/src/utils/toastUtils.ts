import type { Toast, ToastContextType } from '../components/common/Toast';

// Convenience hooks for different toast types
export const createSuccessToast = (addToast: ToastContextType['addToast']) => 
  (title: string, message?: string, action?: Toast['action']) => {
    return addToast({ type: 'success', title, message, action });
  };

export const createErrorToast = (addToast: ToastContextType['addToast']) => 
  (title: string, message?: string, action?: Toast['action']) => {
    return addToast({ type: 'error', title, message, action, duration: 0 }); // Don't auto-dismiss errors
  };

export const createWarningToast = (addToast: ToastContextType['addToast']) => 
  (title: string, message?: string, action?: Toast['action']) => {
    return addToast({ type: 'warning', title, message, action });
  };

export const createInfoToast = (addToast: ToastContextType['addToast']) => 
  (title: string, message?: string, action?: Toast['action']) => {
    return addToast({ type: 'info', title, message, action });
  };

// Utility function to handle common error scenarios
export const handleApiError = (error: unknown, addToast: ToastContextType['addToast']) => {
  let title = 'An error occurred';
  let message = 'Please try again later.';

  if (error && typeof error === 'object' && 'message' in error) {
    const errorMessage = (error as { message: string }).message;
    if (errorMessage.includes('network')) {
      title = 'Network Error';
      message = 'Please check your internet connection and try again.';
    } else if (errorMessage.includes('unauthorized') || errorMessage.includes('unauthenticated')) {
      title = 'Authentication Error';
      message = 'Please sign in again to continue.';
    } else if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
      title = 'Permission Denied';
      message = 'You don\'t have permission to perform this action.';
    } else {
      message = errorMessage;
    }
  }

  addToast({
    type: 'error',
    title,
    message,
    duration: 0, // Don't auto-dismiss errors
    action: {
      label: 'Retry',
      onClick: () => window.location.reload()
    }
  });
};
