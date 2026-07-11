import type {
  PenalizedRouteCandidate,
  RouteCoordinate,
  RouteResponse,
  RouteRiskMatch,
} from '@/types/contracts/navigation.contract';

const EARTH_RADIUS_METERS = 6_371_008.8;
export const INFINITE_ROUTE_PENALTY_SECONDS = Number.POSITIVE_INFINITY;

const toRadians = (value: number): number => (value * Math.PI) / 180;

export const calculateDistanceMeters = (
  origin: RouteCoordinate,
  destination: RouteCoordinate
): number => {
  const latDelta = toRadians(destination.latitude - origin.latitude);
  const lngDelta = toRadians(destination.longitude - origin.longitude);
  const originLat = toRadians(origin.latitude);
  const destinationLat = toRadians(destination.latitude);
  const chord =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(originLat) * Math.cos(destinationLat) * Math.sin(lngDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(chord), Math.sqrt(1 - chord));
};

export const calculateRouteDistanceMeters = (geometry: RouteCoordinate[]): number =>
  geometry.slice(1).reduce(
    (total, point, index) => total + calculateDistanceMeters(geometry[index], point),
    0
  );

export const hasRiskIntersection = (matches: RouteRiskMatch[]): boolean =>
  matches.some((match) => match.routeIntersects);

export const getRiskPenaltySeconds = (matches: RouteRiskMatch[]): number =>
  hasRiskIntersection(matches) ? INFINITE_ROUTE_PENALTY_SECONDS : 0;

export const hasLegalBlock = (matches: RouteRiskMatch[]): boolean =>
  matches.some((match) => match.legalBlock === true);

export const penalizeRouteCandidate = (
  route: RouteResponse,
  riskMatches: RouteRiskMatch[]
): PenalizedRouteCandidate => ({
  route,
  totalPenaltySeconds: getRiskPenaltySeconds(riskMatches),
  isBlocked: hasLegalBlock(riskMatches),
});
