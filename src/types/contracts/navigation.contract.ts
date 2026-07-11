export type NavigationMode = 'peaton' | 'turista' | 'moto' | 'carro';

export type RouteEngineProvider = 'osrm' | 'valhalla';

export type RouteLegalStatus = 'allowed' | 'blocked' | 'rerouted';

export type RouteAlertType =
  | 'arroyo_activo'
  | 'pico_y_placa'
  | 'restriccion_parrillero'
  | 'zona_restringida'
  | 'sombra'
  | 'hito_cultural';

export type RouteAlertSeverity = 'info' | 'warning' | 'danger';

export const NAVIGATION_VISUAL_IDENTITY = {
  activeRoute: '#DC2626',
  sharkBlue: '#004574',
  touristGold: '#D4AF37',
} as const;

export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export interface RouteWaypoint extends RouteCoordinate {
  label?: string;
}

export interface RoutePreferences {
  prioritizeShade?: boolean;
  prioritizeCulturalLandmarks?: boolean;
  avoidLegalRestrictions?: boolean;
  avoidActiveStreams?: boolean;
}

export interface RouteRequest {
  origin: RouteWaypoint;
  destination: RouteWaypoint;
  mode: NavigationMode;
  licensePlate?: string;
  preferences?: RoutePreferences;
}

export interface RouteAlert {
  id: string;
  type: RouteAlertType;
  severity: RouteAlertSeverity;
  title: string;
  description?: string;
  distanceMeters?: number;
  penaltySeconds?: number;
}

export interface RouteResponse {
  geometry: RouteCoordinate[];
  distanceMeters: number;
  durationSeconds: number;
  alerts: RouteAlert[];
  provider: RouteEngineProvider;
  legalStatus: RouteLegalStatus;
  etaIso?: string;
}

export interface RouteRiskMatch {
  id: string;
  type: Extract<RouteAlertType, 'arroyo_activo' | 'zona_restringida' | 'pico_y_placa' | 'restriccion_parrillero'>;
  routeIntersects: boolean;
  legalBlock?: boolean;
}

export interface PenalizedRouteCandidate {
  route: RouteResponse;
  totalPenaltySeconds: number;
  isBlocked: boolean;
}
