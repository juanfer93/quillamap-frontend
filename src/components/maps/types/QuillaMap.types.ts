import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { PlaceMapFeature } from '@/types/contracts/places.contract';
import type { TransitMapResponse } from '@/types/contracts/transit.contract';

export type QuillaMapMode = 'pedestrian' | 'tourist' | 'car' | 'motorcycle';

export interface QuillaMapCoordinate {
  latitude: number;
  longitude: number;
}

export interface QuillaMapShadeZone {
  id: string;
  title: string;
  description?: string;
  coordinate: QuillaMapCoordinate;
  radiusMeters: number;
}

export interface QuillaMapReportMarker {
  id: string;
  type: 'arroyo' | 'bache';
  coordinate: QuillaMapCoordinate;
  description?: string;
}

export interface QuillaMapRoutePoint extends QuillaMapCoordinate {
  id: string;
}

export type QuillaMapShadeRouteSegmentSource = 'community_report' | 'green_coverage' | 'park';

export interface QuillaMapShadeRouteSegment {
  id: string;
  source: QuillaMapShadeRouteSegmentSource;
  geometry: QuillaMapCoordinate[];
}

export interface QuillaMapThermalComfortRoute {
  geometry: QuillaMapCoordinate[];
  shadeSegments: QuillaMapShadeRouteSegment[];
  origin?: QuillaMapCoordinate | null;
  destination?: QuillaMapCoordinate | null;
}

export interface QuillaMapProps {
  mode: QuillaMapMode;
  themeMode?: 'light' | 'dark';
  center: QuillaMapCoordinate;
  shadeZones?: QuillaMapShadeZone[];
  reportMarkers?: QuillaMapReportMarker[];
  showDefaultShadeZones?: boolean;
  routePoints?: QuillaMapRoutePoint[];
  shadeRouteSegments?: QuillaMapShadeRouteSegment[];
  thermalComfortRoute?: QuillaMapThermalComfortRoute | null;
  transitMap?: TransitMapResponse | null;
  places?: PlaceMapFeature[];
  showUserLocation?: boolean;
  showCompassControl?: boolean;
  showZoomControl?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  profileTools?: ReactNode;
  onShadeZonePress?: (zone: QuillaMapShadeZone) => void;
  onPlacePress?: (place: PlaceMapFeature) => void;
  onMapPress?: (coordinate: QuillaMapCoordinate) => void;
  selectedCoordinate?: QuillaMapCoordinate | null;
  destinationCoordinate?: QuillaMapCoordinate | null;
  navigationControl?: {
    hasActiveRoute?: boolean;
    isActive: boolean;
    onCancel?: () => void;
    onPress: () => void;
  };
}
