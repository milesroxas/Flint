import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/shared/utils";

const buttonVariants = cva(
  [
    // Base
    "inline-flex items-center justify-center gap-2 shrink-0 whitespace-nowrap",
    "rounded-md text-sm font-medium transition-colors",
    "disabled:pointer-events-none disabled:opacity-50",
    // Icon sizing
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
    // Focus and invalid states aligned with shadcn
    "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary action
        default: "bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-hover-foreground",
        // Danger action
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive-hover hover:text-destructive-hover-foreground",
        // Secondary, muted surface
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        // Outlined on background surface
        outline: "border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
        // Minimal, on-hover surface tint
        ghost: "bg-transparent hover:bg-accent hover:text-accent-foreground",
        // Textual link style
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-6 rounded-xs gap-1.5 px-2 has-[>svg]:px-1.5 text-[11px]",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { Button, buttonVariants };
