import axios from 'axios';
import { RegisterRequest, RegisterResponse } from '@/features/auth/types/auth.types';

const client = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authApi = {
  // This function is now correctly typed to return a Promise that resolves to a RegisterResponse object.
  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    // We perform a POST request, and we tell Axios that the response data will be of type RegisterResponse.
    const response = await client.post<RegisterResponse>('/api/auth/register', userData);
    // Axios wraps the response in a 'data' property, so we return response.data to get the actual RegisterResponse object.
    return response.data;
  }
}

export default client;
