/**
 * Shared test factories for creating mock objects used across the test suite.
 *
 * Modeled after ESLint/Biome test infrastructure: centralized factories
 * eliminate duplication and ensure consistent mock shapes.
 */

import type { ElementGraph } from "@/entities/element/services/element-graph.service";
import type { StyleInfo, StyleWithElement } from "@/entities/style/model/style.types";
import type { ParsedClass, RolesByElement } from "@/features/linter/model/linter.types";
import type {
  ClassType,
  ElementAnalysisArgs,
  ElementClassItem,
  PageAnalysisArgs,
  RuleConfiguration,
  RuleContext,
  Severity,
} from "@/features/linter/model/rule.types";

// ── Style factories ────────────────────────────────────────────────

export function createStyleInfo(overrides: Partial<StyleInfo> & { name: string }): StyleInfo {
  return {
    id: overrides.id ?? `style-${overrides.name}`,
    name: overrides.name,
    properties: overrides.properties ?? {},
    order: overrides.order ?? 0,
    isCombo: overrides.isCombo ?? false,
    detectionSource: overrides.detectionSource,
  };
}

export function createStyleWithElement(
  overrides: Partial<StyleWithElement> & { name: string; elementId: string }
): StyleWithElement {
  return {
    ...createStyleInfo(overrides),
    elementId: overrides.elementId,
  };
}

// ── Element class item factory ─────────────────────────────────────

export function createElementClassItem(overrides: Partial<ElementClassItem> & { className: string }): ElementClassItem {
  return {
    className: overrides.className,
    order: overrides.order ?? 0,
    elementId: overrides.elementId ?? "test-element",
    isCombo: overrides.isCombo,
    comboIndex: overrides.comboIndex,
    detectionSource: overrides.detectionSource,
  };
}

// ── Class type resolvers ───────────────────────────────────────────

export function lumosClassType(name: string, isCombo?: boolean): ClassType {
  if (isCombo === true) return "combo";
  if (name.startsWith("u-") || name.startsWith("u_")) return "utility";
  if (name.startsWith("c-")) return "custom";
  if (/^(?:is[-_][A-Za-z0-9_]+|is[A-Z][A-Za-z0-9_]*)$/.test(name)) return "combo";
  return "custom";
}

export function clientFirstClassType(name: string, isCombo?: boolean): ClassType {
  if (isCombo === true) return "combo";
  if (name.startsWith("u-")) return "utility";
  if (name.startsWith("c-")) return "custom";
  if (name.startsWith("is-")) return "combo";
  if (name.includes("_")) return "custom";
  return "utility";
}

// ── Rule context factory ───────────────────────────────────────────

export function createRuleContext(overrides: Partial<RuleContext> = {}): RuleContext {
  return {
    allStyles: overrides.allStyles ?? [],
    utilityClassPropertiesMap: overrides.utilityClassPropertiesMap ?? new Map(),
    propertyToClassesMap: overrides.propertyToClassesMap ?? new Map(),
  };
}

export const EMPTY_RULE_CONTEXT: RuleContext = createRuleContext();

// ── Element analysis args factory ──────────────────────────────────

export interface ElementAnalysisArgsOptions {
  elementId?: string;
  classes?: Array<{
    className: string;
    order?: number;
    isCombo?: boolean;
    comboIndex?: number;
  }>;
  allStyles?: StyleInfo[];
  classTypeResolver?: (name: string, isCombo?: boolean) => ClassType;
  rolesByElement?: RolesByElement;
  parentMap?: Record<string, string | null>;
  childrenMap?: Record<string, string[]>;
  tagMap?: Record<string, string | null>;
  elementTypeMap?: Record<string, string | null>;
  classNamesMap?: Record<string, string[]>;
  parseClass?: (name: string) => ParsedClass;
  grammarElementSeparator?: string;
  ruleConfigs?: Record<string, RuleConfiguration>;
}

