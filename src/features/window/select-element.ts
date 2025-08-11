/*
 Minimal helper to select a Designer element by its id using the official
 Webflow Designer API method `webflow.setSelectedElement(element)`.
 Falls back to dispatching the existing "flowlint:highlight" event if the
 API is unavailable. Designed for use in UI click handlers.
*/

const DEBUG_SELECT_ELEMENT = true;
const dbg = (...args: unknown[]) => {
  if (DEBUG_SELECT_ELEMENT && import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug("[flowlint] select-element:", ...args);
  }
};

/** Attempt to normalize an element id from various possible shapes */
function getElementIdFromAnyElement(element: any): string | undefined {
  if (!element) return undefined;
  // Common shapes: direct string/number id, nested id.element
  // Cast cautiously and stringify for comparison
  const directId = (element as any).id;
  if (typeof directId === "string" || typeof directId === "number") {
    return String(directId);
  }
  const nestedId = (element as any).id?.element;
  if (typeof nestedId === "string" || typeof nestedId === "number") {
    return String(nestedId);
  }
  return undefined;
}

export async function selectElementById(elementId: string): Promise<boolean> {
  try {
    if (!elementId) {
      dbg("no elementId provided");
      return false;
    }

    const wf: any = (window as any).webflow;
    const canUseDesignerApi = Boolean(
      wf && typeof wf.setSelectedElement === "function"
    );
    dbg("start", { elementId, canUseDesignerApi });

    if (!canUseDesignerApi) {
      // Preserve existing fallback event so other contexts can handle it
      dbg("designer api unavailable, dispatching fallback event");
      document.dispatchEvent(
        new CustomEvent("flowlint:highlight", { detail: { elementId } })
      );
      return false;
    }

    // Try to resolve the element via Designer API
    let target: any | undefined;
    const hasGetAll = typeof wf.getAllElements === "function";
    if (hasGetAll) {
      const allElements: any[] = await wf.getAllElements();
      dbg("getAllElements size", Array.isArray(allElements) ? allElements.length : 0);
      if (Array.isArray(allElements) && allElements.length > 0) {
        target = allElements.find((el) => {
          const id = getElementIdFromAnyElement(el);
          return id === String(elementId);
        });
      }
    }

    // Fallback: traverse from root using getChildren() if available
    if (!target && typeof wf.getRootElement === "function") {
      dbg("fallback traversal from root");
      const root = await wf.getRootElement();
      if (root) {
        const queue: any[] = [root];
        while (queue.length) {
          const el = queue.shift();
          const id = getElementIdFromAnyElement(el);
          if (id === String(elementId)) {
            target = el;
            dbg("found via traversal");
            break;
          }
          if (typeof el?.getChildren === "function") {
            const children = await el.getChildren();
            if (Array.isArray(children) && children.length) {
              queue.push(...children);
            }
          }
        }
      }
    }

    if (!target) {
      dbg("target not found; dispatching fallback");
      document.dispatchEvent(
        new CustomEvent("flowlint:highlight", { detail: { elementId } })
      );
      return false;
    }

    // Sanity: ensure target has getStyles as per Webflow Designer API
    // https://developers.webflow.com/designer/reference/element-styles/getStyles
    if (typeof target.getStyles !== "function") {
      dbg("target missing getStyles; dispatching fallback");
      document.dispatchEvent(
        new CustomEvent("flowlint:highlight", { detail: { elementId } })
      );
      return false;
    }

    // Mark to ignore the immediate 'selectedelement' event fired by Designer
    (window as any).__flowlint_ignoreNextSelectedEvent = true;
    await wf.setSelectedElement(target);
    dbg("selection success");
    return true;
  } catch (error) {
    // Swallow to avoid breaking UI; selection is best-effort
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error("[flowlint] select-element failed", error);
    }
    return false;
  }
}


