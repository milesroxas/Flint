import { describe, it, expect } from "vitest";
import { lumosGrammar } from "@/features/linter/grammar/lumos.grammar";
import { lumosRoles } from "@/features/linter/roles/lumos.roles";

function roleOf(name: string) {
  return lumosRoles.mapToRole(lumosGrammar.parse(name));
}

describe("lumosRoles.mapToRole", () => {
  it("maps known element tokens to roles", () => {
    expect(roleOf("card_wrap")).toBe("componentRoot");
    expect(roleOf("section_container")).toBe("container");
    expect(roleOf("card_layout")).toBe("layout");
    expect(roleOf("article_content")).toBe("content");
    expect(roleOf("card_title")).toBe("title");
    expect(roleOf("card_text")).toBe("text");
    expect(roleOf("card_actions")).toBe("actions");
    expect(roleOf("cta_button")).toBe("button");
    expect(roleOf("nav_link")).toBe("link");
    expect(roleOf("icon_item")).toBe("item");
  });

  it("returns unknown for utilities/components/combos and unmapped tokens", () => {
    expect(roleOf("u-padding")).toBe("unknown");
    expect(roleOf("c-card")).toBe("unknown");
    expect(roleOf("is-active")).toBe("unknown");
    expect(roleOf("card_foobar")).toBe("unknown");
  });
});

describe("lumosRoles.isContainerLike", () => {
  it("detects container-like roles", () => {
    const testCases = [
      { name: "section_container", expected: true },
      { name: "card_layout", expected: true },
      { name: "card_wrap", expected: false },
      { name: "card_title", expected: false }
    ];

    testCases.forEach(({ name, expected }) => {
      const parsed = lumosGrammar.parse(name);
      if (lumosRoles.isContainerLike) {
        expect(lumosRoles.isContainerLike(parsed)).toBe(expected);
      } else {
        throw new Error("isContainerLike method not implemented in lumosRoles");
      }
    });
  });
});


