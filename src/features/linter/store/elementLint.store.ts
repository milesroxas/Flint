import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { ensureLinterInitialized } from "@/features/linter/model/linter.factory";
import { scanSelectedElement } from "@/features/linter/use-cases/scan-selected-element";
import type { RuleResult } from "@/features/linter/model/rule.types";
import type { ElementRole } from "@/features/linter/model/linter.types";
import { createDebugger } from "@/shared/utils/debug";
import { toElementKey } from "@/entities/element/lib/id";

// Intentionally unused type guard removed to satisfy no-unused-vars rule; access via window.webflow at runtime

interface ElementLintState {
  results: RuleResult[];
  classNames: string[];
  roles: ElementRole[];
  loading: boolean;
  error: string | null;
  structuralContext: boolean;
  inComponentContext: boolean;
  selectedIsComponentInstance: boolean;
  autoEnterEnabled: boolean;
  lastSelectedElementKey: string | null;
  componentElementIds: string[]; // normalized ids for elements within current component context
  currentComponentId: string | null; // component instance id we entered
}

interface ElementLintActions {
  refresh: () => Promise<void>;
  clear: () => void;
  setStructuralContext: (enabled: boolean) => void;
  enterComponentContext: () => Promise<void>;
  exitComponentContext: () => Promise<void>;
}

type ElementLintStore = ElementLintState & ElementLintActions;

const initialState: ElementLintState = {
  results: [],
  classNames: [],
  roles: [],
  loading: false,
  error: null,
  structuralContext: false, // Default to enabled for better detection
  inComponentContext: false,
  selectedIsComponentInstance: false,
  autoEnterEnabled: true,
  lastSelectedElementKey: null,
  componentElementIds: [],
  currentComponentId: null,
};

const debug = createDebugger("element-lint-store");

export const useElementLintStore = create<ElementLintStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      refresh: async () => {
        if (get().loading) return;
        try {
          ensureLinterInitialized("balanced");
          set({ loading: true, error: null });
          const wf: any = (window as any).webflow;
          if (!wf || typeof wf.getSelectedElement !== "function") {
            set({
              results: [],
              classNames: [],
              roles: [],
              loading: false,
              // preserve inComponentContext; environment lacks Designer APIs
              selectedIsComponentInstance: false,
            });
            return;
          }
          const el = await wf.getSelectedElement();
          const isComponentInstance = (el as any)?.type === "ComponentInstance";
          debug.log(
            "refresh: selected element type",
            (el as any)?.type,
            "structuralContext",
            get().structuralContext
          );
          set({
            selectedIsComponentInstance: !!isComponentInstance,
            lastSelectedElementKey: el ? toElementKey(el as any) : null,
          });
          if (
            !el ||
            (typeof el.getStyles !== "function" &&
              !(get().structuralContext && isComponentInstance))
          ) {
            debug.warn(
              "refresh: skipping lint; getStyles missing and not component in structural mode"
            );
            set({ results: [], classNames: [], roles: [], loading: false });
            return;
          }
          const state = get();
          const results = await scanSelectedElement(
            el,
            state.structuralContext
          );
          set({
            results,
            classNames: [],
            roles: [],
            loading: false,
            // Do not infer inComponentContext from selection; only set on explicit enter/exit
          });
        } catch (err: unknown) {
          // eslint-disable-next-line no-console
          console.error("[ElementLintStore] refresh failed", err);
          set({
            ...initialState,
            error:
              err instanceof Error ? err.message : "Failed to lint element",
          });
        }
      },

      clear: () => set({ ...initialState }),

      setStructuralContext: (enabled: boolean) => {
        const wasEnabled = get().structuralContext;
        set({ structuralContext: enabled });

        // If structural context is turned off while inside a component, exit first
        if (wasEnabled && !enabled && get().inComponentContext) {
          void get().exitComponentContext();
          return;
        }

        // Auto-refresh when structural context setting changes
        const state = get();
        if (!state.loading) {
          void state.refresh();
        }
      },

      enterComponentContext: async () => {
        try {
          const wf: any = (window as any).webflow;
          const state = get();
          if (!state.structuralContext) return; // only meaningful in structural mode
          if (!wf || typeof wf.getSelectedElement !== "function") return;
          const el = await wf.getSelectedElement();
          const isComponentInstance = (el as any)?.type === "ComponentInstance";
          if (!isComponentInstance) return;
          if (typeof wf.enterComponent === "function") {
            (window as any).__flowlint_ignoreNextSelectedEvent = true;
            await wf.enterComponent(el);
          }
          // After entering, capture all element ids within this component instance.
          // Prefer Designer-context APIs which are scoped to the component editor.
          let componentElementIds: string[] = [];
          let currentComponentId: string | null = null;
          try {
            // Try context-root based id first
            if (typeof wf.getRootElement === "function") {
              const root = await wf.getRootElement();
              currentComponentId = (root as any)?.id?.component || null;

              // Prefer context-scoped getAllElements when available
              if (typeof wf.getAllElements === "function") {
                const inside = await wf.getAllElements();
                if (Array.isArray(inside) && inside.length > 0) {
                  componentElementIds = inside.map((e: any) => toElementKey(e));
                }
              }

              // Fallback: traverse from root
              if (componentElementIds.length === 0 && root) {
                const queue: any[] = [root];
                while (queue.length) {
                  const node = queue.shift();
                  componentElementIds.push(toElementKey(node));
                  if (typeof node?.getChildren === "function") {
                    const children = await node.getChildren();
                    if (Array.isArray(children) && children.length) {
                      queue.push(...children);
                    }
                  }
                }
              }
            }

            // Final fallback: traverse from the selected instance element
            if (componentElementIds.length === 0 && el) {
              currentComponentId = currentComponentId ?? (el as any)?.id?.component ?? null;
              const queue: any[] = [el];
              while (queue.length) {
                const node = queue.shift();
                componentElementIds.push(toElementKey(node));
                if (typeof node?.getChildren === "function") {
                  const children = await node.getChildren();
                  if (Array.isArray(children) && children.length) {
                    queue.push(...children);
                  }
                }
              }
            }
          } catch (e) {
            debug.warn("enterComponentContext: failed to collect component elements", e);
          }

          set({
            inComponentContext: true,
            selectedIsComponentInstance: true,
            autoEnterEnabled: true,
            componentElementIds,
            currentComponentId,
          });
          await get().refresh();
        } catch (e) {
          debug.warn("enterComponentContext failed", e);
        }
      },

      exitComponentContext: async () => {
        try {
          const wf: any = (window as any).webflow;
          if (wf && typeof wf.exitComponent === "function") {
            (window as any).__flowlint_ignoreNextSelectedEvent = true;
            await wf.exitComponent();
          }
          // Preserve results; just flip the context flag so UI shows Enter again
          set({
            inComponentContext: false,
            autoEnterEnabled: false,
            componentElementIds: [],
            currentComponentId: null,
          });
        } catch (e) {
          debug.warn("exitComponentContext failed", e);
          set({
            inComponentContext: false,
            autoEnterEnabled: false,
            componentElementIds: [],
            currentComponentId: null,
          });
        }
      },
    }),
      { name: "element-lint-store", serialize: { options: true } }
    )
);

