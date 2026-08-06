import { create } from 'zustand';

interface LayerState {
  isSecurityMapEnabled: boolean;
  setSecurityMapEnabled: (isEnabled: boolean) => void;
  toggleSecurityMap: () => void;
}

export const useLayerStore = create<LayerState>((set) => ({
  isSecurityMapEnabled: false,
  setSecurityMapEnabled: (isSecurityMapEnabled) => set({ isSecurityMapEnabled }),
  toggleSecurityMap: () => set((state) => ({ isSecurityMapEnabled: !state.isSecurityMapEnabled })),
}));
