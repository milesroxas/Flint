/**
 * Page fixtures for integration tests.
 *
 * Each fixture represents a realistic Webflow page structure with:
 * - Element hierarchy (parent/child relationships)
 * - Style assignments per element
 * - Role mappings
 * - Tag/element type metadata
 *
 * Fixtures come in two flavors (Lumos and Client-First) to test
 * both presets against equivalent page structures.
 */
import type { StyleWithElement } from "@/entities/style/model/style.types";
import type { RolesByElement } from "@/features/linter/model/linter.types";

export interface PageFixture {
  name: string;
  description: string;
  /** parent ID lookup: childId → parentId */
  parentMap: Record<string, string | null>;
  /** children ID lookup: parentId → childIds */
  childrenMap: Record<string, string[]>;
  /** styles applied to each element */
  styles: StyleWithElement[];
  /** expected role assignments */
  rolesByElement: RolesByElement;
  /** HTML tag per element */
  tagMap: Record<string, string | null>;
  /** Webflow element type per element */
  elementTypeMap: Record<string, string | null>;
  /** class names per element (for getClassNamesForElement) */
  classNamesMap: Record<string, string[]>;
  /** Placed component roots: element id → component definition id (matches Designer `componentIdByElementId`) */
  componentIdByElementId?: Record<string, string>;
}

// ── Lumos fixtures ─────────────────────────────────────────────────

/**
 * A well-structured Lumos page with no violations.
 * Demonstrates correct naming, structure, and composition.
 */
export const lumosCleanPage: PageFixture = {
  name: "lumos-clean-page",
  description: "Well-structured Lumos page with zero expected violations",
  parentMap: {
    "el-main": null,
    "el-section-hero": "el-main",
    "el-hero-wrap": "el-section-hero",
    "el-hero-heading": "el-hero-wrap",
    "el-hero-text": "el-hero-wrap",
    "el-hero-button": "el-hero-wrap",
    "el-section-about": "el-main",
    "el-about-wrap": "el-section-about",
    "el-about-text": "el-about-wrap",
  },
  childrenMap: {
    "el-main": ["el-section-hero", "el-section-about"],
    "el-section-hero": ["el-hero-wrap"],
    "el-hero-wrap": ["el-hero-heading", "el-hero-text", "el-hero-button"],
    "el-section-about": ["el-about-wrap"],
    "el-about-wrap": ["el-about-text"],
  },
  styles: [
    {
      id: "s1",
      name: "main_wrap",
      properties: { display: "flex", "flex-direction": "column" },
      order: 0,
      isCombo: false,
      elementId: "el-main",
    },
    {
      id: "s2",
      name: "hero_primary_wrap",
      properties: { padding: "4rem" },
      order: 0,
      isCombo: false,
      elementId: "el-section-hero",
    },
    {
      id: "s3",
      name: "hero_primary_content_wrap",
      properties: { "max-width": "1200px" },
      order: 0,
      isCombo: false,
      elementId: "el-hero-wrap",
    },
    {
      id: "s4",
      name: "hero_primary_heading",
      properties: { "font-size": "3rem" },
      order: 0,
      isCombo: false,
      elementId: "el-hero-heading",
    },
    {
      id: "s5",
      name: "hero_primary_text",
      properties: { "font-size": "1.25rem" },
      order: 0,
      isCombo: false,
      elementId: "el-hero-text",
    },
    {
      id: "s6",
      name: "u-button-primary",
      properties: { "background-color": { id: "variable-blue" } },
      order: 0,
      isCombo: false,
      elementId: "el-hero-button",
    },
    {
      id: "s7",
      name: "about_main_wrap",
      properties: { padding: "4rem" },
      order: 0,
      isCombo: false,
      elementId: "el-section-about",
    },
    {
      id: "s8",
      name: "about_main_content_wrap",
      properties: { "max-width": "800px" },
      order: 0,
      isCombo: false,
      elementId: "el-about-wrap",
    },
    {
      id: "s9",
      name: "about_main_text",
      properties: { "font-size": "1rem" },
      order: 0,
      isCombo: false,
      elementId: "el-about-text",
    },
  ],
  rolesByElement: {
    "el-main": "main",
    "el-section-hero": "section",
    "el-hero-wrap": "componentRoot",
    "el-hero-heading": "unknown",
    "el-hero-text": "unknown",
    "el-hero-button": "unknown",
    "el-section-about": "section",
    "el-about-wrap": "componentRoot",
    "el-about-text": "unknown",
  },
  tagMap: {
    "el-main": "div",
    "el-section-hero": "section",
    "el-hero-wrap": "div",
    "el-hero-heading": "h1",
    "el-hero-text": "p",
    "el-hero-button": "a",
    "el-section-about": "section",
    "el-about-wrap": "div",
    "el-about-text": "p",
  },
  elementTypeMap: {
    "el-main": "Block",
    "el-section-hero": "Section",
    "el-hero-wrap": "Block",
    "el-hero-heading": "Heading",
    "el-hero-text": "Paragraph",
    "el-hero-button": "Link",
    "el-section-about": "Section",
    "el-about-wrap": "Block",
    "el-about-text": "Paragraph",
  },
  classNamesMap: {
    "el-main": ["main_wrap"],
    "el-section-hero": ["hero_primary_wrap"],
    "el-hero-wrap": ["hero_primary_content_wrap"],
    "el-hero-heading": ["hero_primary_heading"],
    "el-hero-text": ["hero_primary_text"],
    "el-hero-button": ["u-button-primary"],
    "el-section-about": ["about_main_wrap"],
    "el-about-wrap": ["about_main_content_wrap"],
    "el-about-text": ["about_main_text"],
  },
};

