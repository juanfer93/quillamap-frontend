import { create } from 'zustand';
import type {
  SecurityHeatmapPointContract,
  SecurityHeatmapResponseContract,
} from '@/types/contracts/security.contract';

const EARTH_RADIUS_METERS = 6_371_008.8;
const OPTIMISTIC_COVERAGE_METERS = 100;

const toRadians = (value: number): number => (value * Math.PI) / 180;

const getDistanceMeters = (a: SecurityHeatmapPointContract, b: SecurityHeatmapPointContract): number => {
  const deltaLatitude = toRadians(b.latitude - a.latitude);
  const deltaLongitude = toRadians(b.longitude - a.longitude);
  const aLatitude = toRadians(a.latitude);
  const bLatitude = toRadians(b.latitude);
  const haversine =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(aLatitude) * Math.cos(bLatitude) * Math.sin(deltaLongitude / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine));
};

const mergeLocalSecurityPoints = (
  heatmap: SecurityHeatmapResponseContract,
  localPoints: SecurityHeatmapPointContract[]
): SecurityHeatmapResponseContract => {
  const uncoveredPoints = localPoints.filter(
    (localPoint) =>
      !heatmap.points.some((point) => getDistanceMeters(point, localPoint) <= OPTIMISTIC_COVERAGE_METERS)
  );

  if (uncoveredPoints.length === 0) {
    return heatmap;
  }

  return { ...heatmap, points: [...heatmap.points, ...uncoveredPoints] };
};

interface SecurityMapState {
  heatmap: SecurityHeatmapResponseContract | null;
  isSecurityMapLoading: boolean;
  securityMapError: string | null;
  localSecurityPoints: SecurityHeatmapPointContract[];
  setSecurityHeatmap: (heatmap: SecurityHeatmapResponseContract | null) => void;
  setSecurityMapError: (message: string | null) => void;
  setSecurityMapLoading: (isLoading: boolean) => void;
  addLocalSecurityPoint: (point: SecurityHeatmapPointContract) => void;
}

export const useSecurityMapStore = create<SecurityMapState>((set) => ({
  heatmap: null,
  isSecurityMapLoading: false,
  securityMapError: null,
  localSecurityPoints: [],
  setSecurityHeatmap: (heatmap) =>
    set((state) => {
      if (!heatmap) {
        return { heatmap: null, securityMapError: null };
      }

      return {
        heatmap: mergeLocalSecurityPoints(heatmap, state.localSecurityPoints),
        securityMapError: null,
      };
    }),
  setSecurityMapError: (securityMapError) => set({ securityMapError, isSecurityMapLoading: false }),
  setSecurityMapLoading: (isSecurityMapLoading) => set({ isSecurityMapLoading }),
  addLocalSecurityPoint: (point) =>
    set((state) => ({
      localSecurityPoints: [
        ...state.localSecurityPoints.filter((candidate) => candidate.clusterId !== point.clusterId),
        point,
      ],
    })),
}));
