import { describe, expect, it } from "vitest";
import { lumosPreset } from "@/features/linter/presets/lumos.preset";

describe("lumos preset", () => {
  it("registers the full Lumos rule set in stable order", () => {
    const ids = lumosPreset.rules.map((r) => r.id);
    expect(ids).toEqual([
      "lumos:naming:class-format",
      "lumos:naming:combo-class-format",
      "lumos:composition:class-order",
      "lumos:composition:variant-requires-base",
      "lumos:composition:combo-limit",
      "shared:property:duplicate-of-utility",
      "shared:property:color-variable",
      "canonical:utility-duplicate-property",
      "shared:structure:missing-class-on-div",
    ]);
  });

  it("uses Lumos grammar and preset id", () => {
    expect(lumosPreset.id).toBe("lumos");
    expect(lumosPreset.grammar?.id).toBe("lumos");
    expect(lumosPreset.roleDetectors).toBeDefined();
  });
});