/**
 * A Lumos page with deliberate violations across multiple rule categories.
 */
export const lumosViolationsPage: PageFixture = {
  name: "lumos-violations-page",
  description: "Lumos page with deliberate naming, structure, and property violations",
  parentMap: {
    "el-main": null,
    "el-hero": "el-main",
    "el-hero-wrap": "el-hero",
    "el-hero-heading": "el-hero-wrap",
    "el-hero-img": "el-hero-wrap",
    "el-unclassed-div": "el-hero-wrap",
  },
  childrenMap: {
    "el-main": ["el-hero"],
    "el-hero": ["el-hero-wrap"],
    "el-hero-wrap": ["el-hero-heading", "el-hero-img", "el-unclassed-div"],
  },
  styles: [
    // Main wrapper
    { id: "s1", name: "main_wrap", properties: { display: "flex" }, order: 0, isCombo: false, elementId: "el-main" },
    // Section - valid
    {
      id: "s2",
      name: "hero_primary_wrap",
      properties: { padding: "4rem" },
      order: 0,
      isCombo: false,
      elementId: "el-hero",
    },
    // Component root
    {
      id: "s3",
      name: "hero_primary_content_wrap",
      properties: {},
      order: 0,
      isCombo: false,
      elementId: "el-hero-wrap",
    },
    // BAD: single-segment name (naming violation)
    {
      id: "s4",
      name: "heading",
      properties: { "font-size": "3rem" },
      order: 0,
      isCombo: false,
      elementId: "el-hero-heading",
    },
    // BAD: hardcoded color (property violation)
    {
      id: "s5",
      name: "hero_primary_img",
      properties: { "background-color": "#ff0000", width: "100%" },
      order: 0,
      isCombo: false,
      elementId: "el-hero-img",
    },
    // BAD: combo before base class (composition violation) — uses order to simulate wrong placement
    { id: "s6", name: "is-active", properties: {}, order: 0, isCombo: true, elementId: "el-hero-heading" },
    // el-unclassed-div has NO styles at all → missing-class-on-div
  ],
  rolesByElement: {
    "el-main": "main",
    "el-hero": "section",
    "el-hero-wrap": "componentRoot",
    "el-hero-heading": "unknown",
    "el-hero-img": "unknown",
    "el-unclassed-div": "unknown",
  },
  tagMap: {
    "el-main": "div",
    "el-hero": "section",
    "el-hero-wrap": "div",
    "el-hero-heading": "h1",
    "el-hero-img": "img",
    "el-unclassed-div": "div",
  },
  elementTypeMap: {
    "el-main": "Block",
    "el-hero": "Section",
    "el-hero-wrap": "Block",
    "el-hero-heading": "Heading",
    "el-hero-img": "Image",
    "el-unclassed-div": "Block",
  },
  classNamesMap: {
    "el-main": ["main_wrap"],
    "el-hero": ["hero_primary_wrap"],
    "el-hero-wrap": ["hero_primary_content_wrap"],
    "el-hero-heading": ["heading", "is-active"],
    "el-hero-img": ["hero_primary_img"],
    "el-unclassed-div": [],
  },
};

