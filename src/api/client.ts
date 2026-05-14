import axios, { AxiosInstance } from 'axios';
import { RegisterRequest, RegisterResponse, AuthResponse } from '@/features/auth/types/auth.types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.10:3000/api';

const client: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 60000, 
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log(`Axios client created with baseURL: ${API_URL}`);

export const authApi = {
  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    const response = await client.post<RegisterResponse>('/auth/register', userData);
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

export default client;
