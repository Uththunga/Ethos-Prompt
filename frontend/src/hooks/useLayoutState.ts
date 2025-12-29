import { useLayoutContext } from '@/components/layout/LayoutProvider';

// Convenience hook to access layout state/actions
export function useLayoutState() {
  return useLayoutContext();
}

