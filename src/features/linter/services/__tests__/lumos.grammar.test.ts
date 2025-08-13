import { describe, it, expect } from "vitest";
import { lumosGrammar } from "@/features/linter/grammar/lumos.grammar";

function parse(name: string) {
  return lumosGrammar.parse(name);
}

describe("lumosGrammar classification", () => {
  it("classifies utilities, components, combos, and customs", () => {
    expect(parse("u-padding").kind).toBe("utility");
    expect(parse("c-card").kind).toBe("component");

    expect(parse("is-active").kind).toBe("combo");
    expect(parse("is_active").kind).toBe("combo");
    expect(parse("isActive").kind).toBe("combo");

    expect(parse("card_title").kind).toBe("custom");
  });
});

describe("lumosGrammar custom parsing", () => {
  it("parses type, variation, and elementToken from 3+ tokens", () => {
    const p = parse("card_primary_title");
    expect(p.kind).toBe("custom");
    expect(p.tokens).toEqual(["card", "primary", "title"]);
    expect(p.type).toBe("card");
    expect(p.variation).toBe("primary");
    expect(p.elementToken).toBe("title");
  });

  it("parses type and elementToken from 2 tokens (no variation)", () => {
    const p = parse("section_container");
    expect(p.kind).toBe("custom");
    expect(p.tokens).toEqual(["section", "container"]);
    expect(p.type).toBe("section");
    expect(p.variation).toBeUndefined();
    expect(p.elementToken).toBe("container");
  });

  it("parses type only from single token (no elementToken, no variation)", () => {
    const p = parse("card");
    expect(p.kind).toBe("custom");
    expect(p.tokens).toEqual(["card"]);
    expect(p.type).toBe("card");
    expect(p.variation).toBeUndefined();
    expect(p.elementToken).toBeUndefined();
  });
});

describe("lumosGrammar metadata", () => {
  it("exposes expected prefixes and flags", () => {
    expect(lumosGrammar.id).toBe("lumos");
    expect(lumosGrammar.isCustomFirstRequired).toBe(true);
    expect(lumosGrammar.utilityPrefix).toBe("u-");
    expect(lumosGrammar.componentPrefix).toBe("c-");
    expect(lumosGrammar.comboPrefix).toBe("is-");
  });
});


