import { create } from 'zustand';
import type {
  RouteResponse,
  RouteWaypoint,
} from '@/types/contracts/navigation.contract';

interface NavigationState {
  activeRoute: RouteResponse | null;
  destination: RouteWaypoint | null;
  errorMessage: string | null;
  etaIso: string | null;
  isRouting: boolean;
  remainingDistanceMeters: number;
  clearRoute: () => void;
  failRouting: (message: string) => void;
  setActiveRoute: (route: RouteResponse, destination: RouteWaypoint) => void;
  startRouting: (destination: RouteWaypoint) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  activeRoute: null,
  destination: null,
  errorMessage: null,
  etaIso: null,
  isRouting: false,
  remainingDistanceMeters: 0,
  clearRoute: () => set({
    activeRoute: null,
    destination: null,
    errorMessage: null,
    etaIso: null,
    isRouting: false,
    remainingDistanceMeters: 0,
  }),
  failRouting: (message) => set({
    errorMessage: message,
    isRouting: false,
  }),
  setActiveRoute: (route, destination) => set({
    activeRoute: route,
    destination,
    errorMessage: null,
    etaIso: route.etaIso ?? null,
    isRouting: false,
    remainingDistanceMeters: route.distanceMeters,
  }),
  startRouting: (destination) => set({
    destination,
    errorMessage: null,
    isRouting: true,
  }),
}));
