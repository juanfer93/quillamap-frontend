export interface NavigationCoordinates {
  latitude: number;
  longitude: number;
}

export type LocationPermissionStatus = 'granted' | 'denied' | 'prompt' | null;

export interface LocationPermissionState {
  permissionStatus: LocationPermissionStatus;
  currentLocation: NavigationCoordinates | null;
  isRequestingPermission: boolean;
  errorMessage: string | null;
}

export interface ProximityTarget {
  id: string;
  coordinate: NavigationCoordinates;
  radiusMeters?: number;
}

export interface ProximityMatch extends ProximityTarget {
  distanceMeters: number;
  isInAlertRange: boolean;
}
