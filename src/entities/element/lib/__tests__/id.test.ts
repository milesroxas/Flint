import { describe, expect, it, vi } from "vitest";
import { getElementTag, toElementKey } from "@/entities/element/lib/id";

describe("toElementKey", () => {
  it("reads nested Webflow id shape", () => {
    expect(toElementKey({ id: { element: "el-1" } })).toBe("el-1");
  });

  it("falls back to id string or nodeId", () => {
    expect(toElementKey({ id: "direct" })).toBe("direct");
    expect(toElementKey({ nodeId: "node" })).toBe("node");
  });

  it("returns empty string for missing identifiers", () => {
    expect(toElementKey({})).toBe("");
  });
});

describe("getElementTag", () => {
  it("returns tag from getTag when present", async () => {
    const el = { getTag: vi.fn().mockResolvedValue("div") };
    await expect(getElementTag(el)).resolves.toBe("div");
  });

  it("returns null when getTag is missing", async () => {
    await expect(getElementTag({})).resolves.toBeNull();
  });
});
