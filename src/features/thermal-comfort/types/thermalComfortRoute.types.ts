import type { QuillaMapShadeRouteSegment } from '@/components/maps/QuillaMap.types';
import type { RouteWaypoint } from '@/types/contracts/navigation.contract';

export type ThermalComfortSearchMode = 'current_location' | 'place';

export type ThermalComfortGreenCoverageType = 'tree' | 'park' | 'grass' | string;

export type ThermalComfortGreenCoverageGeometry =
  | {
      type: 'Point';
      coordinates: [number, number];
    }
  | {
      type: 'LineString';
      coordinates: Array<[number, number]>;
    }
  | {
      type: 'MultiLineString';
      coordinates: Array<Array<[number, number]>>;
    }
  | {
      type: 'Polygon';
      coordinates: Array<Array<[number, number]>>;
    }
  | {
      type: 'MultiPolygon';
      coordinates: Array<Array<Array<[number, number]>>>;
    };

export interface ThermalComfortGreenCoverage {
  id: string;
  osmId?: string | null;
  type: ThermalComfortGreenCoverageType;
  source: string;
  name?: string | null;
  tags?: Record<string, string> | null;
  geometry: ThermalComfortGreenCoverageGeometry;
}

export interface ThermalComfortRoutePreview {
  destination: RouteWaypoint;
  greenCoverageCount: number;
  searchMode: ThermalComfortSearchMode;
  shadeSegments: QuillaMapShadeRouteSegment[];
}
