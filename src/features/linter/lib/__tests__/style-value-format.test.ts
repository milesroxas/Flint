import { describe, expect, it } from "vitest";
import { formatStyleValueForLint } from "@/features/linter/lib/style-value-format";

describe("formatStyleValueForLint", () => {
  it("passes through plain strings", () => {
    expect(formatStyleValueForLint("1rem")).toBe("1rem");
  });

  it("resolves Webflow variable refs when a map entry exists", () => {
    const id = "variable-abc-def";
    const map = new Map([[id, "Brand / Primary"]]);
    expect(formatStyleValueForLint({ id }, map)).toBe("Brand / Primary");
  });

  it("falls back to variable id when unmapped", () => {
    const id = "variable-unmapped";
    expect(formatStyleValueForLint({ id }, new Map())).toBe(id);
  });
});
