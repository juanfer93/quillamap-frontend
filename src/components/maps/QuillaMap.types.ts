import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

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

export interface QuillaMapRoutePoint extends QuillaMapCoordinate {
  id: string;
}

export interface QuillaMapProps {
  mode: QuillaMapMode;
  themeMode?: 'light' | 'dark';
  center: QuillaMapCoordinate;
  shadeZones?: QuillaMapShadeZone[];
  showDefaultShadeZones?: boolean;
  routePoints?: QuillaMapRoutePoint[];
  showUserLocation?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  onShadeZonePress?: (zone: QuillaMapShadeZone) => void;
  onMapPress?: (coordinate: QuillaMapCoordinate) => void;
  selectedCoordinate?: QuillaMapCoordinate | null;
}
