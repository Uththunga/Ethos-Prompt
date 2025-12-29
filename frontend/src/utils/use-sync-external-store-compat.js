// Compatibility shim for use-sync-external-store/shim/with-selector
// This provides the exports that React Query and other libraries expect

import { useSyncExternalStore } from 'react';

// Fallback implementation for useSyncExternalStoreWithSelector
const useSyncExternalStoreWithSelector = (
  subscribe,
  getSnapshot,
  getServerSnapshot,
  selector,
  isEqual
) => {
  // Use the basic useSyncExternalStore and apply selector manually
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  
  // Apply selector if provided
  if (selector) {
    return selector(snapshot);
  }
  
  return snapshot;
};

// Export as named export (what libraries expect)
export { useSyncExternalStoreWithSelector };

// Also export as default for compatibility
export default useSyncExternalStoreWithSelector;
