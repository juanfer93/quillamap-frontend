import type { PlaceMapFeature } from '@/types/contracts/places.contract';
import type { RouteWaypoint } from '@/types/contracts/navigation.contract';

const COORDINATE_QUERY_PATTERN = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;

const normalizeText = (value: string): string => value.trim().toLowerCase();

const matchesPlace = (place: PlaceMapFeature, query: string): boolean =>
  normalizeText(place.name.es).includes(normalizeText(query));

export const resolveDestination = (
  query: string,
  places: PlaceMapFeature[]
): RouteWaypoint | null => {
  const coordinateMatch = query.match(COORDINATE_QUERY_PATTERN);
  if (coordinateMatch) {
    return {
      latitude: Number(coordinateMatch[1]),
      longitude: Number(coordinateMatch[2]),
      label: query.trim(),
    };
  }

  const place = places.find((candidate) => matchesPlace(candidate, query));
  return place ? { ...place.coordinate, label: place.name.es } : null;
};

export const getDestinationSuggestions = (
  query: string,
  places: PlaceMapFeature[]
): PlaceMapFeature[] => {
  const normalizedQuery = normalizeText(query);
  if (normalizedQuery.length < 2) {
    return [];
  }

  return places.filter((place) => matchesPlace(place, normalizedQuery)).slice(0, 4);
};