export function createElementAnalysisArgs(opts: ElementAnalysisArgsOptions = {}): ElementAnalysisArgs {
  const elementId = opts.elementId ?? "test-element";
  const roles = opts.rolesByElement;
  const parents = opts.parentMap;
  const children = opts.childrenMap;
  const classNames = opts.classNamesMap;
  const tags = opts.tagMap;
  const elTypes = opts.elementTypeMap;

  const classes: ElementClassItem[] = (opts.classes ?? []).map((c, i) => ({
    className: c.className,
    order: c.order ?? i,
    elementId,
    isCombo: c.isCombo,
    comboIndex: c.comboIndex,
  }));

  return {
    elementId,
    classes,
    allStyles: opts.allStyles ?? [],
    getClassType: opts.classTypeResolver ?? lumosClassType,
    getRuleConfig: (ruleId: string) => opts.ruleConfigs?.[ruleId],
    rolesByElement: roles,
    getRoleForElement: roles ? (id: string) => roles[id] ?? "unknown" : undefined,
    getParentId: parents ? (id: string) => parents[id] ?? null : undefined,
    getChildrenIds: children ? (id: string) => children[id] ?? [] : undefined,
    getAncestorIds: parents
      ? (id: string) => {
          const ancestors: string[] = [];
          let cur = parents[id] ?? null;
          while (cur) {
            ancestors.push(cur);
            cur = parents[cur] ?? null;
          }
          return ancestors;
        }
      : undefined,
    getClassNamesForElement: classNames ? (id: string) => classNames[id] ?? [] : undefined,
    parseClass: opts.parseClass,
    grammarElementSeparator: opts.grammarElementSeparator,
    getTagName: tags ? (id: string) => tags[id] ?? null : undefined,
    getElementType: elTypes ? (id: string) => elTypes[id] ?? null : undefined,
  };
}

// ── Page analysis args factory ─────────────────────────────────────

export interface PageAnalysisArgsOptions {
  rolesByElement?: RolesByElement;
  parentMap?: Record<string, string | null>;
  childrenMap?: Record<string, string[]>;
  styles?: StyleWithElement[];
  tagMap?: Record<string, string | null>;
  elementTypeMap?: Record<string, string | null>;
  ruleConfigs?: Record<string, { enabled: boolean; severity: Severity }>;
  siteComponentNameById?: ReadonlyMap<string, string>;
  componentIdByElementId?: ReadonlyMap<string, string>;
}

export function createPageAnalysisArgs(opts: PageAnalysisArgsOptions = {}): PageAnalysisArgs {
  const rolesByElement = opts.rolesByElement ?? {};
  const parentMap = opts.parentMap ?? {};
  const childrenMap = opts.childrenMap ?? {};

  const graph: ElementGraph = {
    getParentId: (id: string) => parentMap[id] ?? null,
    getChildrenIds: (id: string) => childrenMap[id] ?? [],
    getAncestorIds: (id: string) => {
      const ancestors: string[] = [];
      let cur = parentMap[id] ?? null;
      while (cur) {
        ancestors.push(cur);
        cur = parentMap[cur] ?? null;
      }
      return ancestors;
    },
    getDescendantIds: (id: string) => {
      const result: string[] = [];
      const stack = [...(childrenMap[id] ?? [])];
      while (stack.length > 0) {
        const child = stack.pop();
        if (child === undefined) break;
        result.push(child);
        stack.push(...(childrenMap[child] ?? []));
      }
      return result;
    },
    getTag: async (id: string) => opts.tagMap?.[id] ?? null,
  };

  return {
    rolesByElement,
    graph,
    styles: opts.styles ?? [],
    getRoleForElement: (id: string) => rolesByElement[id] ?? "unknown",
    getRuleConfig: (ruleId: string) => ({
      ruleId,
      enabled: opts.ruleConfigs?.[ruleId]?.enabled ?? true,
      severity: opts.ruleConfigs?.[ruleId]?.severity ?? "error",
      customSettings: {} as any,
    }),
    getTagName: (id: string) => opts.tagMap?.[id] ?? null,
    getElementType: (id: string) => opts.elementTypeMap?.[id] ?? null,
    siteComponentNameById: opts.siteComponentNameById,
    componentIdByElementId: opts.componentIdByElementId,
  };
}

// ── Element graph factory ──────────────────────────────────────────

export function createMockElementGraph(
  parentMap: Record<string, string | null>,
  childrenMap: Record<string, string[]> = {}
): ElementGraph {
  return {
    getParentId: (id) => parentMap[id] ?? null,
    getChildrenIds: (id) => childrenMap[id] ?? [],
    getAncestorIds: (id) => {
      const ancestors: string[] = [];
      let cur = parentMap[id] ?? null;
      while (cur) {
        ancestors.push(cur);
        cur = parentMap[cur] ?? null;
      }
      return ancestors;
    },
    getDescendantIds: (id) => {
      const result: string[] = [];
      const stack = [...(childrenMap[id] ?? [])];
      while (stack.length > 0) {
        const child = stack.pop();
        if (child === undefined) break;
        result.push(child);
        stack.push(...(childrenMap[child] ?? []));
      }
      return result;
    },
    getTag: async () => null,
  };
}
