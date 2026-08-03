import axios, { AxiosInstance } from 'axios';

const getApiUrl = (): string => {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:3000/api`;
  }

  return process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.26:3000/api';
};

export const API_URL = getApiUrl();

const client: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log(`Axios client created with baseURL: ${API_URL}`);

export default client;