// ── Client-First fixtures ──────────────────────────────────────────

/**
 * A well-structured Client-First page with no violations.
 */
export const clientFirstCleanPage: PageFixture = {
  name: "cf-clean-page",
  description: "Well-structured Client-First page with zero expected violations",
  parentMap: {
    "el-page-wrapper": null,
    "el-main-wrapper": "el-page-wrapper",
    "el-section-hero": "el-main-wrapper",
    "el-padding-global": "el-section-hero",
    "el-container": "el-padding-global",
    "el-hero-wrap": "el-container",
    "el-hero-heading": "el-hero-wrap",
    "el-hero-text": "el-hero-wrap",
    "el-section-about": "el-main-wrapper",
    "el-padding-global-2": "el-section-about",
    "el-container-2": "el-padding-global-2",
    "el-about-wrap": "el-container-2",
    "el-about-text": "el-about-wrap",
  },
  childrenMap: {
    "el-page-wrapper": ["el-main-wrapper"],
    "el-main-wrapper": ["el-section-hero", "el-section-about"],
    "el-section-hero": ["el-padding-global"],
    "el-padding-global": ["el-container"],
    "el-container": ["el-hero-wrap"],
    "el-hero-wrap": ["el-hero-heading", "el-hero-text"],
    "el-section-about": ["el-padding-global-2"],
    "el-padding-global-2": ["el-container-2"],
    "el-container-2": ["el-about-wrap"],
    "el-about-wrap": ["el-about-text"],
  },
  styles: [
    { id: "s1", name: "page-wrapper", properties: {}, order: 0, isCombo: false, elementId: "el-page-wrapper" },
    { id: "s2", name: "main-wrapper", properties: {}, order: 0, isCombo: false, elementId: "el-main-wrapper" },
    {
      id: "s3",
      name: "section_hero",
      properties: { padding: "0" },
      order: 0,
      isCombo: false,
      elementId: "el-section-hero",
    },
    {
      id: "s4",
      name: "padding-global",
      properties: { "padding-left": "5%", "padding-right": "5%" },
      order: 0,
      isCombo: false,
      elementId: "el-padding-global",
    },
    {
      id: "s5",
      name: "container-large",
      properties: { "max-width": "80rem" },
      order: 0,
      isCombo: false,
      elementId: "el-container",
    },
    {
      id: "s6",
      name: "hero_content-wrapper",
      properties: { display: "flex" },
      order: 0,
      isCombo: false,
      elementId: "el-hero-wrap",
    },
    {
      id: "s7",
      name: "hero_heading",
      properties: { "font-size": "3rem" },
      order: 0,
      isCombo: false,
      elementId: "el-hero-heading",
    },
    {
      id: "s8",
      name: "hero_text",
      properties: { "font-size": "1.25rem" },
      order: 0,
      isCombo: false,
      elementId: "el-hero-text",
    },
    {
      id: "s9",
      name: "section_content",
      properties: { padding: "0" },
      order: 0,
      isCombo: false,
      elementId: "el-section-about",
    },
    {
      id: "s10",
      name: "padding-global",
      properties: { "padding-left": "5%", "padding-right": "5%" },
      order: 0,
      isCombo: false,
      elementId: "el-padding-global-2",
    },
    {
      id: "s11",
      name: "container-large",
      properties: { "max-width": "80rem" },
      order: 0,
      isCombo: false,
      elementId: "el-container-2",
    },
    {
      id: "s12",
      name: "about_content-wrapper",
      properties: { display: "flex" },
      order: 0,
      isCombo: false,
      elementId: "el-about-wrap",
    },
    {
      id: "s13",
      name: "about_text",
      properties: { "font-size": "1rem" },
      order: 0,
      isCombo: false,
      elementId: "el-about-text",
    },
  ],
  rolesByElement: {
    "el-page-wrapper": "unknown",
    "el-main-wrapper": "main",
    "el-section-hero": "section",
    "el-padding-global": "unknown",
    "el-container": "unknown",
    "el-hero-wrap": "componentRoot",
    "el-hero-heading": "unknown",
    "el-hero-text": "unknown",
    "el-section-about": "section",
    "el-padding-global-2": "unknown",
    "el-container-2": "unknown",
    "el-about-wrap": "componentRoot",
    "el-about-text": "unknown",
  },
  tagMap: {
    "el-page-wrapper": "div",
    "el-main-wrapper": "div",
    "el-section-hero": "section",
    "el-padding-global": "div",
    "el-container": "div",
    "el-hero-wrap": "div",
    "el-hero-heading": "h1",
    "el-hero-text": "p",
    "el-section-about": "section",
    "el-padding-global-2": "div",
    "el-container-2": "div",
    "el-about-wrap": "div",
    "el-about-text": "p",
  },
  elementTypeMap: {
    "el-page-wrapper": "Block",
    "el-main-wrapper": "Block",
    "el-section-hero": "Section",
    "el-padding-global": "Block",
    "el-container": "Block",
    "el-hero-wrap": "Block",
    "el-hero-heading": "Heading",
    "el-hero-text": "Paragraph",
    "el-section-about": "Section",
    "el-padding-global-2": "Block",
    "el-container-2": "Block",
    "el-about-wrap": "Block",
    "el-about-text": "Paragraph",
  },
  classNamesMap: {
    "el-page-wrapper": ["page-wrapper"],
    "el-main-wrapper": ["main-wrapper"],
    "el-section-hero": ["section_hero"],
    "el-padding-global": ["padding-global"],
    "el-container": ["container-large"],
    "el-hero-wrap": ["hero_content-wrapper"],
    "el-hero-heading": ["hero_heading"],
    "el-hero-text": ["hero_text"],
    "el-section-about": ["section_content"],
    "el-padding-global-2": ["padding-global"],
    "el-container-2": ["container-large"],
    "el-about-wrap": ["about_content-wrapper"],
    "el-about-text": ["about_text"],
  },
};

