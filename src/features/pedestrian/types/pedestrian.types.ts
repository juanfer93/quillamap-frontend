import type { ReactNode } from 'react';
import type { QuillaMapThermalComfortRoute } from '@/components/maps/QuillaMap.types';
import type { PlaceMapFeature } from '@/types/contracts/places.contract';
import type { PedestrianCoordinates, ShadowZone } from '../schemas/pedestrian.schema';

export interface PedestrianMapContainerProps {
  shadowZones: ShadowZone[];
  themeMode?: 'light' | 'dark';
  initialCenter?: PedestrianCoordinates;
  places?: PlaceMapFeature[];
  showHeader?: boolean;
  onShadowZonePress?: (zone: ShadowZone) => void;
  onMapPress?: (coordinate: PedestrianCoordinates) => void;
  selectedShadowCoordinate?: PedestrianCoordinates | null;
  profileTools?: ReactNode;
  renderProfileTools?: (transitRoutesSection: ReactNode | null) => ReactNode;
  licensePlate?: string | null;
  thermalComfortRoute?: QuillaMapThermalComfortRoute | null;
  suppressMapDecorations?: boolean;
}
