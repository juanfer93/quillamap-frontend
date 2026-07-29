import type { QuillaMapMode } from '@/components/maps/QuillaMap.types';
import type {
  NavigationMode,
  RoutePreferences,
} from '@/types/contracts/navigation.contract';

export const toRouteNavigationMode = (mode: QuillaMapMode): NavigationMode => {
  if (mode === 'pedestrian') return 'peaton';
  if (mode === 'tourist') return 'turista';
  if (mode === 'motorcycle') return 'moto';
  return 'carro';
};

export const getRoutePreferences = (mode: NavigationMode): RoutePreferences => ({
  prioritizeShade: false,
  prioritizeCulturalLandmarks: mode === 'turista',
  avoidLegalRestrictions: mode === 'moto' || mode === 'carro',
  avoidActiveStreams: true,
});
