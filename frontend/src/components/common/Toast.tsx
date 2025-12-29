/* eslint-disable react-refresh/only-export-components */

import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from '@/components/icons';
import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

/**
 * Available toast notification types with semantic meanings
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast notification configuration
 *
 * @interface Toast
 */
export interface Toast {
  /** Unique identifier for the toast */
  id: string;

  /** Visual and semantic type of the notification */
  type: ToastType;

  /** Main title/heading of the toast */
  title: string;

  /** Optional detailed message */
  message?: string;

  /** Auto-dismiss duration in milliseconds (0 = no auto-dismiss) */
  duration?: number;

  /** Optional action button */
  action?: {
    /** Button label text */
    label: string;
    /** Click handler function */
    onClick: () => void;
  };
}

/**
 * Toast context interface for managing toast notifications
 *
 * @interface ToastContextType
 */
export interface ToastContextType {
  /** Array of active toast notifications */
  toasts: Toast[];

  /** Add a new toast notification */
  addToast: (toast: Omit<Toast, 'id'>) => string;

  /** Remove a specific toast by ID */
  removeToast: (id: string) => void;

  /** Clear all active toasts */
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Hook to access toast notification functionality
 *
 * Must be used within a ToastProvider component.
 *
 * @example
 * ```tsx
 * const { addToast, removeToast } = useToast();
 *
 * const handleSuccess = () => {
 *   addToast({
 *     type: 'success',
 *     title: 'Success!',
 *     message: 'Operation completed successfully'
 *   });
 * };
 * ```
 *
 * @returns Toast context with notification management functions
 * @throws Error if used outside ToastProvider
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

/**
 * Props for ToastProvider component
 */
interface ToastProviderProps {
  /** Child components */
  children: ReactNode;

  /** Maximum number of toasts to display simultaneously */
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children, maxToasts = 5 }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    const t = timeoutsRef.current.get(id);
    if (t) {
      clearTimeout(t);
      timeoutsRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast: Toast = {
        ...toast,
        id,
        duration: toast.duration ?? 5000,
      };

      setToasts((prev) => {
        const updated = [newToast, ...prev];
        // Limit number of toasts
        return updated.slice(0, maxToasts);
      });

      // Auto-remove toast after duration
      if (newToast.duration && newToast.duration > 0) {
        const timeoutId = setTimeout(() => {
          removeToast(id);
        }, newToast.duration);
        timeoutsRef.current.set(id, timeoutId);
      }

      return id;
    },
    [maxToasts, removeToast]
  );

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((t) => clearTimeout(t));
      timeoutsRef.current.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAllToasts }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

// Convenience hooks for common toast types
export const useSuccessToast = () => {
  const { addToast } = useToast();
  return React.useCallback(
    (title: string, message?: string, action?: Toast['action']) =>
      addToast({ type: 'success', title, message, action }),
    [addToast]
  );
};

export const useErrorToast = () => {
  const { addToast } = useToast();
  return React.useCallback(
    (title: string, message?: string, action?: Toast['action']) =>
      addToast({ type: 'error', title, message, action, duration: 0 }),
    [addToast]
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-ethos-purple" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-l-green-500';
      case 'error':
        return 'border-l-red-500';
      case 'warning':
        return 'border-l-yellow-500';
      case 'info':
        return 'border-l-blue-500';
    }
  };

  return (
    <div
      className={`
      max-w-sm w-full bg-white dark:bg-ethos-navy shadow-lg rounded-lg pointer-events-auto
      border-l-4 ${getBorderColor()} transform transition-all duration-300 ease-in-out
      animate-in slide-in-from-right-full
    `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{getIcon()}</div>

          <div className="ml-3 w-0 flex-1">
            <p className="text-body-small font-medium text-ethos-navy dark:text-white">
              {toast.title}
            </p>
            {toast.message && (
              <p className="mt-1 text-body-small text-ethos-gray dark:text-ethos-gray-light">
                {toast.message}
              </p>
            )}
            {toast.action && (
              <div className="mt-2">
                <button
                  onClick={toast.action.onClick}
                  className="text-button-small font-medium text-ethos-purple dark:text-ethos-purple-light hover:text-ethos-purple/80 dark:hover:text-ethos-purple"
                >
                  {toast.action.label}
                </button>
              </div>
            )}
          </div>

          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => onRemove(toast.id)}
              className="bg-white rounded-lg inline-flex text-ethos-gray-light hover:text-ethos-gray hover:bg-ethos-purple/5 p-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ethos-purple"
            >
              <span className="sr-only">Close</span>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
