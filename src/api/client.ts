import axios, { AxiosInstance } from 'axios';
import { RegisterRequest, RegisterResponse, AuthResponse } from '@/features/auth/types/auth.types';
import type { CreateReportDto, Report } from '@/features/reports/types/report.types';
import type { PlaceMapFeature, PlacesNearbyQuery } from '@/types/contracts/places.contract';
import type { RouteRequest, RouteResponse } from '@/types/contracts/navigation.contract';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.26:3000/api';

const client: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
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

export default client;
