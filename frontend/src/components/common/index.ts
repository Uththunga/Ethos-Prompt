/**
 * Common Components Index
 *
 * Central export point for all common/shared components.
 * Provides easy imports throughout the application.
 *
 * @example
 * ```tsx
 * import { ContentCard, PageHeader, Breadcrumbs } from '@/components/common';
 * ```
 */

// Foundation Components (Phase 1)
export {
  ContentCard,
  ContentCardContent,
  ContentCardFooter,
  ContentCardHeader,
  type ContentCardProps,
} from './ContentCard';

export {
  CompactPageHeader,
  PageHeader,
  PageHeaderSkeleton,
  type PageHeaderProps,
} from './PageHeader';

export {
  Breadcrumbs,
  createBreadcrumbs,
  useAutoBreadcrumbs,
  type BreadcrumbItem,
  type BreadcrumbsProps,
} from './Breadcrumbs';

export {
  EmptySearchResults,
  EmptyState,
  EmptyStateCard,
  EmptyStateWithLink,
  type EmptyStateProps,
} from './EmptyState';

export {
  InlineLoadingState,
  LoadingState,
  PageLoadingState,
  type LoadingStateProps,
} from './LoadingState';

// Existing Components
export { AuthErrorBoundary } from './AuthErrorBoundary';
export { ErrorBoundary, useErrorHandler, withErrorBoundary } from './ErrorBoundary';
export {
  ErrorHandler,
  GlobalErrorBoundary,
  useErrorHandler as useErrorState,
} from './ErrorHandler';
export { LoadingSpinner } from './LoadingSpinner';
export {
  ContentPlaceholder,
  FadeIn,
  LoadingOverlay,
  PageTransition,
  ProgressBar,
  ScaleIn,
  Shimmer,
  SlideUp,
  SmoothSpinner,
  StaggeredList,
} from './LoadingTransitions';
export { OptimizedImage, generatePlaceholder, useImagePreloader } from './OptimizedImage';
export {
  ProgressiveBackgroundImage,
  ProgressiveImage,
  ProgressiveImageGallery,
  useProgressiveImage,
} from './ProgressiveImage';
export {
  ChatMessageSkeleton,
  DocumentCardSkeleton,
  FormSkeleton,
  GridSkeleton,
  ListSkeleton,
  PageSkeleton,
  PromptCardSkeleton,
  Skeleton,
  TableRowSkeleton,
} from './SkeletonLoader';
export { ToastProvider, useToast } from './Toast';
export { VirtualizedGrid, VirtualizedList, useVirtualizationParams } from './VirtualizedList';
