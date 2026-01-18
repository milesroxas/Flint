import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, CircleCheckBig, Copy } from "lucide-react";
import * as React from "react";
import { cn } from "@/shared/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center leading-none rounded-xs px-2 py-0.5 my-0.5 text-xs font-medium w-fit min-w-0 max-w-full gap-1 [&>svg]:pointer-events-none focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-colors overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-hover",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive-hover active:bg-destructive-hover focus-visible:ring-destructive/20",
        outline: "border border-input text-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        error: "bg-error text-error-foreground hover:bg-error-hover active:bg-error-active",
        warning: "bg-warning text-warning-foreground hover:bg-warning-hover active:bg-warning-active",
        suggestion: "bg-suggestion text-suggestion-foreground hover:bg-suggestion-hover active:bg-suggestion-active",
        inheritedProperty: "bg-secondary text-secondary-foreground rounded-xs px-2 font-mono",
        propertyName:
          "bg-property-name text-property-name-foreground hover:bg-property-name-hover active:bg-property-name-active rounded-xs px-2 font-mono",
        newProperty: "bg-secondary text-secondary-foreground rounded-xs px-2 font-mono",
        webflowClass:
          "bg-webflow-class text-webflow-class-foreground hover:bg-webflow-class-hover active:bg-webflow-class-active rounded-xs px-2 font-mono",
        webflowClassMuted:
          "bg-webflow-class/20 text-webflow-class-foreground hover:bg-webflow-class-hover active:bg-webflow-class-active/50 rounded-xs px-2 font-mono",
        errorContent:
          "bg-error-content text-error-content-foreground hover:bg-error-content-hover active:bg-error-content-active rounded-xs px-2 font-mono",
        suggestionContent:
          "bg-suggestion-content text-suggestion-content-foreground hover:bg-suggestion-content-hover active:bg-suggestion-content-active rounded-xs px-2 font-mono",
        dynamicProperty:
          "bg-dynamic-property text-dynamic-property-foreground hover:bg-dynamic-property-hover active:bg-dynamic-property-active rounded-xs px-2 font-mono",
      },
      isCombo: {
        true: "bg-dynamic-property/50 text-dynamic-property-foreground text-xs rounded-xs border-l-2 border-l-dynamic-property hover:bg-dynamic-property-hover/50",
        false: "",
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
  isCombo,
  copyable = false,
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
    isCombo?: boolean;
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
      setError(false);
    } catch {
      setError(true);
      setCopied(false);
    }
    document.body.removeChild(ta);
  };

  const handleCopy = () => {
    if (!copyable || !ref.current) return;
    const text = ref.current.textContent?.trim() ?? "";
    if (!text) {
      setError(true);
      setCopied(false);
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
        setError(false);
      })
      .catch(() => {
        fallbackCopy(text);
      });
  };

  return (
    <Comp
      ref={ref}
      data-slot="badge"
      className={cn(badgeVariants({ variant, isCombo, copyable }), className)}
      onClick={copyable ? handleCopy : undefined}
      {...props}
    >
      {children}
      {copyable &&
        (copied ? (
          <CircleCheckBig className="ml-1 h-3 w-3 text-accent" aria-label="Copied" />
        ) : error ? (
          <AlertCircle className="ml-1 h-3 w-3 text-error" aria-label="Copy failed" />
        ) : (
          <Copy className="ml-1 h-3 w-3" aria-label="Copy to clipboard" />
        ))}
    </Comp>
  );
}

export { Badge, badgeVariants };
