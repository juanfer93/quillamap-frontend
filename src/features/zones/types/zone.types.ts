export enum RestrictionType {
    PARRILLERO = 'PARRILLERO',
    NOCTURNA = 'NOCTURNA',
    PICO_Y_PLACA = 'PICO_Y_PLACA',
  }
  
  export interface Zone {
    id: string;
    name: string;
    jurisdiction: string;
    description?: string;
    boundary: {
      type: 'Polygon' | 'MultiPolygon';
      coordinates: number[][][];
    };
    restriction_type: RestrictionType;
    rules: {
      allowed_hours?: string[];
      prohibited_vehicles?: string[];
      notes?: string;
    };
  }