export type ShadowReportType = 'SOMBRA';

export type ShadowZoneStatus = 'PENDING' | 'VALIDATED' | 'RESOLVED';

export interface PedestrianCoordinates {
  latitude: number;
  longitude: number;
}

export interface ShadowZone {
  id: string;
  type: ShadowReportType;
  title?: string;
  description?: string;
  location: PedestrianCoordinates;
  status?: ShadowZoneStatus;
  coverageRadiusMeters?: number;
  createdAt?: string;
}

export interface PedestrianMapViewport {
  center: PedestrianCoordinates;
  proximityRadiusMeters: number;
}

export const PEDESTRIAN_PROXIMITY_RADIUS_METERS = {
  min: 300,
  max: 500,
  default: 400,
} as const;

export const DEFAULT_PEDESTRIAN_CENTER: PedestrianCoordinates = {
  latitude: 10.9878,
  longitude: -74.7889,
};
