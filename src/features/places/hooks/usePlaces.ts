import { useEffect, useMemo, useState } from 'react';
import { placesApi } from '@/api/client';
import type { PlaceMapFeature, PlacesNearbyQuery } from '@/types/contracts/places.contract';
import { DEFAULT_PLACES } from '../data/defaultPlaces';

const normalizePlace = (place: PlaceMapFeature): PlaceMapFeature => ({
  ...place,
  coordinate: place.coordinate ?? {
    latitude: place.location.coordinates[1],
    longitude: place.location.coordinates[0],
  },
});

const mergeRequiredDefaultPlaces = (places: PlaceMapFeature[]): PlaceMapFeature[] => {
  const seenIds = new Set(places.map((place) => place.id));
  const missingDefaults = DEFAULT_PLACES.filter((place) => !seenIds.has(place.id));

  return [...places, ...missingDefaults];
};

export const usePlaces = (query: PlacesNearbyQuery) => {
  const [remotePlaces, setRemotePlaces] = useState<PlaceMapFeature[] | null>(null);

  const queryKey = `${query.lat}:${query.lng}:${query.radius ?? 2500}:${query.limit ?? 180}:${query.category ?? 'all'}`;

  useEffect(() => {
    let isMounted = true;

    placesApi
      .findNearby(query)
      .then((places) => {
        if (isMounted) {
          setRemotePlaces(places.map(normalizePlace));
        }
      })
      .catch(() => {
        if (isMounted) {
          setRemotePlaces(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [queryKey]);

  const places = useMemo(
    () => (remotePlaces && remotePlaces.length > 0 ? mergeRequiredDefaultPlaces(remotePlaces) : DEFAULT_PLACES),
    [remotePlaces]
  );

  return { places };
};
