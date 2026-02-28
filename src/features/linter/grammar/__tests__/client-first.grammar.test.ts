import { describe, expect, it } from "vitest";
import { clientFirstGrammar } from "@/features/linter/grammar/client-first.grammar";

describe("Client-First grammar adapter", () => {
  describe("class type classification", () => {
    it("classifies u- prefixed classes as utility", () => {
      expect(clientFirstGrammar.parse("u-hidden").kind).toBe("utility");
      expect(clientFirstGrammar.parse("u-margin-top").kind).toBe("utility");
    });

    it("classifies is- prefixed classes as combo", () => {
      expect(clientFirstGrammar.parse("is-active").kind).toBe("combo");
      expect(clientFirstGrammar.parse("is-brand").kind).toBe("combo");
      expect(clientFirstGrammar.parse("is-home").kind).toBe("combo");
    });

    it("classifies underscore-containing classes as custom", () => {
      expect(clientFirstGrammar.parse("hero_wrapper").kind).toBe("custom");
      expect(clientFirstGrammar.parse("section_about").kind).toBe("custom");
      expect(clientFirstGrammar.parse("team-list_headshot-image").kind).toBe("custom");
      expect(clientFirstGrammar.parse("header_content").kind).toBe("custom");
      expect(clientFirstGrammar.parse("faq_item").kind).toBe("custom");
    });

    it("classifies dash-only classes as utility (Client-First convention)", () => {
      expect(clientFirstGrammar.parse("text-size-large").kind).toBe("utility");
      expect(clientFirstGrammar.parse("padding-global").kind).toBe("utility");
      expect(clientFirstGrammar.parse("container-large").kind).toBe("utility");
      expect(clientFirstGrammar.parse("background-color-primary").kind).toBe("utility");
      expect(clientFirstGrammar.parse("heading-style-h2").kind).toBe("utility");
      expect(clientFirstGrammar.parse("max-width-large").kind).toBe("utility");
    });

    it("classifies single-word classes as utility", () => {
      expect(clientFirstGrammar.parse("button").kind).toBe("utility");
      expect(clientFirstGrammar.parse("hide").kind).toBe("utility");
      expect(clientFirstGrammar.parse("layer").kind).toBe("utility");
    });

    it("classifies core structure classes as utility", () => {
      expect(clientFirstGrammar.parse("page-wrapper").kind).toBe("utility");
      expect(clientFirstGrammar.parse("main-wrapper").kind).toBe("utility");
      expect(clientFirstGrammar.parse("padding-global").kind).toBe("utility");
      expect(clientFirstGrammar.parse("padding-section-medium").kind).toBe("utility");
      expect(clientFirstGrammar.parse("container-small").kind).toBe("utility");
    });

    it("classifies c- prefixed classes as component", () => {
      expect(clientFirstGrammar.parse("c-button").kind).toBe("component");
    });
  });

  describe("custom class parsing", () => {
    it("extracts tokens from underscore-based custom classes", () => {
      const parsed = clientFirstGrammar.parse("hero_wrapper");
      expect(parsed.kind).toBe("custom");
      expect(parsed.tokens).toBeDefined();
      expect(parsed.type).toBe("hero");
    });

    it("extracts componentKey from custom classes", () => {
      const parsed = clientFirstGrammar.parse("team-list_headshot-image");
      expect(parsed.kind).toBe("custom");
      expect(parsed.componentKey).toBeDefined();
    });

    it("handles section_identifier pattern", () => {
      const parsed = clientFirstGrammar.parse("section_about");
      expect(parsed.kind).toBe("custom");
      expect(parsed.type).toBe("section");
    });
  });

  describe("grammar metadata", () => {
    it("has correct id", () => {
      expect(clientFirstGrammar.id).toBe("client-first");
    });

    it("has correct prefixes", () => {
      expect(clientFirstGrammar.utilityPrefix).toBe("u-");
      expect(clientFirstGrammar.comboPrefix).toBe("is-");
      expect(clientFirstGrammar.componentPrefix).toBe("c-");
    });

    it("requires custom first", () => {
      expect(clientFirstGrammar.isCustomFirstRequired).toBe(true);
    });
  });
});
