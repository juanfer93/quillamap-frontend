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