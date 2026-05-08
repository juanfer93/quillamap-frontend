export interface RegisterRequest {
    full_name: string;
    email: string;
    password?: string;
    mobility_mode: 'peaton' | 'turista' | 'moto' | 'carro';
    vehicle_type?: 'PARTICULAR' | 'TAXI';
    license_plate?: string;
  }
  
  export interface RegisterResponse {
    success: boolean;
    message: string;
    access_token: string;
    data: {
      id: number;
      full_name: string;
      email: string;
      mobility_mode: 'peaton' | 'turista' | 'moto' | 'carro';
      vehicle_type?: 'PARTICULAR' | 'TAXI';
      license_plate?: string;
    };
  }
  