import { create } from 'zustand';

export const TRUTHFUL_REPORT_KARMA_POINTS = 6;

interface KarmaRewardsState {
  karmaPoints: number;
  awardTruthfulReport: () => void;
  resetKarma: () => void;
}

export const useKarmaRewards = create<KarmaRewardsState>()((set) => ({
  karmaPoints: 0,
  awardTruthfulReport: () =>
    set((state) => ({
      karmaPoints: state.karmaPoints + TRUTHFUL_REPORT_KARMA_POINTS,
    })),
  resetKarma: () => set({ karmaPoints: 0 }),
}));
