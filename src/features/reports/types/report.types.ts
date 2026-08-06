export enum ReportType {
  ARROYO = 'arroyo',
  BACHE = 'bache',
  TRAFICO = 'trafico',
  ACCIDENTE = 'accidente',
  SOMBRA = 'sombra',
  INSEGURIDAD = 'inseguridad',
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

export interface ReportEvidenceImage {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
}

export interface ReportTypeOption {
  type: ReportType;
  label: string;
  description: string;
  defaultDescription: string;
  evidencePrompt: string;
  evidenceRequired?: boolean;
}

export interface CreateReportDto {
  type: ReportType;
  description: string;
  location: ReportPoint;
  dangerLevel?: number;
  evidenceImage?: ReportEvidenceImage | null;
}

export interface Report {
  id: string;
  type: ReportType;
  description: string;
  location: ReportPoint;
  status: ReportStatus;
  profileId: string;
  createdAt: string;
  imageUrl?: string | null;
  dangerLevel?: number | null;
}
