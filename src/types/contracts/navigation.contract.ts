export type NavigationMode = 'peaton' | 'turista' | 'moto' | 'carro';

export type RouteEngineProvider = 'osrm' | 'valhalla' | 'tomtom' | 'otp';

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

export interface RouteInstruction {
  index: number;
  message: string;
  street?: string;
  distanceMeters?: number;
  durationSeconds?: number;
  coordinate?: RouteCoordinate;
}

export interface RouteAlternativeSummary {
  index: number;
  distanceMeters: number;
  durationSeconds: number;
  geometryPoints: number;
  provider: RouteEngineProvider;
}

export type RouteShadeSegmentSource = 'community_report' | 'green_coverage' | 'park';

export interface RouteShadeSegment {
  id: string;
  source: RouteShadeSegmentSource;
  geometry: RouteCoordinate[];
}

export interface RouteTransitLegSummary {
  id: string;
  type: 'walk' | 'bus' | 'transfer';
  routeShortName?: string;
  agencyKind?: 'transmetro' | 'colectivo';
  fromLabel?: string;
  toLabel?: string;
  distanceMeters: number;
  durationSeconds: number;
}

export interface RouteTransitSummary {
  mode: 'peaton' | 'turista';
  transfers: number;
  riskStatus: 'clear' | 'warning' | 'rerouted' | 'blocked';
  recalculatedForRisk: boolean;
  sourceVersion: string;
  legs: RouteTransitLegSummary[];
}

export interface RouteResponse {
  geometry: RouteCoordinate[];
  distanceMeters: number;
  durationSeconds: number;
  alerts: RouteAlert[];
  provider: RouteEngineProvider;
  legalStatus: RouteLegalStatus;
  etaIso?: string;
  instructions?: RouteInstruction[];
  alternatives?: RouteAlternativeSummary[];
  selectedRouteIndex?: number;
  trafficDelaySeconds?: number;
  shadeSegments?: RouteShadeSegment[];
  transit?: RouteTransitSummary;
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
