/**
 * Site component catalog via Designer API `webflow.getAllComponents()`.
 *
 * Webflow documents this as returning components **registered to the site** (the Components
 * list / library), not “components currently placed on this Designer page.” Deleting an
 * instance from the canvas does **not** unregister it; removing it from the site library does.
 *
 * @see https://developers.webflow.com/designer/reference/get-components
 *
 * Maps component definition id → display name from `getName()`.
 */
export async function fetchSiteComponentNameById(): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  try {
    const wf = (typeof window !== "undefined" ? (window as unknown as WebflowApi) : undefined) ?? undefined;
    if (!wf || typeof wf.getAllComponents !== "function") return out;

    const components = await wf.getAllComponents();
    if (!Array.isArray(components)) return out;

    await Promise.all(
      components.map(async (c) => {
        try {
          const name = await c.getName();
          if (c?.id != null && typeof name === "string") {
            out.set(String(c.id), name);
          }
        } catch {
          /* skip */
        }
      })
    );
  } catch {
    /* Designer API unavailable */
  }
  return out;
}
