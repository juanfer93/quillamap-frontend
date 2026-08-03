import client from './client';
import type {
  TransitCommunityValidationRequest,
  TransitCommunityValidationResponse,
  TransitBusSuggestionsResponse,
  TransitMapResponse,
  TransitRouteRequest,
  TransitRouteResponse,
  TransitTransmetroSuggestionsResponse,
} from '@/types/contracts/transit.contract';

export const transitApi = {
  getRouteMap: async (): Promise<TransitMapResponse> => {
    const response = await client.get<TransitMapResponse>('/transit/routes/map');
    return response.data;
  },

  calculateItineraries: async (routeRequest: TransitRouteRequest): Promise<TransitRouteResponse> => {
    const response = await client.post<TransitRouteResponse>('/transit/itineraries', routeRequest);
    return response.data;
  },

  getBusSuggestions: async (routeRequest: TransitRouteRequest): Promise<TransitBusSuggestionsResponse> => {
    const response = await client.post<TransitBusSuggestionsResponse>('/transit/routes/suggestions', routeRequest);
    return response.data;
  },

  getTransmetroSuggestions: async (
    routeRequest: TransitRouteRequest
  ): Promise<TransitTransmetroSuggestionsResponse> => {
    const response = await client.post<TransitTransmetroSuggestionsResponse>(
      '/transit/transmetro/suggestions',
      routeRequest
    );
    return response.data;
  },

  validateRoutePresence: async (
    validationRequest: TransitCommunityValidationRequest,
    accessToken: string
  ): Promise<TransitCommunityValidationResponse> => {
    const response = await client.post<TransitCommunityValidationResponse>(
      '/transit/community-validations',
      validationRequest,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  },
};
