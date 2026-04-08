import { afterEach, describe, expect, it, vi } from "vitest";
import { enrichSiteComponentNamesForDefinitions } from "@/entities/component/services/component-catalog.service";

describe("enrichSiteComponentNamesForDefinitions", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns base map unchanged when window.webflow.getComponent is missing", async () => {
    vi.stubGlobal("window", { webflow: {} });
    const base = new Map([["a", "A"]]);
    const out = await enrichSiteComponentNamesForDefinitions(base, ["missing-id"]);
    expect(out.get("a")).toBe("A");
    expect(out.has("missing-id")).toBe(false);
  });

  it("fills missing definition names via webflow.getComponent", async () => {
    const getComponent = vi.fn(async (id: string) => ({
      id,
      getName: async () => "Global Styles",
    }));
    vi.stubGlobal("window", { webflow: { getComponent } });

    const base = new Map<string, string>();
    const out = await enrichSiteComponentNamesForDefinitions(base, ["cmp-uuid-1"]);

    expect(getComponent).toHaveBeenCalledWith("cmp-uuid-1");
    expect(out.get("cmp-uuid-1")).toBe("Global Styles");
  });

  it("does not call getComponent for ids already in the base map", async () => {
    const getComponent = vi.fn();
    vi.stubGlobal("window", { webflow: { getComponent } });

    const base = new Map([["cmp-1", "Global Styles"]]);
    const out = await enrichSiteComponentNamesForDefinitions(base, ["cmp-1"]);

    expect(getComponent).not.toHaveBeenCalled();
    expect(out.get("cmp-1")).toBe("Global Styles");
  });

  it("dedupes repeated definition ids", async () => {
    const getComponent = vi.fn(async (id: string) => ({
      id,
      getName: async () => "Global Styles",
    }));
    vi.stubGlobal("window", { webflow: { getComponent } });

    await enrichSiteComponentNamesForDefinitions(new Map(), ["x", "x", "x"]);
    expect(getComponent).toHaveBeenCalledTimes(1);
  });
});
