export type MobilityMode = 'peaton' | 'turista' | 'moto' | 'carro';

export type VehicleType = 'peaton' | 'particular' | 'taxi' | 'moto';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  Home: undefined;
};

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string; 
  mobility_mode: MobilityMode;
  vehicle_type?: VehicleType; 
  license_plate?: string;    
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    full_name: string | null;
    email: string;
    karma?: number | null;
    mobility_mode?: MobilityMode | null;
    mobilityMode?: MobilityMode | null;
    vehicle_type?: VehicleType | null;
    license_plate?: string | null;
  };
}

export interface RegisterResponse extends AuthResponse {}