/**
 * A Client-First page with deliberate violations.
 */
export const clientFirstViolationsPage: PageFixture = {
  name: "cf-violations-page",
  description: "Client-First page with naming, structure, and property violations",
  parentMap: {
    "el-page-wrapper": null,
    "el-main-wrapper": "el-page-wrapper",
    "el-section-hero": "el-main-wrapper",
    "el-hero-wrap": "el-section-hero",
    "el-hero-heading": "el-hero-wrap",
    "el-unclassed-div": "el-hero-wrap",
  },
  childrenMap: {
    "el-page-wrapper": ["el-main-wrapper"],
    "el-main-wrapper": ["el-section-hero"],
    "el-section-hero": ["el-hero-wrap"],
    "el-hero-wrap": ["el-hero-heading", "el-unclassed-div"],
  },
  styles: [
    { id: "s1", name: "page-wrapper", properties: {}, order: 0, isCombo: false, elementId: "el-page-wrapper" },
    { id: "s2", name: "main-wrapper", properties: {}, order: 0, isCombo: false, elementId: "el-main-wrapper" },
    { id: "s3", name: "section_hero", properties: {}, order: 0, isCombo: false, elementId: "el-section-hero" },
    { id: "s4", name: "hero_content-wrapper", properties: {}, order: 0, isCombo: false, elementId: "el-hero-wrap" },
    // BAD: uppercase in custom class (naming violation)
    {
      id: "s5",
      name: "Hero_Title",
      properties: { "font-size": "3rem", color: "#ff0000" },
      order: 0,
      isCombo: false,
      elementId: "el-hero-heading",
    },
    // BAD: hardcoded color (property violation on the same element)
    // el-unclassed-div has NO styles → missing-class-on-div
  ],
  rolesByElement: {
    "el-page-wrapper": "unknown",
    "el-main-wrapper": "main",
    "el-section-hero": "section",
    "el-hero-wrap": "componentRoot",
    "el-hero-heading": "unknown",
    "el-unclassed-div": "unknown",
  },
  tagMap: {
    "el-page-wrapper": "div",
    "el-main-wrapper": "div",
    "el-section-hero": "section",
    "el-hero-wrap": "div",
    "el-hero-heading": "h1",
    "el-unclassed-div": "div",
  },
  elementTypeMap: {
    "el-page-wrapper": "Block",
    "el-main-wrapper": "Block",
    "el-section-hero": "Section",
    "el-hero-wrap": "Block",
    "el-hero-heading": "Heading",
    "el-unclassed-div": "Block",
  },
  classNamesMap: {
    "el-page-wrapper": ["page-wrapper"],
    "el-main-wrapper": ["main-wrapper"],
    "el-section-hero": ["section_hero"],
    "el-hero-wrap": ["hero_content-wrapper"],
    "el-hero-heading": ["Hero_Title"],
    "el-unclassed-div": [],
  },
};

