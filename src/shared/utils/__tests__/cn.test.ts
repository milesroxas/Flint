import { describe, expect, it } from "vitest";
import { cn } from "@/shared/utils/cn";

describe("cn", () => {
  it("merges tailwind classes and drops conflicts", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("handles conditional class values", () => {
    expect(cn("base", false && "hidden", "block")).toBe("base block");
  });
});
