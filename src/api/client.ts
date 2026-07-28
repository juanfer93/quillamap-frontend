import axios, { AxiosInstance } from 'axios';
import { RegisterRequest, RegisterResponse, AuthResponse } from '@/features/auth/types/auth.types';
import type { CreateReportDto, Report } from '@/features/reports/types/report.types';
import type { PlaceMapFeature, PlacesNearbyQuery } from '@/types/contracts/places.contract';
import type { RouteRequest, RouteResponse } from '@/types/contracts/navigation.contract';
import type {
  TransitCommunityValidationRequest,
  TransitCommunityValidationResponse,
  TransitBusSuggestionsResponse,
  TransitMapResponse,
  TransitRouteRequest,
  TransitRouteResponse,
  TransitTransmetroSuggestionsResponse,
} from '@/types/contracts/transit.contract';

const getApiUrl = (): string => {
  if (typeof window !== 'undefined' && window.location.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:3000/api`;
  }

  return process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.26:3000/api';
};

const API_URL = getApiUrl();

const client: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log(`Axios client created with baseURL: ${API_URL}`);

export const authApi = {
  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    const response = await client.post<RegisterResponse>('/auth/register', {
      ...userData,
      email: userData.email.trim().toLowerCase(),
    });
    return response.data;
  },
};

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await client.post<AuthResponse>('/auth/login', {
      email: email.trim().toLowerCase(), 
      password,
    });
    return response.data;
  },
};

export const reportsApi = {
  create: async (reportData: CreateReportDto, accessToken: string): Promise<Report> => {
    const response = await client.post<Report>('/reports', reportData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  },

  findNearby: async (params: { lat: number; lng: number; radius?: number }): Promise<Report[]> => {
    const response = await client.get<Report[]>('/reports', { params });
    return response.data;
  },
};

export const placesApi = {
  findNearby: async (params: PlacesNearbyQuery): Promise<PlaceMapFeature[]> => {
    const response = await client.get<PlaceMapFeature[]>('/places', { params });
    return response.data;
  },
};

export const navigationApi = {
  calculateRoute: async (routeRequest: RouteRequest): Promise<RouteResponse> => {
    const response = await client.post<RouteResponse>('/navigation/route', routeRequest);
    return response.data;
  },
};

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

export default client;
