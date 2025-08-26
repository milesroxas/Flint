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
        set({
          severityTilesVisible: true,
          isLinting: false,
        });
      },

      startSeverityCounts: () => {
        set({
          severityCountsAnimating: true,
        });
      },

      completeSeverityAnimation: () => {
        set({
          severityAnimationComplete: true,
          severityCountsAnimating: false,
        });
      },

      showViolations: () => {
        const state = get();
        if (state.severityAnimationComplete) {
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
