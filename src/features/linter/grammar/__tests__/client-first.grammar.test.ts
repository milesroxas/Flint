import { describe, expect, it } from "vitest";
import {
  clientFirstGrammar,
  isContainerUtilityClass,
} from "@/features/linter/grammar/client-first.grammar";

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
    it("extracts tokens splitting on underscore only (preserving dashes)", () => {
      const parsed = clientFirstGrammar.parse("hero_wrapper");
      expect(parsed.kind).toBe("custom");
      expect(parsed.tokens).toEqual(["hero", "wrapper"]);
      expect(parsed.type).toBe("hero");
    });

    it("preserves dashes within underscore-separated segments", () => {
      const parsed = clientFirstGrammar.parse("team-list_headshot-image");
      expect(parsed.kind).toBe("custom");
      expect(parsed.tokens).toEqual(["team-list", "headshot-image"]);
      expect(parsed.type).toBe("team-list");
      expect(parsed.elementToken).toBe("headshot-image");
      expect(parsed.componentKey).toBe("team-list");
    });

    it("extracts componentKey from wrapper classes", () => {
      const parsed = clientFirstGrammar.parse("hero_wrapper");
      expect(parsed.componentKey).toBe("hero");
    });

    it("extracts componentKey from dash-suffixed wrapper classes", () => {
      const parsed = clientFirstGrammar.parse("hero_content-wrapper");
      expect(parsed.componentKey).toBe("hero");
    });

    it("handles section_identifier pattern", () => {
      const parsed = clientFirstGrammar.parse("section_about");
      expect(parsed.kind).toBe("custom");
      expect(parsed.type).toBe("section");
      expect(parsed.componentKey).toBe("about");
    });

    it("handles multi-folder custom classes", () => {
      const parsed = clientFirstGrammar.parse("blog-feed_item_title");
      expect(parsed.tokens).toEqual(["blog-feed", "item", "title"]);
      expect(parsed.componentKey).toBe("blog-feed_item");
    });

    it("handles simple folder_element classes", () => {
      const parsed = clientFirstGrammar.parse("header_background-layer");
      expect(parsed.tokens).toEqual(["header", "background-layer"]);
      expect(parsed.type).toBe("header");
      expect(parsed.elementToken).toBe("background-layer");
      expect(parsed.componentKey).toBe("header");
    });

    it("handles faq_item pattern", () => {
      const parsed = clientFirstGrammar.parse("faq_item");
      expect(parsed.tokens).toEqual(["faq", "item"]);
      expect(parsed.componentKey).toBe("faq");
    });
  });

  describe("isContainerUtilityClass", () => {
    it("returns true for container utilities", () => {
      expect(isContainerUtilityClass("container-large")).toBe(true);
      expect(isContainerUtilityClass("container-small")).toBe(true);
    });

    it("returns false for non-container classes", () => {
      expect(isContainerUtilityClass("padding-global")).toBe(false);
      expect(isContainerUtilityClass("max-width-large")).toBe(false);
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
