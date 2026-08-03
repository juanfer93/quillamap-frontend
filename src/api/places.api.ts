import client from './client';
import type { PlaceMapFeature, PlacesNearbyQuery } from '@/types/contracts/places.contract';

export const placesApi = {
  findNearby: async (params: PlacesNearbyQuery): Promise<PlaceMapFeature[]> => {
    const response = await client.get<PlaceMapFeature[]>('/places', { params });
    return response.data;
  },
};
