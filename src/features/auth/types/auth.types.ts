export interface RegisterRequest {
    name: string;
    email: string;
    password?: string;
    mobility_type: 'PEATON' | 'TURISTA' | 'MOTO' | 'CARRO';
    vehicle_type?: 'PARTICULAR' | 'TAXI';
    license_plate?: string;
  }
  
  export interface RegisterResponse {
    success: boolean;
    message: string;
    data: {
      id: number;
      name: string;
      email: string;
      mobility_type: 'PEATON' | 'TURISTA' | 'MOTO' | 'CARRO';
      vehicle_type?: 'PARTICULAR' | 'TAXI';
      license_plate?: string;
    };
  }
  