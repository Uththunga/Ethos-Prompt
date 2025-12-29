import { cva } from "class-variance-authority";

// Extracted buttonVariants to a .ts file to avoid react-refresh/only-export-components
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium ring-offset-background transition-button focus-ring touch-target disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none disabled:brightness-75 disabled:saturate-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transform-gpu will-change-transform",
  {
    variants: {
      variant: {
        default:
          "!text-white font-semibold shadow-button-cta hover:shadow-button-cta-hover hover:scale-[1.02] hover:-translate-y-1 hover:brightness-110 hover:saturate-110 active:scale-100 active:shadow-button-cta bg-gradient-to-r from-[#6D6AED] to-[#7900E3] hover:from-[#7900E3] hover:to-[#6D6AED] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-button-destructive hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/30 hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.98] active:brightness-95 transition-all duration-200 ease-out",
        outline:
          "border border-input bg-background shadow-button-outline hover:bg-ethos-purple hover:text-white hover:border-ethos-purple-light hover:shadow-lg hover:shadow-ethos-purple/20 hover:-translate-y-0.5 active:scale-[0.98] active:bg-ethos-purple/20 active:border-ethos-purple transition-all duration-250 ease-out",
        secondary:
          "bg-secondary text-secondary-foreground shadow-button hover:bg-secondary/90 hover:shadow-md hover:-translate-y-0.5 hover:brightness-105 active:scale-[0.98] active:brightness-95 transition-all duration-200 ease-out",
        ghost:
          "hover:bg-ethos-purple/10 hover:text-ethos-purple hover:shadow-button-ghost hover:backdrop-blur-sm active:scale-[0.98] transition-all duration-200 ease-out",
        link:
          "text-primary underline-offset-4 hover:text-ethos-purple-light hover:underline-offset-2 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-ethos-purple-light after:transition-all after:duration-300 hover:after:w-full transition-all duration-200 ease-out",
        cta:
          "!text-white font-medium shadow-button-cta hover:shadow-button-cta-hover hover:scale-[1.02] hover:-translate-y-1 hover:brightness-110 hover:saturate-110 active:scale-100 active:shadow-button-cta bg-gradient-to-r from-ethos-purple to-ethos-purple-light hover:from-ethos-purple-light hover:via-ethos-purple-gradient-start hover:to-ethos-purple-gradient-end transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        ethos:
          "!text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.98] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] [background:linear-gradient(135deg,#9C43FE_0%,#4CC2E9_100%)]",
      } as const,
      size: {
        sm: "h-9 px-3 py-2 text-button-sm shadow-button-sm",
        default: "h-11 px-4 py-3 text-button shadow-button",
        lg: "h-13 px-10 py-7 text-button-large shadow-button-lg",
        icon: "h-11 w-11 p-0 shadow-button",
      } as const,
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
