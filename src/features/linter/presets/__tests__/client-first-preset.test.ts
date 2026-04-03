import { describe, expect, it } from "vitest";
import { clientFirstPreset } from "@/features/linter/presets/client-first.preset";

describe("client-first preset", () => {
  it("registers the full Client-First rule set in stable order", () => {
    const ids = clientFirstPreset.rules.map((r) => r.id);
    expect(ids).toEqual([
      "cf:naming:class-format",
      "cf:naming:utility-no-underscore",
      "cf:naming:combo-is-prefix",
      "cf:naming:section-format",
      "cf:naming:no-abbreviations",
      "cf:composition:combo-not-alone",
      "cf:composition:padding-section-requires-global",
      "cf:structure:padding-global-child-container",
      "canonical:section-parent-is-main",
      "cf:property:padding-global-horizontal-only",
      "cf:property:prefer-rem",
      "shared:property:duplicate-of-utility",
      "shared:property:color-variable",
      "canonical:utility-duplicate-property",
      "shared:structure:missing-class-on-div",
    ]);
  });

  it("uses Client-First grammar and preset id", () => {
    expect(clientFirstPreset.id).toBe("client-first");
    expect(clientFirstPreset.grammar).toBeDefined();
    expect(clientFirstPreset.roleDetectors).toBeDefined();
  });
});
