/**
 * While editing a component/symbol in the Designer, `webflow.getCurrentComponent()` returns the
 * active definition. This is distinct from a placed `ComponentInstance` on the canvas — graph and
 * `componentIdByElementId` may not reflect “inside component” for those inner elements.
 */

export async function getIsEditingComponentDefinition(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const wf = (window as any).webflow;
    if (!wf || typeof wf.getCurrentComponent !== "function") return false;
    const comp = await wf.getCurrentComponent();
    return comp != null;
  } catch {
    return false;
  }
}
