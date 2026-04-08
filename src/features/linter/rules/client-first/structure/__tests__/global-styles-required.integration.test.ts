/**
 * Pipeline test: page rule receives the same maps the page linter passes from
 * `fetchSiteComponentNameById` + `enrichSiteComponentNamesForDefinitions` and `componentIdByElementId`
 * from lint context.
 */
import { describe, expect, it } from "vitest";
import { clientFirstClassType } from "@/__tests__/helpers/factories";
import type { StyleWithElement } from "@/entities/style/model/style.types";
import { createCFGlobalStylesRequiredRule } from "@/features/linter/rules/client-first/structure/global-styles-required.page";
import { createUtilityClassAnalyzer } from "@/features/linter/services/analyzers/utility-class-analyzer";
import { createRuleRegistry } from "@/features/linter/services/rule-registry";
import { createRuleRunner } from "@/features/linter/services/rule-runner";

const RULE_ID = "cf:structure:global-styles-required";

function runGlobalStylesPageRule(
  styles: StyleWithElement[],
  siteComponentNameById?: Map<string, string>,
  componentIdByElementId?: Map<string, string>
) {
  const registry = createRuleRegistry();
  registry.registerPageRule(createCFGlobalStylesRequiredRule());

  const utilityAnalyzer = createUtilityClassAnalyzer({
    isUtilityName: (name) => clientFirstClassType(name) === "utility",
  });
  utilityAnalyzer.buildPropertyMaps([]);

  const runner = createRuleRunner(registry, utilityAnalyzer, clientFirstClassType);

  return runner.runRulesOnStylesWithContext(
    styles,
    {} as Record<string, never[]>,
    [],
    {},
    () => null,
    () => [],
    () => [],
    undefined,
    undefined,
    () => null,
    () => null,
    false,
    "-",
    undefined,
    siteComponentNameById,
    componentIdByElementId,
    undefined,
    false,
    undefined
  );
}

describe("cf:structure:global-styles-required (rule runner + page maps)", () => {
  it("passes when merged site map contains Global Styles for the page instance definition id", () => {
    const results = runGlobalStylesPageRule([], new Map([["def-1", "Global Styles"]]), new Map([["el-gs", "def-1"]]));
    expect(results.filter((r) => r.ruleId === RULE_ID)).toEqual([]);
  });

  it("passes when only component path matches (no styles on the page)", () => {
    const results = runGlobalStylesPageRule(
      [],
      new Map([["abc", "Global Styles"]]),
      new Map([["instance-root", "abc"]])
    );
    expect(results.filter((r) => r.ruleId === RULE_ID)).toEqual([]);
  });

  it("reports when instance def id maps to a different component name", () => {
    const results = runGlobalStylesPageRule([], new Map([["def-1", "Hero"]]), new Map([["el-x", "def-1"]]));
    const gs = results.filter((r) => r.ruleId === RULE_ID);
    expect(gs).toHaveLength(1);
    expect(gs[0].severity).toBe("suggestion");
  });

  it("reports when maps are omitted (matches page runner before context exists)", () => {
    const results = runGlobalStylesPageRule([]);
    expect(results.filter((r) => r.ruleId === RULE_ID)).toHaveLength(1);
  });
});
