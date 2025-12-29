// Compatibility shim for react-is to work with Recharts
// This provides a simple re-export without circular dependencies

// Simply re-export everything from react-is
// Note: We can't use "export * from 'react-is'" here because it would create
// a circular dependency when this file is aliased as 'react-is' in vite.config.ts

// Import React for type checking

// Define the exports that Recharts expects
export {
  ContextConsumer,
  ContextProvider,
  ForwardRef,
  Fragment,
  isContextConsumer,
  isContextProvider,
  isElement,
  isForwardRef,
  isFragment,
  isLazy,
  isMemo,
  isPortal,
  isProfiler,
  isStrictMode,
  isSuspense,
  isValidElement,
  isValidElementType,
  Lazy,
  Memo,
  Portal,
  Profiler,
  StrictMode,
  Suspense,
  typeOf,
} from 'react-is';

// Re-export default
export { default } from 'react-is';
