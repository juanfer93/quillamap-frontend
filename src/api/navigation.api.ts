import client from './client';
import type { RouteRequest, RouteResponse } from '@/types/contracts/navigation.contract';

export const navigationApi = {
  calculateRoute: async (routeRequest: RouteRequest): Promise<RouteResponse> => {
    const response = await client.post<RouteResponse>('/navigation/route', routeRequest);
    return response.data;
  },
};
