import * as React from 'react';

import { cn } from '@/lib/marketing-utils';

/**
 * Card component - A flexible container with consistent styling
 *
 * Provides a clean, bordered container with rounded corners and subtle shadow.
 * Perfect for grouping related content and creating visual hierarchy.
 *
 * @example
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Settings</CardTitle>
 *     <CardDescription>Manage your account preferences</CardDescription>
 *   </CardHeader>
 *   <CardContent>
 *     <p>Card content goes here</p>
 *   </CardContent>
 *   <CardFooter>
 *     <Button>Save</Button>
 *   </CardFooter>
 * </Card>
 * ```
 *
 * @param props - Standard HTML div attributes
 * @param ref - Forwarded ref to the div element
 * @returns Card container component
 */
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-2xl border bg-white text-card-foreground shadow-sm', className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';

/**
 * CardHeader - Header section of a card with consistent spacing
 *
 * @param props - Standard HTML div attributes
 * @param ref - Forwarded ref to the div element
 * @returns Card header component
 */
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-2 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

/**
 * CardTitle - Main title for card content
 *
 * @param props - Standard HTML heading attributes
 * @param ref - Forwarded ref to the h3 element
 * @returns Card title component
 */
const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

/**
 * CardDescription - Subtitle or description text for cards
 *
 * @param props - Standard HTML paragraph attributes
 * @param ref - Forwarded ref to the p element
 * @returns Card description component
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

/**
 * CardContent - Main content area of a card
 *
 * @param props - Standard HTML div attributes
 * @param ref - Forwarded ref to the div element
 * @returns Card content component
 */
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

/**
 * CardFooter - Footer section of a card, typically for actions
 *
 * @param props - Standard HTML div attributes
 * @param ref - Forwarded ref to the div element
 * @returns Card footer component
 */
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
