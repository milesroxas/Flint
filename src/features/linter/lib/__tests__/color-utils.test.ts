import { describe, expect, it } from "vitest";
import { convertColorToHex } from "@/features/linter/lib/color-utils";

describe("convertColorToHex", () => {
  it("passes through hex values", () => {
    expect(convertColorToHex("#ff4444")).toBe("#ff4444");
  });

  it("passes through named colors", () => {
    expect(convertColorToHex("red")).toBe("red");
    expect(convertColorToHex("Blue")).toBe("Blue");
  });
});