/**
 * Client-First: direct child of padding-global uses custom max-width instead of container-*.
 */
export const clientFirstPaddingGlobalChildDriftPage: PageFixture = {
  name: "cf-padding-global-child-drift",
  description: "padding-global → custom inner with container-like CSS (no container utility)",
  parentMap: {
    "el-main": null,
    "el-section": "el-main",
    "el-pg": "el-section",
    "el-drift": "el-pg",
  },
  childrenMap: {
    "el-main": ["el-section"],
    "el-section": ["el-pg"],
    "el-pg": ["el-drift"],
  },
  styles: [
    { id: "s1", name: "main-wrapper", properties: {}, order: 0, isCombo: false, elementId: "el-main" },
    { id: "s2", name: "section_hero", properties: {}, order: 0, isCombo: false, elementId: "el-section" },
    {
      id: "s3",
      name: "padding-global",
      properties: { "padding-left": "5%", "padding-right": "5%" },
      order: 0,
      isCombo: false,
      elementId: "el-pg",
    },
    {
      id: "s4",
      name: "hero_custom-inner",
      properties: { "max-width": "48rem", "margin-left": "auto", "margin-right": "auto" },
      order: 0,
      isCombo: false,
      elementId: "el-drift",
    },
  ],
  rolesByElement: {
    "el-main": "main",
    "el-section": "section",
    "el-pg": "unknown",
    "el-drift": "unknown",
  },
  tagMap: {
    "el-main": "div",
    "el-section": "section",
    "el-pg": "div",
    "el-drift": "div",
  },
  elementTypeMap: {
    "el-main": "Block",
    "el-section": "Section",
    "el-pg": "Block",
    "el-drift": "Block",
  },
  classNamesMap: {
    "el-main": ["main-wrapper"],
    "el-section": ["section_hero"],
    "el-pg": ["padding-global"],
    "el-drift": ["hero_custom-inner"],
  },
};

