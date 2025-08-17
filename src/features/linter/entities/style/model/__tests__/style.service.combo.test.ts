import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createStyleService } from "@/entities/style/model/style.service";
import { resetStyleServiceCache } from "@/entities/style/model/style-service-cache";

type MockStyleOpts = {
  id: string;
  name: string;
  hasApi?: boolean;
  apiResult?: boolean;
  apiThrows?: boolean;
};

function makeMockStyle(opts: MockStyleOpts) {
  const { id, name, hasApi = true, apiResult = false, apiThrows = false } = opts;
  const style: any = {
    id,
    getName: vi.fn().mockResolvedValue(name),
    getProperties: vi.fn().mockResolvedValue({}),
  };
  if (hasApi) {
    style.isComboClass = vi.fn().mockImplementation(() => {
      if (apiThrows) return Promise.reject(new Error("API failure"));
      return Promise.resolve(apiResult);
    });
  }
  return style;
}

describe("style.service combo detection (API-first with fallback)", () => {
  const originalWebflow = (globalThis as any).webflow;

  beforeEach(() => {
    resetStyleServiceCache();
  });

  afterEach(() => {
    (globalThis as any).webflow = originalWebflow;
    resetStyleServiceCache();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("uses API result when available, even if it contradicts heuristic", async () => {
    const styles = [
      // API says true while heuristic would be false (no is- prefix or variant-like)
      makeMockStyle({ id: "1", name: "custom_base", hasApi: true, apiResult: true }),
      // API says false while heuristic would be true (has is- prefix)
      makeMockStyle({ id: "2", name: "is-active", hasApi: true, apiResult: false }),
    ];

    (globalThis as any).webflow = {
      getAllStyles: vi.fn().mockResolvedValue(styles),
    };

    const service = createStyleService();
    const all = await service.getAllStylesWithProperties();

    const s1 = all.find((s) => s.id === "1")!;
    const s2 = all.find((s) => s.id === "2")!;

    expect(s1.name).toBe("custom_base");
    expect(s1.isCombo).toBe(true);

    expect(s2.name).toBe("is-active");
    expect(s2.isCombo).toBe(false);
  });

  it("falls back to heuristic when API is missing", async () => {
    const styles = [
      makeMockStyle({ id: "1", name: "is-large", hasApi: false }),
      makeMockStyle({ id: "2", name: "header_wrap", hasApi: false }),
    ];

    (globalThis as any).webflow = {
      getAllStyles: vi.fn().mockResolvedValue(styles),
    };

    const service = createStyleService();
    const all = await service.getAllStylesWithProperties();

    expect(all.find((s) => s.id === "1")!.isCombo).toBe(true);
    expect(all.find((s) => s.id === "2")!.isCombo).toBe(false);
  });

  it("falls back to heuristic when API throws", async () => {
    const styles = [
      makeMockStyle({ id: "1", name: "is-hidden", hasApi: true, apiThrows: true }),
      makeMockStyle({ id: "2", name: "button_primary", hasApi: true, apiThrows: true }),
    ];

    (globalThis as any).webflow = {
      getAllStyles: vi.fn().mockResolvedValue(styles),
    };

    const service = createStyleService();
    const all = await service.getAllStylesWithProperties();

    expect(all.find((s) => s.id === "1")!.isCombo).toBe(true);
    expect(all.find((s) => s.id === "2")!.isCombo).toBe(false);
  });

  it("applies API-first detection for element.getStyles() as well", async () => {
    const element = {
      id: "el-1",
      getStyles: vi.fn().mockResolvedValue([
        // API says false though heuristic says true
        makeMockStyle({ id: "1", name: "is-active", hasApi: true, apiResult: false }),
        // API says true though heuristic says false
        makeMockStyle({ id: "2", name: "custom_box", hasApi: true, apiResult: true }),
        // No API, heuristic true
        makeMockStyle({ id: "3", name: "is-large", hasApi: false }),
      ]),
    } as any;

    const service = createStyleService();
    const applied = await service.getAppliedStyles(element);

    const m = new Map(applied.map((s) => [s.id, s]));
    expect(m.get("1")!.isCombo).toBe(false);
    expect(m.get("2")!.isCombo).toBe(true);
    expect(m.get("3")!.isCombo).toBe(true);
  });
});


