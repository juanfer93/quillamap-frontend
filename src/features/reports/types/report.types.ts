export enum ReportType {
  ARROYO = 'arroyo',
  BACHE = 'bache',
  TRAFICO = 'trafico',
  ACCIDENTE = 'accidente',
  SOMBRA = 'sombra',
  OTRO = 'otro',
}

export enum ReportStatus {
  ACTIVO = 'activo',
  RESUELTO = 'resuelto',
}

export interface ReportPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface CreateReportDto {
  type: ReportType;
  description: string;
  location: ReportPoint;
}

export interface Report {
  id: string;
  type: ReportType;
  description: string;
  location: ReportPoint;
  status: ReportStatus;
  profileId: string;
  createdAt: string;
}
