import type { NamingRule } from "@/features/linter/model/rule.types";

export const cfVariantIsPrefixRule: NamingRule = {
  id: "cf-variant-is-prefix",
  name: "Client-First: Variant is- Prefix",
  description: "Variant classes should start with is-.",
  example: "is-active, is-large",
  type: "naming",
  severity: "warning",
  enabled: true,
  category: "format",
  targetClassTypes: ["combo"],
  test: (className: string): boolean => /^is-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(className),
};


