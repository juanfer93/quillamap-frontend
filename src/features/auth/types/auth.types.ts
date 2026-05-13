export interface RegisterRequest {
    full_name: string;
    email: string;
    password?: string;
    mobility_mode: 'peaton' | 'turista' | 'moto' | 'carro';
    vehicle_type?: 'PARTICULAR' | 'TAXI';
    license_plate?: string;
  }

export interface RegisterResponse {
  user: any;
  accessToken?: string;
}

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  Home: undefined;
};

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    mobility_mode: string;
  };
}