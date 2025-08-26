import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface AnimationState {
  // Animation phases
  isLinting: boolean;
  severityTilesVisible: boolean;
  severityCountsAnimating: boolean;
  severityAnimationComplete: boolean;
  violationsVisible: boolean;

  // Reset all animations to initial state
  reset: () => void;

  // Phase transitions
  startLinting: () => void;
  showSeverityTiles: () => void;
  startSeverityCounts: () => void;
  completeSeverityAnimation: () => void;
  showViolations: () => void;
}

const initialState = {
  isLinting: false,
  severityTilesVisible: false,
  severityCountsAnimating: false,
  severityAnimationComplete: false,
  violationsVisible: false,
};

export const useAnimationStore = create<AnimationState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      reset: () => {
        console.log(
          "[Animation Store] RESET called - all animations reset to initial state"
        );
        set(initialState);
      },

      startLinting: () => {
        set({
          isLinting: true,
          severityTilesVisible: false,
          severityCountsAnimating: false,
          severityAnimationComplete: false,
          violationsVisible: false,
        });
      },

      showSeverityTiles: () => {
        console.log("[Animation Store] Showing severity tiles");
        set({
          severityTilesVisible: true,
          isLinting: false,
        });
      },

      startSeverityCounts: () => {
        console.log("[Animation Store] Starting severity counts");
        set({
          severityCountsAnimating: true,
        });
      },

      completeSeverityAnimation: () => {
        console.log("[Animation Store] Completing severity animation");
        set({
          severityAnimationComplete: true,
          severityCountsAnimating: false,
        });
      },

      showViolations: () => {
        const state = get();
        if (state.severityAnimationComplete) {
          console.log("[Animation Store] Showing violations");
          set({
            violationsVisible: true,
          });
        }
      },
    }),
    {
      name: "animation-store",
      serialize: { options: true },
    }
  )
);
