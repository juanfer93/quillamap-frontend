import client from './client';
import type { ThermalComfortGreenCoverage } from '@/features/thermal-comfort/types/thermalComfortRoute.types';

export const thermalComfortApi = {
  findGreenCoverage: async (
    params: { lat: number; lng: number; radius?: number }
  ): Promise<ThermalComfortGreenCoverage[]> => {
    const response = await client.get<ThermalComfortGreenCoverage[]>('/thermal-comfort/green-coverage', { params });
    return response.data;
  },
};
