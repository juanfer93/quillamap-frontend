import axios, { AxiosInstance } from 'axios';
import { RegisterRequest, RegisterResponse } from '@/features/auth/types/auth.types';

let client: AxiosInstance;

function getClient(): AxiosInstance {
  if (!client) {
    console.log(`[getClient] Creating axios client with baseURL: ${process.env.EXPO_PUBLIC_API_URL}`);
    client = axios.create({
      baseURL: process.env.EXPO_PUBLIC_API_URL,
      timeout: 60000, // 60 segundos de timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
  return client;
}

export const authApi = {
  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    const response = await getClient().post<RegisterResponse>('/auth/register', userData);
    return response.data;
  },
};

// Proxy para el cliente de axios, para asegurar la inicialización perezosa
const clientProxy = new Proxy({}, {
  get: (target, prop) => {
    return (...args: any[]) => {
        const instance = getClient();
        // @ts-ignore
        return instance[prop](...args);
    }
  }
});

export default clientProxy as AxiosInstance;