/**
 * Same drift as `clientFirstPaddingGlobalChildDriftPage`, but `padding-global` sits under a placed component root.
 */
export const clientFirstPaddingGlobalChildDriftInComponentPage: PageFixture = {
  name: "cf-padding-global-child-drift-in-component",
  description: "padding-global → custom inner under ComponentInstance",
  parentMap: {
    "el-main": null,
    "el-comp": "el-main",
    "el-pg": "el-comp",
    "el-drift": "el-pg",
  },
  childrenMap: {
    "el-main": ["el-comp"],
    "el-comp": ["el-pg"],
    "el-pg": ["el-drift"],
  },
  styles: [
    { id: "s1", name: "main-wrapper", properties: {}, order: 0, isCombo: false, elementId: "el-main" },
    {
      id: "s3",
      name: "padding-global",
      properties: { "padding-left": "5%", "padding-right": "5%" },
      order: 0,
      isCombo: false,
      elementId: "el-pg",
    },
    {
      id: "s4",
      name: "hero_custom-inner",
      properties: { "max-width": "48rem", "margin-left": "auto", "margin-right": "auto" },
      order: 0,
      isCombo: false,
      elementId: "el-drift",
    },
  ],
  rolesByElement: {
    "el-main": "main",
    "el-comp": "unknown",
    "el-pg": "unknown",
    "el-drift": "unknown",
  },
  tagMap: {
    "el-main": "div",
    "el-comp": "div",
    "el-pg": "div",
    "el-drift": "div",
  },
  elementTypeMap: {
    "el-main": "Block",
    "el-comp": "ComponentInstance",
    "el-pg": "Block",
    "el-drift": "Block",
  },
  classNamesMap: {
    "el-main": ["main-wrapper"],
    "el-comp": [],
    "el-pg": ["padding-global"],
    "el-drift": ["hero_custom-inner"],
  },
  componentIdByElementId: {
    "el-comp": "def-nav-component",
  },
};

// ── Shared violation scenarios ─────────────────────────────────────

/**
 * Minimal fixture for testing shared property rules.
 * Both presets should flag the same violations on these styles.
 */
export const sharedPropertyViolationsPage: PageFixture = {
  name: "shared-property-violations",
  description: "Page with shared property violations (color variables, duplicates)",
  parentMap: {
    "el-root": null,
    "el-card-1": "el-root",
    "el-card-2": "el-root",
    "el-card-3": "el-root",
  },
  childrenMap: {
    "el-root": ["el-card-1", "el-card-2", "el-card-3"],
  },
  styles: [
    // Two utility classes with identical properties (duplicate)
    {
      id: "s1",
      name: "u-red-text",
      properties: { color: "rgba(255,0,0,1)" },
      order: 0,
      isCombo: false,
      elementId: "el-card-1",
    },
    {
      id: "s2",
      name: "u-danger-text",
      properties: { color: "rgba(255,0,0,1)" },
      order: 1,
      isCombo: false,
      elementId: "el-card-2",
    },
    // Hardcoded color (no variable)
    {
      id: "s3",
      name: "u-blue-bg",
      properties: { "background-color": "#0000ff" },
      order: 2,
      isCombo: false,
      elementId: "el-card-3",
    },
  ],
  rolesByElement: {
    "el-root": "main",
    "el-card-1": "unknown",
    "el-card-2": "unknown",
    "el-card-3": "unknown",
  },
  tagMap: {
    "el-root": "div",
    "el-card-1": "div",
    "el-card-2": "div",
    "el-card-3": "div",
  },
  elementTypeMap: {
    "el-root": "Block",
    "el-card-1": "Block",
    "el-card-2": "Block",
    "el-card-3": "Block",
  },
  classNamesMap: {
    "el-root": [],
    "el-card-1": ["u-red-text"],
    "el-card-2": ["u-danger-text"],
    "el-card-3": ["u-blue-bg"],
  },
};
