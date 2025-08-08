import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Copy, AlertCircle, CircleCheckBig } from "lucide-react";

import { cn } from "@/lib/utils";
import { Severity } from "@/features/linter/model/rule.types";

const badgeVariants = cva(
  "inline-flex items-center justify-center leading-none rounded-sm border-none px-1.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:self-center [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        inheritedProperty:
          "bg-amber-200/50 rounded-xs px-2 font-mono  text-yellow-700",
        newProperty: "bg-blue-200/50 rounded-xs px-2 font-mono text-blue-700",
      },
      severity: {
        error: "bg-destructive text-white",
        warning: "bg-yellow-500 text-white",
        suggestion: "bg-blue-500 text-white",
      },
      isCombo: {
        true: "bg-gray-500 text-white text-xs rounded-xs ",
        false: "bg-[#006ACC] text-primary-foreground text-xs rounded-xs",
      },
      copyable: {
        true: "cursor-pointer hover:opacity-90 active:opacity-75",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      copyable: false,
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  severity,
  isCombo,
  copyable = false,
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
    severity?: Severity;
    isCombo?: boolean;
    comboIndex?: number;
    copyable?: boolean;
  }) {
  const Comp = asChild ? Slot : "span";
  const ref = React.useRef<HTMLElement>(null);
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState(false);

  const fallbackCopy = (str: string) => {
    const ta = document.createElement("textarea");
    ta.value = str;
    ta.style.position = "fixed";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      setCopied(true);
    } catch {
      setError(true);
    }
    document.body.removeChild(ta);
    setTimeout(() => {
      setCopied(false);
      setError(false);
    }, 1000);
  };

  const handleCopy = () => {
    if (!copyable || !ref.current) return;
    const text = ref.current.textContent?.trim() ?? "";
    if (!text) {
      setError(true);
      setTimeout(() => setError(false), 1000);
      return;
    }

    if (!navigator.clipboard) {
      fallbackCopy(text);
      return;
    }

    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1000);
      })
      .catch(() => {
        fallbackCopy(text);
      });
  };

  return (
    <Comp
      ref={ref}
      data-slot="badge"
      className={cn(
        badgeVariants({
          variant,
          severity: severity as "error" | "warning" | "suggestion",
          isCombo,
          copyable,
        }),
        className
      )}
      onClick={copyable ? handleCopy : undefined}
      {...props}
    >
      {children}
      {copyable &&
        (copied ? (
          <CircleCheckBig
            className="ml-1 h-3 w-3 text-green-200"
            aria-label="Copied"
          />
        ) : error ? (
          <AlertCircle
            className="ml-1 h-3 w-3 text-red-500"
            aria-label="Copy failed"
          />
        ) : (
          <Copy className="ml-1 h-3 w-3" aria-label="Copy to clipboard" />
        ))}
    </Comp>
  );
}

export { Badge, badgeVariants };
