import client from './client';
import { RegisterRequest, RegisterResponse, AuthResponse } from '@/features/auth/types/auth.types';

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