// One-time subscription to Designer selection events
(() => {
  try {
    const wf: any = (window as any).webflow;
    if (!wf || typeof wf.subscribe !== "function") return;
    ensureLinterInitialized("balanced");
    // Global ESC handler: exit component if inside
    const onKeyDown = (e: KeyboardEvent) => {
      try {
        if (e.key === "Escape" && useElementLintStore.getState().inComponentContext) {
          e.preventDefault();
          e.stopPropagation();
          void useElementLintStore.getState().exitComponentContext();
        }
      } catch (e) {
        debug.warn("global ESC handler: exit failed", e);
      }
    };
    window.addEventListener("keydown", onKeyDown, { capture: true } as any);
    document.addEventListener("keydown", onKeyDown, { capture: true } as any);
    wf.subscribe("selectedelement", async (el: any) => {
      const g: any = window as any;
      if (g.__flowlint_ignoreNextSelectedEvent) {
        g.__flowlint_ignoreNextSelectedEvent = false;
        return;
      }
      const isComponentInstance = (el as any)?.type === "ComponentInstance";
      useElementLintStore.setState({
        selectedIsComponentInstance: !!isComponentInstance,
        lastSelectedElementKey: el ? toElementKey(el as any) : null,
        autoEnterEnabled: true, // Re-enable auto-enter on explicit user selection change
      });

      // If we are currently inside a component, and the newly selected element
      // is NOT inside the current component's element set, exit component first
      // then continue with normal selection handling (which may auto-enter a new component
      // or lint the selected element).
      try {
        const state = useElementLintStore.getState();
        const selectedKey = el ? toElementKey(el as any) : null;
        const selectedComponentId = (el as any)?.id?.component || null;
        const isOutside = Boolean(
          state.inComponentContext &&
            selectedKey &&
            state.componentElementIds.length > 0 &&
            (!state.componentElementIds.includes(selectedKey) ||
              (state.currentComponentId &&
                selectedComponentId !== state.currentComponentId))
        );
        if (isOutside) {
          const wf: any = (window as any).webflow;
          if (wf && typeof wf.exitComponent === "function") {
            (window as any).__flowlint_ignoreNextSelectedEvent = true;
            await wf.exitComponent();
          }
          // Update context flags and continue
          useElementLintStore.setState({
            inComponentContext: false,
            autoEnterEnabled: true, // allow auto-enter on the newly selected element
            componentElementIds: [],
            currentComponentId: null,
          });
        }
      } catch (e) {
        // ignore errors in this path; continue with default handling
      }
      if (
        !el ||
        (typeof el.getStyles !== "function" &&
          !(useElementLintStore.getState().structuralContext &&
            isComponentInstance))
      ) {
        useElementLintStore.setState({
          results: [],
          classNames: [],
          roles: [],
          loading: false,
          // leave inComponentContext unchanged; explicit exit handles it
        });
        return;
      }

      // If in Element+Structural context with auto-enter enabled and not already inside,
      // auto-enter the newly-selected component instance first to avoid page/section lint.
      try {
        const state = useElementLintStore.getState();
        if (
          state.structuralContext &&
          !state.inComponentContext &&
          state.autoEnterEnabled &&
          isComponentInstance &&
          typeof state.enterComponentContext === "function"
        ) {
          await state.enterComponentContext();
          return; // enter handler will refresh; do not continue here
        }
      } catch (e) {
        // ignore auto-enter errors and continue with default scanning
      }
      useElementLintStore.setState({ loading: true, error: null });
      try {
        const state = useElementLintStore.getState();
        debug.log("event: structuralContext", state.structuralContext);
        const results = await scanSelectedElement(el, state.structuralContext);
        useElementLintStore.setState({
          results,
          classNames: [],
          roles: [],
          loading: false,
          // Do not infer inComponentContext here
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[ElementLintStore] event lint failed", err);
        useElementLintStore.setState({
          ...initialState,
          error: "Failed to lint element",
        });
      }
    });
  } catch {
    // ignore boot errors in non-designer contexts
  }
})();

// Compatibility hook
export const useElementLint = useElementLintStore;
