import type { PlaceMapFeature } from '@/types/contracts/places.contract';
import type { RouteWaypoint } from '@/types/contracts/navigation.contract';

const COORDINATE_QUERY_PATTERN = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;

const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const getSearchableText = (place: PlaceMapFeature): string => [
  place.name.es,
  place.name.en,
  place.description?.es,
  place.description?.en,
  place.metadata?.address,
].filter(Boolean).join(' ');

const matchesPlace = (place: PlaceMapFeature, query: string): boolean =>
  normalizeText(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => normalizeText(getSearchableText(place)).includes(token));

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
