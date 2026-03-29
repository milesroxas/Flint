import { describe, expect, it } from "vitest";
import { lumosGrammar } from "@/features/linter/grammar/lumos.grammar";

describe("Lumos grammar adapter", () => {
  it("classifies utilities, components, combos, and custom", () => {
    expect(lumosGrammar.parse("u-hidden").kind).toBe("utility");
    expect(lumosGrammar.parse("c-card").kind).toBe("component");
    expect(lumosGrammar.parse("is-active").kind).toBe("combo");
    expect(lumosGrammar.parse("is_active").kind).toBe("combo");
    expect(lumosGrammar.parse("footer_wrap").kind).toBe("custom");
  });

  it("parses custom tokens and componentKey for wrapper suffixes", () => {
    const hero = lumosGrammar.parse("hero_primary_wrap");
    expect(hero.kind).toBe("custom");
    expect(hero.tokens).toEqual(["hero", "primary", "wrap"]);
    expect(hero.componentKey).toBe("hero_primary");

    const nested = lumosGrammar.parse("hero_primary_cta_wrap");
    expect(nested.componentKey).toBe("hero_primary");
  });

  it("parses non-wrapper custom classes", () => {
    const p = lumosGrammar.parse("section_main_content");
    expect(p.kind).toBe("custom");
    expect(p.elementToken).toBe("content");
    expect(p.componentKey).toBe("section_main");
  });
});
