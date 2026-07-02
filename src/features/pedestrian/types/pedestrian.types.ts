import type { PedestrianCoordinates, ShadowZone } from '../schemas/pedestrian.schema';

export interface PedestrianMapContainerProps {
  shadowZones: ShadowZone[];
  themeMode?: 'light' | 'dark';
  initialCenter?: PedestrianCoordinates;
  showHeader?: boolean;
  onShadowZonePress?: (zone: ShadowZone) => void;
  onMapPress?: (coordinate: PedestrianCoordinates) => void;
  selectedShadowCoordinate?: PedestrianCoordinates | null;
}
