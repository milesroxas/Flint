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

  it("converts rgb and rgba to hex", () => {
    expect(convertColorToHex("rgb(255, 0, 0)")).toBe("#ff0000");
    expect(convertColorToHex("rgba(255, 0, 0, 1)")).toBe("#ff0000");
  });

  it("converts hsl to hex", () => {
    expect(convertColorToHex("hsl(0, 100%, 50%)")).toBe("#ff0000");
  });
});
