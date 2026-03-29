import { describe, expect, it } from "vitest";
import { stableStringify } from "@/shared/lib/stable-json";

describe("stableStringify", () => {
  it("sorts object keys for stable output", () => {
    expect(stableStringify({ b: 1, a: 2 })).toBe(stableStringify({ a: 2, b: 1 }));
  });

  it("handles nested structures", () => {
    const s = stableStringify({ z: [{ c: 1 }, { a: 0 }] });
    expect(s).toContain('"a"');
  });

  it("replaces circular refs with a placeholder", () => {
    const a: Record<string, unknown> = {};
    a.self = a;
    expect(stableStringify(a)).toContain("Circular");
  });
});
