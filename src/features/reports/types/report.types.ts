export enum ReportType {
    ARROYO = 'ARROYO',
    RETEN = 'RETEN',
    BACHE = 'BACHE',
    ACCIDENTE = 'ACCIDENTE',
  }
  
  export interface Report {
    id: string;
    type: ReportType;
    description: string;
    location: {
      latitude: number;
      longitude: number;
    };
    status: 'PENDING' | 'VALIDATED' | 'RESOLVED';
    karma_points: number;
    created_at: string;
  }