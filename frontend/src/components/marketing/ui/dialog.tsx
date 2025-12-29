import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/marketing-utils';
/**
 * Dialog primitives built on Radix UI, styled with Ethos tokens.
 * Components: Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription.
 *
 * Accessibility: Focus trapping, ESC to close, labeled by Title.
 *
 * Example:
 * <Dialog>
 *   <DialogTrigger>Open</DialogTrigger>
 *   <DialogContent>
 *     <DialogHeader>
 *       <DialogTitle>Title</DialogTitle>
 *     </DialogHeader>
 *     Content...
 *   </DialogContent>
 * </Dialog>
 */

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;
/**
 * DialogContent wraps the portal, overlay, and modal panel.
 * Use within <Dialog> with <DialogTrigger> to open.
 */

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-[1040] bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 transition-all duration-300',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // Base positioning: centered with transform
        'fixed left-[50%] top-[50%] z-[1050] grid w-full translate-x-[-50%] translate-y-[-50%]',
        // Spacing and borders
        'gap-4 sm:gap-6 border border-gray-200 bg-white shadow-xl',
        // Animations
        'duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
        // Mobile: Constrained width with margins, centered by transform, reserve space for close button
        'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] rounded-2xl p-4 pr-12',
        // Tablet: Reduced max-width
        'sm:max-w-md sm:p-6 sm:pr-12 sm:rounded-2xl',
        // Desktop: Standard max-width
        'md:max-w-lg md:p-8 md:pr-12',
        className
      )}
      // FIX: Prevent dialog from closing when clicking on portaled elements (Select, Popover, etc.)
      onInteractOutside={(e) => {
        // Check if the interaction is with a Radix Portal element
        const target = e.target as HTMLElement;
        if (target?.closest('[data-radix-popper-content-wrapper]') ||
            target?.closest('[data-radix-select-content]') ||
            target?.closest('[data-radix-popover-content]') ||
            target?.closest('[role="listbox"]') ||
            target?.closest('[role="option"]')) {
          e.preventDefault();
        }
      }}
      onPointerDownOutside={(e) => {
        // Also prevent pointer down on portaled elements
        const target = e.target as HTMLElement;
        if (target?.closest('[data-radix-popper-content-wrapper]') ||
            target?.closest('[data-radix-select-content]') ||
            target?.closest('[data-radix-popover-content]') ||
            target?.closest('[role="listbox"]') ||
            target?.closest('[role="option"]')) {
          e.preventDefault();
        }
      }}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-0 top-0 sm:right-1 sm:top-1 rounded-full opacity-70 ring-offset-background transition-all duration-200 hover:opacity-100 hover:bg-gray-100 p-2 sm:p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-ethos-purple focus:ring-offset-2 disabled:pointer-events-none">
        <X className="h-6 w-6 text-ethos-gray-light" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-2 text-center sm:text-left', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-2', className)}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-xl font-semibold leading-none tracking-tight text-ethos-navy', className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-ethos-gray-light leading-relaxed', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
