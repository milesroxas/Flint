import type { NamingRule, RuleResult } from "@/features/linter/model/rule.types";

/**
 * Client-First: Avoid abbreviations in class names.
 *
 * From the Client-First docs: "Do not use abbreviations."
 * Class names should be meaningful and complete so anyone can understand
 * their purpose at a glance.
 *
 * This is a conservative heuristic — it only flags well-known abbreviations
 * and uses suggestion severity to avoid false positives.
 */

/** Map of common abbreviations to their full forms */
const ABBREVIATION_MAP: Record<string, string> = {
  btn: "button",
  col: "column",
  desc: "description",
  hdr: "header",
  ftr: "footer",
  img: "image",
  bkg: "background",
  bg: "background",
  txt: "text",
  cta: "call-to-action",
  num: "number",
  msg: "message",
  info: "information",
  auth: "authentication",
  pwd: "password",
  tbl: "table",
  sm: "small",
  md: "medium",
  lg: "large",
  xl: "extra-large",
};

/**
 * Tokens that look like abbreviations but are standard terms in Client-First
 * or commonly accepted in web development. These should NOT be flagged.
 */
const ALLOWED_SHORT_TOKENS = new Set([
  // Client-First utility prefixes and standard tokens
  "u",
  "is",
  "c",
  // Common accepted short words
  "nav",
  "faq",
  "cta",
  "svg",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "1x1",
  "2x",
  "px",
  "em",
  "rem",
  "vw",
  "vh",
  "id",
  "ok",
  "ui",
  "io",
  "to",
  "or",
  "an",
  "at",
  "on",
  "in",
  "up",
  "no",
  "of",
]);

export const createCFNoAbbreviationsRule = (): NamingRule => ({
  id: "cf:naming:no-abbreviations",
  name: "Client-First: Avoid abbreviations",
  description: "Class names should be meaningful and complete. Avoid abbreviations that reduce clarity.",
  example: "testimonials_wrapper (not test_wrap), button (not btn)",
  type: "naming",
  severity: "suggestion",
  enabled: true,
  category: "semantics",
  targetClassTypes: ["custom", "utility"],

  test: (className: string): boolean => {
    const tokens = className.split(/[-_]/).filter(Boolean);
    return !tokens.some((token) => token in ABBREVIATION_MAP && !ALLOWED_SHORT_TOKENS.has(token));
  },

  evaluate: (className: string): RuleResult | null => {
    const tokens = className.split(/[-_]/).filter(Boolean);
    const found: Array<{ abbr: string; full: string }> = [];

    for (const token of tokens) {
      if (token in ABBREVIATION_MAP && !ALLOWED_SHORT_TOKENS.has(token)) {
        found.push({ abbr: token, full: ABBREVIATION_MAP[token] });
      }
    }

    if (found.length === 0) return null;

    const suggestions = found.map((f) => `"${f.abbr}" → "${f.full}"`).join(", ");

    return {
      ruleId: "cf:naming:no-abbreviations",
      name: "Client-First: Avoid abbreviations",
      message: `Class "${className}" contains abbreviations: ${suggestions}. Use full, meaningful names.`,
      severity: "suggestion",
      className,
      isCombo: false,
      metadata: {
        abbreviations: found,
      },
    };
  },
});
