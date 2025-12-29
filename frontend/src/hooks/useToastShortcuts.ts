import { useCallback } from 'react';
import { useToast } from '@/components/common/Toast';
import type { Toast } from '@/components/common/Toast';

export const useSuccessToast = () => {
  const { addToast } = useToast();
  return useCallback((title: string, message?: string, action?: Toast['action']) => {
    return addToast({ type: 'success', title, message, action });
  }, [addToast]);
};

export const useErrorToast = () => {
  const { addToast } = useToast();
  return useCallback((title: string, message?: string, action?: Toast['action']) => {
    return addToast({ type: 'error', title, message, action, duration: 0 });
  }, [addToast]);
};

export const useWarningToast = () => {
  const { addToast } = useToast();
  return useCallback((title: string, message?: string, action?: Toast['action']) => {
    return addToast({ type: 'warning', title, message, action });
  }, [addToast]);
};

export const useInfoToast = () => {
  const { addToast } = useToast();
  return useCallback((title: string, message?: string, action?: Toast['action']) => {
    return addToast({ type: 'info', title, message, action });
  }, [addToast]);
};
