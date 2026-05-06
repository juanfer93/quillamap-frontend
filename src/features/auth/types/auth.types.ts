export interface RegisterRequest {
    name: string;
    email: string;
    vehicleType: 'peaton' | 'turista' | 'moto' | 'carro';
    carType?: 'particular' | 'taxi';
    plate?: string;
  }
  
  export interface RegisterResponse {
    success: boolean;
    message: string;
    data: {
      id: number;
      name: string;
      email: string;
      vehicleType: 'peaton' | 'turista' | 'moto' | 'carro';
      carType?: 'particular' | 'taxi';
      plate?: string;
    };
  }
  